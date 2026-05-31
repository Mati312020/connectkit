// Integración ARCA (ex AFIP) — WSAA + WSFE
// ─────────────────────────────────────────────────────────────────────────────
// Flujo completo de autenticación:
//   1. Leer cert (.crt) y key (.key) desde env vars (base64)
//   2. Generar TRA (Ticket de Requerimiento de Acceso) como XML
//   3. Firmar el TRA con PKCS#7/CMS usando node-forge
//   4. Enviar al WSAA via SOAP → recibir TA (Ticket de Acceso)
//   5. Usar Token + Sign del TA en cada llamada al WSFE
//
// El TA dura 12 horas. Se cachea en memoria durante el ciclo de vida del proceso.
// En entornos serverless (Vercel), usar una tabla DB o Redis para persistir el token.
// Ver docs/invoicing.md para instrucciones completas de setup.

import * as forge from "node-forge";
import { appConfig } from "@/config/app.config";
import { logError } from "@/lib/logger.server";
import type { ARCAToken } from "./types";

// ── URLs de los servicios ARCA ────────────────────────────────
const WSAA_URLS = {
  testing:    "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
  production: "https://wsaa.afip.gov.ar/ws/services/LoginCms",
} as const;

const WSFE_URLS = {
  testing:    "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
  production: "https://servicios1.afip.gov.ar/wsfev1/service.asmx",
} as const;

export const arcaConfig = {
  wsaaUrl:    WSAA_URLS[appConfig.arca.environment],
  wsfeUrl:    WSFE_URLS[appConfig.arca.environment],
  cuit:       appConfig.arca.cuit.replace(/-/g, ""), // solo números: "20123456789"
  puntoVenta: appConfig.arca.puntoVenta,
};

// ── Cache en memoria ──────────────────────────────────────────
// Válido dentro del mismo proceso. En Vercel/Edge usar Redis o tabla `arc_tokens`.
let _cachedToken: ARCAToken | null = null;

// ── Token de acceso ───────────────────────────────────────────

export async function getARCAToken(): Promise<ARCAToken> {
  // Reutilizar si el token sigue vigente (margen de 5 minutos)
  if (_cachedToken && _cachedToken.expiresAt > new Date(Date.now() + 5 * 60_000)) {
    return _cachedToken;
  }

  const certB64 = process.env.ARCA_CERT;
  const keyB64  = process.env.ARCA_PRIVATE_KEY;

  if (!certB64 || !keyB64) {
    throw new Error(
      "ARCA_CERT y ARCA_PRIVATE_KEY son requeridas. Ver docs/invoicing.md para generarlas."
    );
  }

  const certPem = Buffer.from(certB64, "base64").toString("utf-8");
  const keyPem  = Buffer.from(keyB64,  "base64").toString("utf-8");

  const now            = new Date();
  const expirationTime = new Date(now.getTime() + 12 * 3_600_000);

  // ── 1. Generar TRA (Ticket de Requerimiento de Acceso) ────────
  const tra = buildTRA(now, expirationTime);

  // ── 2. Firmar TRA con PKCS#7 (CMS) ────────────────────────────
  const cms = signTRA(tra, certPem, keyPem);

  // ── 3. Llamar al WSAA via SOAP ────────────────────────────────
  const taXml = await callWSAA(cms);

  // ── 4. Parsear el TA y cachear ────────────────────────────────
  const token = extractTag(taXml, "token");
  const sign  = extractTag(taXml, "sign");
  const expStr = extractTag(taXml, "expirationTime");

  if (!token || !sign) {
    throw new Error(`WSAA: respuesta inválida — no se encontró Token o Sign.\n${taXml}`);
  }

  _cachedToken = {
    token,
    sign,
    expiresAt: expStr ? new Date(expStr) : expirationTime,
  };

  return _cachedToken;
}

// ── Helpers internos ──────────────────────────────────────────

function buildTRA(generationTime: Date, expirationTime: Date): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(generationTime.getTime() / 1000)}</uniqueId>
    <generationTime>${generationTime.toISOString()}</generationTime>
    <expirationTime>${expirationTime.toISOString()}</expirationTime>
  </header>
  <service>wsfe</service>
</loginTicketRequest>`;
}

function signTRA(tra: string, certPem: string, keyPem: string): string {
  const cert       = forge.pki.certificateFromPem(certPem);
  const privateKey = forge.pki.privateKeyFromPem(keyPem);

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(tra, "utf8");
  p7.addCertificate(cert);
  p7.addSigner({
    key: privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      // node-forge espera string ISO para signingTime
      { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
    ],
  });

  p7.sign();

  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return forge.util.encode64(der);
}

async function callWSAA(cms: string): Promise<string> {
  // Importamos soap dinámicamente para evitar problemas en el edge runtime
  const soap = await import("soap");

  // El WSDL del WSAA requiere Basic Auth vacío — el paquete soap lo maneja
  const client = await soap.createClientAsync(`${arcaConfig.wsaaUrl}?WSDL`);
  const [result] = await client.loginCmsAsync({ in0: cms });

  if (!result?.loginCmsReturn) {
    throw new Error("WSAA: respuesta vacía o sin loginCmsReturn");
  }

  return result.loginCmsReturn as string;
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

// ── Crear cliente SOAP del WSFE (cacheado por URL) ────────────

const _wsfeClients: Map<string, Awaited<ReturnType<typeof import("soap")["createClientAsync"]>>> = new Map();

export async function getWSFEClient() {
  const url = `${arcaConfig.wsfeUrl}?WSDL`;

  if (_wsfeClients.has(url)) {
    return _wsfeClients.get(url)!;
  }

  const soap   = await import("soap");
  const client = await soap.createClientAsync(url);
  _wsfeClients.set(url, client);
  return client;
}

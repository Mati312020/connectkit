// WSFE — Emisión de Factura E (Tipo 19)
// Para exportación de servicios digitales al exterior.
// Moneda: puede ser PES, DOL, etc. — cotización desde el BCRA o hardcodeada.
// Requiere registro previo en SIVAD: https://serviciosweb.afip.gov.ar/SIVAD/

import { arcaConfig, getARCAToken, getWSFEClient } from "./client";
import { getUltimoComprobante, throwIfWSFEError } from "./consultar";
import { appConfig } from "@/config/app.config";
import {
  TipoComprobante,
  Concepto,
  TipoDocumento,
  type FacturaInput,
  type FacturaResponse,
} from "./types";

interface FacturaEInput extends FacturaInput {
  // Código de país de destino según tabla ARCA (ej: 212 = Estados Unidos, 101 = Alemania)
  // Ver: https://www.afip.gob.ar/fe/documentos/TABLACODIGOSDEPAISES.xls
  paisDestinoId: number;
  // Tax ID del comprador en el exterior (opcional — usar "0" si no se conoce)
  idImpositivo?: string;
  // Moneda e importe en moneda extranjera
  monId?:    string; // "DOL" | "EUR" | "PES" (default: "DOL")
  monCotiz?: number; // Cotización al momento de la operación (default: 1)
}

export async function emitirFacturaE(input: FacturaEInput): Promise<FacturaResponse> {
  const { token, sign } = await getARCAToken();
  const client          = await getWSFEClient();

  const ultimoNro      = await getUltimoComprobante(TipoComprobante.FacturaE);
  const nroComprobante = ultimoNro + 1;

  const fechaHoy = toARCADate(new Date());
  const monId    = input.monId    ?? "DOL";
  const monCotiz = input.monCotiz ?? 1;

  // Factura E siempre es por Servicios — el concepto queda forzado a 2
  const request = {
    Auth: { Token: token, Sign: sign, Cuit: arcaConfig.cuit },
    FeCAEReq: {
      FeCabReq: {
        CantReg:  1,
        PtoVta:   arcaConfig.puntoVenta,
        CbteTipo: TipoComprobante.FacturaE,
      },
      FeDetReq: {
        FECAEDetRequest: [
          {
            Concepto:      Concepto.Servicios,
            DocTipo:       TipoDocumento.CUIT,     // 80 para receptor exterior
            DocNro:        input.idImpositivo ?? "0",
            CbteDesde:     nroComprobante,
            CbteHasta:     nroComprobante,
            CbteFch:       fechaHoy,
            ImpTotal:      roundAmount(input.importeTotal),
            ImpTotConc:    0,
            ImpNeto:       roundAmount(input.importeTotal),
            ImpOpEx:       0,
            ImpIVA:        0,
            ImpTrib:       0,
            MonId:         monId,
            MonCotiz:      monCotiz,
            FchServDesde:  input.fechaServDesde ?? fechaHoy,
            FchServHasta:  input.fechaServHasta ?? fechaHoy,
            FchVtoPago:    input.fechaVtoPago   ?? fechaHoy,
            // Campo exclusivo de Factura E: destino de la exportación
            PaisDestinoId: input.paisDestinoId,
          },
        ],
      },
    },
  };

  const [result] = await client.FECAESolicitarAsync(request);
  const res      = result?.FECAESolicitarResult;

  if (!res) throw new Error("WSFE: FECAESolicitar (E) retornó vacío");
  throwIfWSFEError(res);

  const det: any = res.FeDetResp?.FECAEDetResponse?.[0];
  if (!det) throw new Error("WSFE: sin detalle en FECAEDetResponse (E)");

  if (det.Resultado === "R") {
    const obs = extractObservaciones(det);
    throw new Error(`ARCA rechazó la Factura E: ${obs}`);
  }

  return {
    cae:            det.CAE,
    caeFchVto:      det.CAEFchVto,
    nroComprobante: det.CbteDesde,
    resultado:      det.Resultado,
    observaciones:  extractObservaciones(det) || undefined,
  };
}

// ── Helpers ────────────────────────────────────────────────────

function toARCADate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function extractObservaciones(det: any): string {
  const obs = det.Observaciones?.Obs;
  if (!obs) return "";
  const list = Array.isArray(obs) ? obs : [obs];
  return list.map((o: any) => `[${o.Code}] ${o.Msg}`).join(" | ");
}

// WSFE — Consultas de estado y último comprobante

import { arcaConfig, getARCAToken, getWSFEClient } from "./client";
import { appConfig } from "@/config/app.config";

// Retorna el número del último comprobante autorizado para un punto de venta + tipo.
// El próximo a usar es este número + 1.
export async function getUltimoComprobante(tipoComprobante: number): Promise<number> {
  const { token, sign } = await getARCAToken();
  const client = await getWSFEClient();

  const [result] = await client.FECompUltimoAutorizadoAsync({
    Auth: { Token: token, Sign: sign, Cuit: arcaConfig.cuit },
    PtoVta: arcaConfig.puntoVenta,
    CbteTipo: tipoComprobante,
  });

  const res = result?.FECompUltimoAutorizadoResult;
  if (!res) throw new Error("WSFE: FECompUltimoAutorizado retornó vacío");

  throwIfWSFEError(res);

  // CbteNro = 0 si nunca se emitió ninguno — el primer comprobante será el 1
  return res.CbteNro ?? 0;
}

// Consulta el estado de un comprobante ya emitido (auditoría / reproceso).
export async function consultarComprobante(params: {
  tipoComprobante: number;
  nroComprobante:  number;
}): Promise<{
  resultado:  string;
  cae:        string;
  caeFchVto:  string;
  estado:     string;
}> {
  const { token, sign } = await getARCAToken();
  const client = await getWSFEClient();

  const [result] = await client.FECompConsultarAsync({
    Auth:          { Token: token, Sign: sign, Cuit: arcaConfig.cuit },
    FeCompConsReq: {
      CbteTipo: params.tipoComprobante,
      CbteNro:  params.nroComprobante,
      PtoVta:   arcaConfig.puntoVenta,
    },
  });

  const res = result?.FECompConsultarResult;
  if (!res) throw new Error("WSFE: FECompConsultar retornó vacío");

  throwIfWSFEError(res);

  const det = res.ResultGet;
  return {
    resultado: det.Resultado,
    cae:       det.CodAutorizacion,
    caeFchVto: det.FchVto,
    estado:    det.Estado,
  };
}

// Verifica el estado del servicio WSFE (útil para healthcheck del admin).
export async function checkWSFEStatus(): Promise<{ appServer: string; dbServer: string; authServer: string }> {
  const { token, sign } = await getARCAToken();
  const client = await getWSFEClient();

  const [result] = await client.FEDummyAsync({});
  const res = result?.FEDummyResult;

  return {
    appServer:  res?.AppServer  ?? "unknown",
    dbServer:   res?.DbServer   ?? "unknown",
    authServer: res?.AuthServer ?? "unknown",
  };
}

// ── Helper común ──────────────────────────────────────────────

export function throwIfWSFEError(res: Record<string, unknown>): void {
  const errors = (res as any)?.Errors?.Err;
  if (!errors) return;

  const errList = Array.isArray(errors) ? errors : [errors];
  const msg = errList.map((e: any) => `[${e.ErrCode}] ${e.ErrMsg}`).join(" | ");
  throw new Error(`WSFE Error: ${msg}`);
}

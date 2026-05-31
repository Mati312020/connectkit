// WSFE — Emisión de Factura C (Tipo 11)
// Para monotributistas vendiendo en el mercado local argentino.
// Monotributo NO discrimina IVA → ImpNeto = ImpTotal, ImpIVA = 0.

import { arcaConfig, getARCAToken, getWSFEClient } from "./client";
import { getUltimoComprobante, throwIfWSFEError } from "./consultar";
import { appConfig } from "@/config/app.config";
import { TipoComprobante, type FacturaInput, type FacturaResponse } from "./types";

export async function emitirFacturaC(input: FacturaInput): Promise<FacturaResponse> {
  const { token, sign } = await getARCAToken();
  const client          = await getWSFEClient();

  // Obtener el próximo número de comprobante
  const ultimoNro   = await getUltimoComprobante(TipoComprobante.FacturaC);
  const nroComprobante = ultimoNro + 1;

  const fechaHoy = toARCADate(new Date());

  // Campos de periodo de servicio — obligatorios para concepto 2 (Servicios) y 3
  const camposServicio = input.concepto !== 1
    ? {
        FchServDesde: input.fechaServDesde ?? fechaHoy,
        FchServHasta: input.fechaServHasta ?? fechaHoy,
        FchVtoPago:   input.fechaVtoPago   ?? fechaHoy,
      }
    : {};

  const request = {
    Auth: { Token: token, Sign: sign, Cuit: arcaConfig.cuit },
    FeCAEReq: {
      FeCabReq: {
        CantReg:  1,
        PtoVta:   arcaConfig.puntoVenta,
        CbteTipo: TipoComprobante.FacturaC,
      },
      FeDetReq: {
        FECAEDetRequest: [
          {
            Concepto:  input.concepto,
            DocTipo:   input.docTipo,
            DocNro:    input.docNro,
            CbteDesde: nroComprobante,
            CbteHasta: nroComprobante,
            CbteFch:   fechaHoy,
            ImpTotal:  roundARS(input.importeTotal),
            ImpTotConc: 0,
            ImpNeto:   roundARS(input.importeTotal), // Monotributo: neto = total
            ImpOpEx:   0,
            ImpIVA:    0,  // Monotributo: no discrimina IVA
            ImpTrib:   0,
            MonId:     "PES",
            MonCotiz:  1,
            ...camposServicio,
          },
        ],
      },
    },
  };

  const [result] = await client.FECAESolicitarAsync(request);
  const res      = result?.FECAESolicitarResult;

  if (!res) throw new Error("WSFE: FECAESolicitar retornó vacío");

  throwIfWSFEError(res);

  const det: any = res.FeDetResp?.FECAEDetResponse?.[0];
  if (!det) throw new Error("WSFE: sin detalle en FECAEDetResponse");

  if (det.Resultado === "R") {
    const obs = extractObservaciones(det);
    throw new Error(`ARCA rechazó el comprobante: ${obs}`);
  }

  return {
    cae:            det.CAE,
    caeFchVto:      det.CAEFchVto,
    nroComprobante: det.CbteDesde,
    resultado:      det.Resultado,
    observaciones:  extractObservaciones(det) || undefined,
  };
}

// ── Helpers ───────────────────────────────────────────────────

// ARCA acepta fechas como "YYYYMMDD"
function toARCADate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

// ARCA acepta hasta 2 decimales en importes
function roundARS(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function extractObservaciones(det: any): string {
  const obs = det.Observaciones?.Obs;
  if (!obs) return "";
  const list = Array.isArray(obs) ? obs : [obs];
  return list.map((o: any) => `[${o.Code}] ${o.Msg}`).join(" | ");
}

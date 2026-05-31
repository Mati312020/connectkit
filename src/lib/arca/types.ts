// Tipos de comprobante ARCA (WSFE)
export enum TipoComprobante {
  FacturaC = 11,
  NotaDebitoC = 12,
  NotaCreditoC = 13,
  FacturaE = 19,
  NotaDebitoE = 20,
  NotaCreditoE = 21,
}

// Tipo de concepto del comprobante
export enum Concepto {
  Productos = 1,
  Servicios = 2,
  ProductosYServicios = 3,
}

// Tipo de documento del receptor
export enum TipoDocumento {
  CUIT = 80,
  DNI = 96,
  ConsumidorFinal = 99,
}

export interface FacturaInput {
  importeTotal: number;
  concepto: Concepto;
  docTipo: TipoDocumento;
  docNro: string;         // "0" para consumidor final
  fechaServDesde?: string; // YYYYMMDD — obligatorio para concepto 2 o 3
  fechaServHasta?: string;
  fechaVtoPago?: string;
}

export interface FacturaResponse {
  cae: string;
  caeFchVto: string;       // YYYYMMDD
  nroComprobante: number;
  resultado: "A" | "R" | "P"; // Aprobado | Rechazado | Parcial
  observaciones?: string;
  errores?: string[];
}

export interface ARCAToken {
  token: string;
  sign: string;
  expiresAt: Date;
}

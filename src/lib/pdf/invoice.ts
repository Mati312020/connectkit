// Generador de PDF para comprobantes fiscales
// Produce un PDF válido con todos los datos requeridos por ARCA:
// encabezado, datos del emisor/receptor, CAE y fecha de vencimiento.
//
// Para agregar logo: usar PDFDocument.embedPng/embedJpg con el Buffer del logo
// Para agregar código de barras ITF: usar bwip-js (npm install bwip-js)

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import { appConfig } from "@/config/app.config";

// ── Tipos de entrada ──────────────────────────────────────────

export interface InvoicePDFData {
  // Emisor (la plataforma)
  emisorNombre:     string;
  emisorCuit:       string;
  emisorDomicilio?: string;
  puntoVenta:       number;
  tipoComprobante:  number; // 11 = C, 19 = E

  // Comprobante
  nroComprobante: number;
  fechaEmision:   Date;
  cae:            string;
  caeFchVto:      string; // "YYYYMMDD"

  // Receptor
  receptorNombre: string;
  receptorEmail?: string;
  docTipo:        number; // 99 = Consumidor Final
  docNro:         string;

  // Totales (en pesos, no centavos)
  importeTotal: number;
  concepto:     number; // 1=Productos, 2=Servicios, 3=Ambos

  // Detalle de la reserva (opcional — para el marketplace)
  descripcionServicio?: string;
  fechaServicio?:       Date;
}

const TIPO_COMPROBANTE_LABEL: Record<number, string> = {
  11: "FACTURA C",
  19: "FACTURA E",
  12: "NOTA DE DÉBITO C",
  13: "NOTA DE CRÉDITO C",
};

const CONCEPTO_LABEL: Record<number, string> = {
  1: "Productos",
  2: "Servicios",
  3: "Productos y Servicios",
};

// ── Generador principal ───────────────────────────────────────

export async function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
  const doc      = await PDFDocument.create();
  const page     = doc.addPage([595, 842]); // A4 en puntos
  const { width, height } = page.getSize();

  const fontBold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const colors = {
    primary:    rgb(0.15, 0.15, 0.15),
    secondary:  rgb(0.4, 0.4, 0.4),
    accent:     hexToRgb(appConfig.theme.primaryColor),
    border:     rgb(0.85, 0.85, 0.85),
    white:      rgb(1, 1, 1),
    lightGray:  rgb(0.97, 0.97, 0.97),
  };

  const margin = 50;
  let y = height - margin;

  // ── Encabezado: tipo de comprobante ──────────────────────────
  const tipoLabel = TIPO_COMPROBANTE_LABEL[data.tipoComprobante] ?? `COMPROBANTE TIPO ${data.tipoComprobante}`;

  // Rectángulo de fondo del encabezado
  page.drawRectangle({
    x: margin, y: y - 60, width: width - margin * 2, height: 65,
    color: colors.accent,
  });

  page.drawText(tipoLabel, {
    x: margin + 15, y: y - 25,
    size: 16, font: fontBold, color: colors.white,
  });

  page.drawText(`Nº ${String(data.puntoVenta).padStart(4, "0")}-${String(data.nroComprobante).padStart(8, "0")}`, {
    x: margin + 15, y: y - 48,
    size: 10, font: fontRegular, color: colors.white,
  });

  page.drawText(`Fecha: ${formatDate(data.fechaEmision)}`, {
    x: width - margin - 160, y: y - 35,
    size: 10, font: fontRegular, color: colors.white,
  });

  y -= 80;

  // ── Bloque emisor / receptor ──────────────────────────────────
  const colLeft  = margin;
  const colRight = width / 2 + 10;
  const blockY   = y;

  // Panel emisor
  drawPanel(page, colLeft, blockY - 90, (width / 2 - margin - 5), 95, colors.lightGray, fontBold, fontRegular, colors, {
    title: "EMISOR",
    rows: [
      { label: "Razón social", value: data.emisorNombre },
      { label: "CUIT",         value: formatCuit(data.emisorCuit) },
      { label: "Domicilio",    value: data.emisorDomicilio ?? "" },
      { label: "Condición IVA", value: "Monotributista" },
    ],
  });

  // Panel receptor
  drawPanel(page, colRight, blockY - 90, (width / 2 - margin - 5), 95, colors.lightGray, fontBold, fontRegular, colors, {
    title: "RECEPTOR",
    rows: [
      { label: "Nombre/Razón social", value: data.receptorNombre },
      { label: "Tipo doc.",           value: data.docTipo === 99 ? "Consumidor Final" : `CUIT: ${data.docNro}` },
      { label: "Email",               value: data.receptorEmail ?? "" },
    ],
  });

  y -= 110;

  // ── Tabla de detalle ──────────────────────────────────────────
  // Header de tabla
  page.drawRectangle({ x: margin, y: y - 20, width: width - margin * 2, height: 22, color: colors.accent });
  page.drawText("Concepto", { x: margin + 8, y: y - 13, size: 9, font: fontBold, color: colors.white });
  page.drawText("Importe", { x: width - margin - 70, y: y - 13, size: 9, font: fontBold, color: colors.white });

  y -= 22;

  // Fila de detalle
  const descripcion = data.descripcionServicio
    ?? `${CONCEPTO_LABEL[data.concepto] ?? "Servicio"}${data.fechaServicio ? ` — ${formatDate(data.fechaServicio)}` : ""}`;

  page.drawRectangle({ x: margin, y: y - 24, width: width - margin * 2, height: 26, color: colors.lightGray });
  page.drawText(descripcion.slice(0, 80), { x: margin + 8, y: y - 16, size: 9, font: fontRegular, color: colors.primary });
  page.drawText(formatAmount(data.importeTotal), { x: width - margin - 70, y: y - 16, size: 9, font: fontRegular, color: colors.primary });

  y -= 30;

  // ── Totales ───────────────────────────────────────────────────
  const totalsX = width - margin - 200;

  drawTotalRow(page, totalsX, y, "Subtotal:", formatAmount(data.importeTotal), fontRegular, colors.secondary, 9);
  y -= 16;
  drawTotalRow(page, totalsX, y, "IVA (Monotributista):", "No aplica", fontRegular, colors.secondary, 9);
  y -= 18;

  // Total principal
  page.drawRectangle({ x: totalsX - 5, y: y - 18, width: 200, height: 22, color: colors.accent });
  page.drawText("TOTAL:", { x: totalsX, y: y - 11, size: 11, font: fontBold, color: colors.white });
  page.drawText(formatAmount(data.importeTotal), { x: width - margin - 70, y: y - 11, size: 11, font: fontBold, color: colors.white });

  y -= 45;

  // ── Bloque CAE (requerido por ARCA) ──────────────────────────
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: colors.border });
  y -= 20;

  page.drawText("DATOS DE AUTORIZACIÓN ARCA", {
    x: margin, y, size: 9, font: fontBold, color: colors.secondary,
  });
  y -= 16;

  page.drawText(`CAE: ${data.cae}`, { x: margin, y, size: 10, font: fontBold, color: colors.primary });
  page.drawText(`Vence: ${formatARCADate(data.caeFchVto)}`, { x: margin + 250, y, size: 10, font: fontRegular, color: colors.primary });

  y -= 30;

  // Nota monotributista
  page.drawText(
    "El emisor no es responsable del IVA por encontrarse en el Régimen Simplificado (Monotributo) — Ley 24.977.",
    { x: margin, y, size: 7, font: fontRegular, color: colors.secondary, maxWidth: width - margin * 2 }
  );

  // ── Footer ────────────────────────────────────────────────────
  page.drawText(`${appConfig.name} — ${appConfig.url}`, {
    x: margin, y: 35, size: 8, font: fontRegular, color: colors.secondary,
  });
  page.drawText(`Generado el ${formatDate(new Date())}`, {
    x: width - margin - 150, y: 35, size: 8, font: fontRegular, color: colors.secondary,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

// ── Helpers de dibujo ─────────────────────────────────────────

interface PanelOptions {
  title: string;
  rows:  { label: string; value: string }[];
}

function drawPanel(
  page: PDFPage, x: number, y: number, w: number, h: number,
  bg: ReturnType<typeof rgb>, fontBold: PDFFont, fontRegular: PDFFont,
  colors: Record<string, ReturnType<typeof rgb>>, opts: PanelOptions
) {
  page.drawRectangle({ x, y, width: w, height: h, color: bg });
  page.drawText(opts.title, { x: x + 8, y: y + h - 16, size: 8, font: fontBold, color: colors.secondary });

  let rowY = y + h - 32;
  for (const row of opts.rows) {
    if (!row.value) continue;
    page.drawText(`${row.label}:`, { x: x + 8, y: rowY, size: 8, font: fontBold, color: colors.secondary });
    page.drawText(row.value.slice(0, 40), { x: x + 8, y: rowY - 12, size: 9, font: fontRegular, color: colors.primary });
    rowY -= 26;
  }
}

function drawTotalRow(
  page: PDFPage, x: number, y: number, label: string, value: string,
  font: PDFFont, color: ReturnType<typeof rgb>, size: number
) {
  page.drawText(label, { x, y, size, font, color });
  page.drawText(value, { x: x + 130, y, size, font, color });
}

// ── Helpers de formato ────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatARCADate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(0, 4)}`;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: appConfig.currency.code, minimumFractionDigits: 2,
  }).format(amount);
}

function formatCuit(cuit: string): string {
  const c = cuit.replace(/\D/g, "");
  if (c.length !== 11) return cuit;
  return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`;
}

function hexToRgb(hex: string): ReturnType<typeof rgb> {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

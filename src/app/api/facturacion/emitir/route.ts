import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emitirFacturaC } from "@/lib/arca/factura-c";
import { Concepto, TipoDocumento } from "@/lib/arca/types";
import { appConfig } from "@/config/app.config";
import { sendEmail } from "@/lib/email/client";
import { logServerEvent, logError } from "@/lib/logger.server";
import { generateInvoicePDF } from "@/lib/pdf/invoice";
import { uploadBuffer } from "@/lib/storage/supabase-storage";
import { InvoiceReadyEmail } from "@/lib/email/templates/invoice-ready";
import { z } from "zod";
import prisma from "@/lib/prisma";
import * as React from "react";

const emitirSchema = z.object({
  bookingId: z.string().cuid(),
  docTipo:   z.nativeEnum(TipoDocumento).default(TipoDocumento.ConsumidorFinal),
  docNro:    z.string().default("0"),
});

// POST /api/facturacion/emitir
export async function POST(request: Request) {
  if (!appConfig.arca.enabled) {
    return NextResponse.json(
      { error: "La facturación ARCA no está habilitada" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await request.json();
  const parsed = emitirSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where:   { id: parsed.data.bookingId },
    include: { client: true, payment: true },
  });

  if (!booking || booking.payment?.status !== "APPROVED") {
    return NextResponse.json(
      { error: "La reserva debe estar pagada para emitir comprobante" },
      { status: 400 }
    );
  }

  const fechaServicio = booking.startDateTime.toISOString().slice(0, 10).replace(/-/g, "");

  try {
    // ── 1. Emitir comprobante en ARCA ───────────────────────────
    const result = await emitirFacturaC({
      importeTotal:   booking.totalAmount / 100,
      concepto:       Concepto.Servicios,
      docTipo:        parsed.data.docTipo,
      docNro:         parsed.data.docNro,
      fechaServDesde: fechaServicio,
      fechaServHasta: fechaServicio,
      fechaVtoPago:   fechaServicio,
    });

    // ── 2. Guardar en DB (sin PDF todavía) ──────────────────────
    const invoice = await prisma.invoice.upsert({
      where:  { bookingId: booking.id },
      create: {
        bookingId:     booking.id,
        userId:        booking.clientId,
        cae:           result.cae,
        caeExpiry:     new Date(result.caeFchVto.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")),
        voucherType:   appConfig.arca.defaultVoucherTypeLocal,
        voucherNumber: result.nroComprobante,
        puntoVenta:    appConfig.arca.puntoVenta,
        concept:       Concepto.Servicios,
        totalAmount:   booking.totalAmount / 100,
        status:        "EMITTED",
        emittedAt:     new Date(),
      },
      update: { cae: result.cae, status: "EMITTED", emittedAt: new Date() },
    });

    // ── 3. Generar PDF y subir a Supabase Storage ───────────────
    let pdfUrl: string | null = null;
    try {
      const pdfBuffer = await generateInvoicePDF({
        emisorNombre:       appConfig.name,
        emisorCuit:         appConfig.arca.cuit,
        puntoVenta:         appConfig.arca.puntoVenta,
        tipoComprobante:    appConfig.arca.defaultVoucherTypeLocal,
        nroComprobante:     result.nroComprobante,
        fechaEmision:       new Date(),
        cae:                result.cae,
        caeFchVto:          result.caeFchVto,
        receptorNombre:     booking.client.name ?? "Consumidor Final",
        receptorEmail:      booking.client.email,
        docTipo:            parsed.data.docTipo,
        docNro:             parsed.data.docNro,
        importeTotal:       booking.totalAmount / 100,
        concepto:           Concepto.Servicios,
        descripcionServicio: `Reserva de servicio #${booking.id.slice(0, 8).toUpperCase()}`,
        fechaServicio:      booking.startDateTime,
      });

      const storagePath = `invoices/${invoice.id}.pdf`;
      const uploaded    = await uploadBuffer("invoices", storagePath, pdfBuffer, "application/pdf");
      pdfUrl = uploaded.publicUrl;

      // Actualizar pdfUrl en la DB
      await prisma.invoice.update({
        where: { id: invoice.id },
        data:  { pdfUrl },
      });

      logServerEvent("PDF_GENERATED", {
        userId:   booking.clientId,
        metadata: {
          invoiceId:     invoice.id,
          storagePath:   `invoices/${invoice.id}.pdf`,
          nroComprobante: result.nroComprobante,
        },
        source: "SERVER",
      });
    } catch (pdfError) {
      // El PDF es best-effort — la factura sigue siendo válida con el CAE
      logServerEvent("PDF_ERROR", {
        userId:   booking.clientId,
        metadata: {
          invoiceId: invoice.id,
          error:     pdfError instanceof Error ? pdfError.message : String(pdfError),
        },
        source: "SYSTEM",
      });
    }

    // ── 4. Email al cliente ─────────────────────────────────────
    sendEmail({
      to:      booking.client.email,
      subject: "Tu comprobante ARCA está listo",
      react: React.createElement(InvoiceReadyEmail, {
        clientName:    booking.client.name ?? "Cliente",
        cae:           result.cae,
        voucherNumber: result.nroComprobante,
        totalAmount:   booking.totalAmount / 100,
        pdfUrl:        pdfUrl ?? `${appConfig.url}/api/facturacion/pdf?invoiceId=${invoice.id}`,
      }),
    }).catch(console.error);

    logServerEvent("INVOICE_EMITTED", {
      userId: booking.clientId,
      metadata: {
        invoiceId:     invoice.id,
        bookingId:     booking.id,
        cae:           result.cae,
        nroComprobante: result.nroComprobante,
        totalAmount:   booking.totalAmount / 100,
        hasPdf:        !!pdfUrl,
      },
    });

    return NextResponse.json({ invoice: { ...invoice, pdfUrl } });
  } catch (error) {
    await prisma.invoice.upsert({
      where:  { bookingId: booking.id },
      create: {
        bookingId:   booking.id,
        userId:      booking.clientId,
        voucherType: appConfig.arca.defaultVoucherTypeLocal,
        puntoVenta:  appConfig.arca.puntoVenta,
        concept:     Concepto.Servicios,
        totalAmount: booking.totalAmount / 100,
        status:      "ERROR",
      },
      update: { status: "ERROR" },
    });

    logError("facturacion/emitir", error, booking.clientId);

    return NextResponse.json(
      { error: "Error al emitir el comprobante ARCA" },
      { status: 500 }
    );
  }
}

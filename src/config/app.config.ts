// src/config/app.config.ts
// ============================================================
// ARCHIVO DE CONFIGURACIÓN PRINCIPAL DE LA PLATAFORMA
// Modificá estos valores para personalizar tu marketplace
// ============================================================

export const appConfig = {
  // ── Información básica ──────────────────────────────────
  name: "ConnectKit",
  tagline: "Conectamos familias con cuidadoras de confianza",
  description: "Marketplace de servicios personalizable",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // ── Vocabulario del negocio (personalizar por nicho) ────
  // Ejemplos:
  // Niñeras:   provider = "Cuidadora",  client = "Familia"
  // Clases:    provider = "Profesor",   client = "Alumno"
  // Hogar:     provider = "Profesional", client = "Cliente"
  roles: {
    provider: {
      singular: "Cuidadora",
      plural: "Cuidadoras",
      verb: "cuidar",
    },
    client: {
      singular: "Familia",
      plural: "Familias",
      verb: "contratar",
    },
    admin: {
      singular: "Administrador",
      plural: "Administradores",
    },
  },

  // ── Moneda y región ─────────────────────────────────────
  currency: {
    code: "ARS",           // ARS | USD | MXN | CLP | COP
    symbol: "$",
    locale: "es-AR",       // para Intl.NumberFormat
  },

  // ── Comisiones de la plataforma ─────────────────────────
  commissions: {
    provider: 6,           // % que se descuenta al proveedor
    client: 9,             // % adicional que paga el cliente
  },

  // ── Precio base del servicio ─────────────────────────────
  pricing: {
    baseHourlyRate: 3450,  // ARS por hora (configurable)
    minBookingHours: 2,
    maxBookingHours: 12,
  },

  // ── Features habilitables ────────────────────────────────
  features: {
    subscriptions: true,        // Planes premium de suscripción
    invoicing: true,            // Facturación fiscal ARCA
    longTermBookings: true,     // Reservas recurrentes/mensuales
    providerVerification: true, // Proceso de verificación de identidad
    ratings: true,              // Sistema de calificaciones
    chat: false,                // Chat en tiempo real (próximamente)
    multiLocation: false,       // Multi-sede/ciudad
  },

  // ── Mercado Pago ─────────────────────────────────────────
  mercadopago: {
    publicKey: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || "",
    accessToken: process.env.MP_ACCESS_TOKEN || "",
    webhookSecret: process.env.MP_WEBHOOK_SECRET || "",
    // URLs de retorno después del pago
    successUrl: "/pago/exitoso",
    failureUrl: "/pago/error",
    pendingUrl: "/pago/pendiente",
  },

  // ── Facturación ARCA (AFIP) ──────────────────────────────
  // Requiere alta previa como monotributista o RI en ARCA
  // Documentación: https://serviciosweb.afip.gob.ar/
  arca: {
    enabled: process.env.ARCA_ENABLED === "true",
    cuit: process.env.ARCA_CUIT || "",
    puntoVenta: parseInt(process.env.ARCA_PUNTO_VENTA || "1"),
    // Tipo de comprobante por defecto según el cliente
    // 11 = Factura C (mercado local, monotributo)
    // 19 = Factura E (exportación de servicios)
    defaultVoucherTypeLocal: 11,
    defaultVoucherTypeExport: 19,
    environment: (process.env.ARCA_ENV || "testing") as "testing" | "production",
  },

  // ── Email (Resend) ────────────────────────────────────────
  email: {
    from: process.env.EMAIL_FROM || "noreply@tudominio.com",
    replyTo: process.env.EMAIL_REPLY_TO || "soporte@tudominio.com",
  },

  // ── Logs del sistema ─────────────────────────────────────
  // retentionMonths: 0 = guardar indefinidamente
  // El admin puede sobrescribir este valor desde el panel de configuración
  logs: {
    retentionMonths: 3,
    maxEntriesPerPage: 200,
  },

  // ── Supabase ─────────────────────────────────────────────
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  },

  // ── Tema visual ──────────────────────────────────────────
  theme: {
    primaryColor: "#40E0D0",    // Turquesa
    accentColor: "#FF8C69",     // Coral/Salmón
    darkColor: "#2C3E50",       // Azul marino
  },
} as const;

export type AppConfig = typeof appConfig;

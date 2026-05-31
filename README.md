# ConnectKit

> Boilerplate para construir marketplaces de servicios en Latinoamérica.
> Next.js 14 + Supabase + Mercado Pago + Facturación ARCA lista para usar.

## Features

- **Auth completa** — Supabase Auth con 3 roles (admin/proveedor/cliente)
- **Sistema de reservas** — calendario de disponibilidad y booking flow
- **Mercado Pago integrado** — preferencias, webhooks, suscripciones
- **Facturación fiscal ARCA** — Factura C (local) y Factura E (exportación)
- **Dashboard admin** — métricas, usuarios, comprobantes
- **PWA ready** — instalable desde el navegador
- **100% personalizable** — un solo archivo de config para cambiar todo

## Stack

- **Framework:** Next.js 14 (App Router)
- **Base de datos:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **UI:** Tailwind CSS + shadcn/ui
- **Pagos:** Mercado Pago SDK
- **Facturación:** ARCA/AFIP (WSAA + WSFE)
- **Email:** Resend
- **Deploy:** Railway / Vercel

## Quick Start

```bash
git clone https://github.com/tu-usuario/connectkit
cd connectkit
npm install
cp .env.example .env.local
# Completar variables en .env.local
npx prisma migrate dev --name init
npm run dev
```

Ver [docs/setup.md](docs/setup.md) para guía completa.

## Personalización

Todo el comportamiento del marketplace se configura desde un solo archivo:

```
src/config/app.config.ts
```

Cambiá el nombre, vocabulario, comisiones, features y colores sin tocar
ningún otro archivo. Ver [docs/customization.md](docs/customization.md).

## Mercado Pago

Ver [docs/payments.md](docs/payments.md) para configurar tu cuenta de MP.

## Facturación ARCA

La facturación fiscal requiere alta previa en ARCA como monotributista o
responsable inscripto. Ver [docs/invoicing.md](docs/invoicing.md).

## Deploy

Ver [docs/deploy.md](docs/deploy.md) para instrucciones en Railway + Supabase.

## Licencia

MIT — podés usarlo para proyectos personales y comerciales.

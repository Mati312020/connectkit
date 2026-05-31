# Deploy — ConnectKit

## Opción A: Render (recomendado) ✅

Render es la opción recomendada si ya tenés otros proyectos alojados ahí.
Para una demo comercial usá el plan **Starter ($7/mes)** — elimina los cold starts
que arruinan la primera impresión de los compradores.

### 1. Crear el servicio en Render

1. Ir a [render.com](https://render.com) → **New → Web Service**
2. Conectar el repositorio de GitHub con el código de ConnectKit
3. Configurar:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `connectkit` (o el nombre que elijas) |
   | **Region** | Oregon (US West) — más cercano a Argentina |
   | **Branch** | `main` |
   | **Runtime** | Node |
   | **Build Command** | `npm run build:render` |
   | **Start Command** | `npm run start:render` |
   | **Plan** | Starter ($7/mes) — sin cold starts |

### 2. Variables de entorno

En Render → tu servicio → **Environment**, agregar **todas** las variables de `.env.example` con valores reales, más:

```env
NODE_ENV=production
HOSTNAME=0.0.0.0
NODE_VERSION=20.19.0
NPM_CONFIG_PRODUCTION=false
```

> `NPM_CONFIG_PRODUCTION=false` es necesario porque TypeScript y Tailwind
> están en `devDependencies` pero se usan en el build.

### 3. Dominio personalizado

Para usar `connectkit.bytecraft.com.ar`:

1. En Render → tu servicio → **Custom Domains** → agregar `connectkit.bytecraft.com.ar`
2. En Cloudflare → DNS → agregar:
   ```
   Tipo:  CNAME
   Nombre: connectkit
   Target: <tu-servicio>.onrender.com
   Proxy:  ☁️ Proxied (naranja)
   ```
3. Actualizar `NEXT_PUBLIC_APP_URL=https://connectkit.bytecraft.com.ar`

### 4. Migraciones de base de datos

Antes del primer deploy (o cuando cambies el schema):

```bash
# Desde tu máquina local, con las env vars de producción:
npx prisma migrate deploy
```

O creás un "one-off job" en Render con el mismo comando.

### 5. Supabase Storage — crear buckets

Ir a tu proyecto Supabase → **Storage** → crear dos buckets:

| Bucket | Visibilidad | Uso |
|--------|-------------|-----|
| `avatars` | Público | Fotos de perfil de usuarios |
| `invoices` | Público | PDFs de comprobantes ARCA |

Para buckets públicos: activar "Public bucket" en la configuración del bucket.

---

## Opción B: Vercel

Vercel es excelente para Next.js pero tiene limitaciones con Prisma en serverless.

1. Conectar repo en [vercel.com](https://vercel.com)
2. Configurar las variables de entorno
3. Build Command: `prisma generate && next build`

> Importante: siempre usar el **pooler de Supabase** (puerto 6543) en `DATABASE_URL`
> para evitar que Prisma agote el pool de conexiones en funciones serverless.

---

## Opción C: Railway

Buena opción si preferís todo en una sola plataforma (DB + app).

```
Build: npm run build:render
Start: npm run start:render
```

Agregar `HOSTNAME=0.0.0.0` en las variables.

---

## Checklist pre-producción

### Código
- [ ] `NEXT_PUBLIC_APP_URL` apunta al dominio real
- [ ] `NODE_ENV=production`
- [ ] `HOSTNAME=0.0.0.0`

### Base de datos
- [ ] `npx prisma migrate deploy` ejecutado
- [ ] Buckets `avatars` e `invoices` creados en Supabase Storage
- [ ] RLS desactivada en tablas que accede el service role (o policies configuradas)

### Mercado Pago
- [ ] Credenciales de **producción** (no las de TEST-)
- [ ] Webhook registrado apuntando a `https://tudominio.com/api/mercadopago/webhook`
- [ ] `MP_WEBHOOK_SECRET` generado en el panel de MP y cargado en Render

### ARCA (si vas a usar facturación)
- [ ] `ARCA_ENABLED=true`
- [ ] `ARCA_ENV=production`
- [ ] Certificado real de producción en `ARCA_CERT` y `ARCA_PRIVATE_KEY` (base64)
- [ ] Punto de venta habilitado en ARCA para el CUIT

### Email
- [ ] `RESEND_API_KEY` cargado
- [ ] Dominio de email verificado en Resend
- [ ] `EMAIL_FROM` usando el dominio verificado

### Landing de venta
- [ ] Actualizar `PRODUCT.gumroadUrl` en `src/app/(public)/kit/page.tsx`
- [ ] Actualizar `PRODUCT.demoUrl` si la demo no es la misma URL

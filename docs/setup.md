# Setup — ConnectKit

Guía para arrancar el proyecto en menos de 15 minutos.

## Requisitos previos

- Node.js 18+
- Una cuenta en [Supabase](https://supabase.com) (gratis)
- Una cuenta en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
- Una cuenta en [Resend](https://resend.com) (gratis)

## Paso 1 — Clonar e instalar

```bash
git clone https://github.com/tu-usuario/connectkit
cd connectkit
npm install
cp .env.example .env.local
```

## Paso 2 — Configurar Supabase

1. Crear un nuevo proyecto en [supabase.com](https://supabase.com)
2. Ir a **Settings → API** y copiar:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
3. Ir a **Settings → Database** y copiar las URLs de conexión:
   - Transaction pooler (puerto 6543) → `DATABASE_URL`
   - Session pooler o Direct (puerto 5432) → `DIRECT_URL`
4. En **Authentication → URL Configuration**, agregar a "Redirect URLs":
   ```
   http://localhost:3000/api/auth/callback
   ```

## Paso 3 — Inicializar la base de datos

```bash
npx prisma migrate dev --name init
```

Esto crea todas las tablas en tu proyecto de Supabase.

## Paso 4 — Configurar Mercado Pago

1. Ir a [developers.mercadopago.com](https://developers.mercadopago.com)
2. En **Mis credenciales → Credenciales de prueba**:
   - `Public Key` → `NEXT_PUBLIC_MP_PUBLIC_KEY`
   - `Access Token` → `MP_ACCESS_TOKEN`
3. Para el webhook en testing, usar [ngrok](https://ngrok.com) o similar para exponer localhost
4. En producción, registrar el webhook en el panel de MP apuntando a:
   ```
   https://tudominio.com/api/mercadopago/webhook
   ```

## Paso 5 — Configurar email (Resend)

1. Crear cuenta en [resend.com](https://resend.com)
2. Generar API Key → `RESEND_API_KEY`
3. Verificar tu dominio de envío → `EMAIL_FROM`

## Paso 6 — Personalizar el marketplace

Editá `src/config/app.config.ts` con los valores de tu nicho.
Ver [customization.md](customization.md) para detalles.

## Paso 7 — Correr en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Verificar que todo funciona

- `/` — Landing page
- `/register` — Crear cuenta (elegir rol PROVIDER o CLIENT)
- `/login` — Iniciar sesión
- `/dashboard/client` — Panel del cliente (después de registrarse como cliente)
- `/dashboard/provider` — Panel del proveedor

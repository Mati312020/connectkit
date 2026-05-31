# Pagos con Mercado Pago — ConnectKit

## Configuración inicial

### 1. Crear aplicación en el panel de MP

1. Ir a [developers.mercadopago.com/panel](https://developers.mercadopago.com/panel)
2. Click en **Crear aplicación**
3. Elegir **Pagos online** → **CheckoutPro**
4. Copiar las credenciales de **testing** primero:
   ```
   NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxxxxxxx
   MP_ACCESS_TOKEN=TEST-xxxxxxxx
   ```

### 2. Configurar el webhook

El webhook recibe notificaciones cuando un pago es aprobado.

**En testing (localhost):**
```bash
# Usar ngrok para exponer localhost
ngrok http 3000
# Registrar la URL del tunel en el panel de MP:
# https://abc123.ngrok.io/api/mercadopago/webhook
```

**En producción:**
1. Panel MP → **Tu aplicación → Webhooks**
2. Agregar URL: `https://tudominio.com/api/mercadopago/webhook`
3. Seleccionar eventos: `payment`
4. Copiar el **Secret** → `MP_WEBHOOK_SECRET`

## Flujo de pago

```
Cliente crea reserva
    ↓
POST /api/mercadopago/create-preference
    ↓ (retorna initPoint/sandboxInitPoint)
Redirect a Mercado Pago
    ↓ (usuario paga)
MP llama POST /api/mercadopago/webhook
    ↓ (status: "approved")
Booking cambia a CONFIRMED
Emails enviados a cliente y proveedor
```

## Split de comisiones

El cálculo de comisiones se hace en `src/lib/utils.ts`:

```typescript
// Lo que paga el cliente (base + comisión cliente)
calculateClientTotal(baseAmountCents)  // → { base, fee, total }

// Lo que recibe el proveedor (base - comisión proveedor)
calculateProviderNet(baseAmountCents)  // → { gross, fee, net }
```

Para implementar el split automático en MP, usar **Marketplace API**:
- Requiere aprobación de MP para tu cuenta
- Ver: https://www.mercadopago.com.ar/developers/es/docs/marketplaces/introduction

## Suscripciones

Las suscripciones recurrentes usan **PreApproval** de MP:

```typescript
import { createSubscription } from "@/lib/mercadopago/subscription";

await createSubscription({
  userId: user.id,
  userEmail: user.email,
  plan: "PREMIUM",
});
```

Los planes y precios se configuran en `src/lib/mercadopago/subscription.ts`.

## Pasar a producción

1. En el panel de MP, ir a **Credenciales de producción**
2. Reemplazar las keys TEST por las de producción en `.env.local`
3. Cambiar `auto_return: "approved"` en la preferencia (ya está configurado)
4. Verificar que el webhook apunte a tu dominio real

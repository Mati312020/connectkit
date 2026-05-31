# Personalización — ConnectKit

ConnectKit está diseñado para adaptarse a cualquier marketplace de servicios
con cambios mínimos. El punto central de personalización es:

```
src/config/app.config.ts
```

## Campos configurables

### Nombre y tagline

```typescript
name: "MiApp",
tagline: "El marketplace de médicos de tu zona",
```

### Vocabulario del negocio

Cambiá cómo se llaman los roles en toda la UI:

```typescript
roles: {
  provider: {
    singular: "Médico",    // antes: "Cuidadora"
    plural: "Médicos",
    verb: "atender",
  },
  client: {
    singular: "Paciente",  // antes: "Familia"
    plural: "Pacientes",
    verb: "consultar",
  },
}
```

Ejemplos por nicho:

| Nicho | provider | client |
|-------|----------|--------|
| Niñeras | Cuidadora | Familia |
| Clases | Profesor | Alumno |
| Hogar | Profesional | Cliente |
| Médicos | Médico | Paciente |
| Coaches | Coach | Coachee |

### Moneda

```typescript
currency: {
  code: "MXN",         // ARS | USD | MXN | CLP | COP
  symbol: "$",
  locale: "es-MX",
},
```

### Comisiones

```typescript
commissions: {
  provider: 8,   // % que se descuenta al proveedor
  client: 10,    // % adicional que paga el cliente
},
```

### Precio base

```typescript
pricing: {
  baseHourlyRate: 500,  // en la moneda configurada (enteros)
  minBookingHours: 1,
  maxBookingHours: 8,
},
```

### Features habilitables

```typescript
features: {
  subscriptions: false,       // deshabilitar planes premium
  invoicing: false,           // solo si tenés ARCA configurado
  longTermBookings: true,
  providerVerification: false, // deshabilitar verificación de identidad
  ratings: true,
  chat: false,                // próximamente
  multiLocation: false,
},
```

### Colores

```typescript
theme: {
  primaryColor: "#6366F1",   // indigo
  accentColor: "#F59E0B",    // amber
  darkColor: "#111827",
},
```

Los colores se usan inline en los componentes via `style={{ color: appConfig.theme.primaryColor }}`.
Para cambios más profundos, editá `src/app/globals.css` para modificar las variables CSS de shadcn.

## Tips de personalización avanzada

- Para cambiar el logo, reemplazá el texto en `Sidebar.tsx` y `AuthLayout` con un `<Image>`
- Para agregar categorías de servicio, editá el componente de registro (`register/page.tsx`)
- Para ajustar el schema de DB, editá `prisma/schema.prisma` y ejecutá `npx prisma migrate dev`

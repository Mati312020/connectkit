# Facturación ARCA (AFIP) — ConnectKit

## Requisitos previos

Para emitir comprobantes fiscales necesitás:

1. **CUIT** activo
2. **Alta como Monotributista o Responsable Inscripto** en ARCA
3. **Punto de venta** habilitado en ARCA (se crea en el panel web)
4. **Certificado digital** generado y aprobado por ARCA

## Paso 1 — Alta en ARCA

1. Ir a [serviciosweb.afip.gob.ar](https://serviciosweb.afip.gob.ar)
2. Ingresar con CUIT + Clave Fiscal
3. Si sos **monotributista**: el servicio "Facturador Online" está habilitado por defecto
4. Si sos **RI**: habilitar el servicio "WSFE - Web Services de Facturación Electrónica"

## Paso 2 — Crear punto de venta

1. En ARCA → **Administración de puntos de venta**
2. Crear punto de venta tipo **"Factura electrónica - Web Services"**
3. Anotar el número → `ARCA_PUNTO_VENTA=1`

## Paso 3 — Generar certificado digital

El certificado es la "llave" para que tu app se autentique con ARCA.

### En Linux/Mac:
```bash
# Generar clave privada
openssl genrsa -out private_key.key 2048

# Generar CSR (Certificate Signing Request)
openssl req -new -key private_key.key -subj "/C=AR/O=TuEmpresa/CN=TuApellido" -out cert_request.csr

# Convertir a base64 para las env vars
base64 -i private_key.key | tr -d '\n' > private_key_b64.txt
```

### En Windows (PowerShell):
```powershell
# Usando OpenSSL (instalá con: winget install ShiningLight.OpenSSL)
openssl genrsa -out private_key.key 2048
openssl req -new -key private_key.key -subj "/C=AR/O=TuEmpresa/CN=TuApellido" -out cert_request.csr

# Convertir a base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("private_key.key")) | Out-File private_key_b64.txt
```

### Subir el CSR a ARCA:
1. En ARCA → **Administración de Certificados Digitales**
2. Subir el archivo `cert_request.csr`
3. ARCA te devuelve el archivo `.crt` (certificado firmado)
4. Convertir a base64:
   ```bash
   base64 -i certificate.crt | tr -d '\n' > cert_b64.txt
   ```
5. Copiar los contenidos a `.env.local`:
   ```
   ARCA_CERT=<contenido de cert_b64.txt>
   ARCA_PRIVATE_KEY=<contenido de private_key_b64.txt>
   ```

## Paso 4 — Habilitar en el proyecto

```env
ARCA_ENABLED=true
ARCA_ENV=testing    # probar con testing primero
ARCA_CUIT=20-12345678-9
ARCA_PUNTO_VENTA=1
```

## Paso 5 — Implementar el cliente ARCA

La integración SOAP está scaffoldeada en `src/lib/arca/`. Los TODOs indican qué falta:

### Instalar la dependencia SOAP:
```bash
npm install soap
npm install -D @types/soap
```

### Implementar `getARCAToken()` en `src/lib/arca/client.ts`:

```typescript
import forge from "node-forge";  // npm install node-forge

export async function getARCAToken(): Promise<ARCAToken> {
  const cert = Buffer.from(process.env.ARCA_CERT!, "base64").toString();
  const key = Buffer.from(process.env.ARCA_PRIVATE_KEY!, "base64").toString();

  // 1. Generar TRA (Ticket de Requerimiento de Acceso)
  const now = new Date();
  const tra = `<?xml version="1.0" encoding="UTF-8"?>
    <loginTicketRequest version="1.0">
      <header>
        <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
        <generationTime>${now.toISOString()}</generationTime>
        <expirationTime>${new Date(now.getTime() + 12 * 3600000).toISOString()}</expirationTime>
      </header>
      <service>wsfe</service>
    </loginTicketRequest>`;

  // 2. Firmar el TRA con PKCS#7
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(tra);
  p7.addCertificate(cert);
  p7.addSigner({
    key: forge.pki.privateKeyFromPem(key),
    certificate: forge.pki.certificateFromPem(cert),
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [],
  });
  p7.sign({ detached: false });
  const cms = forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes());

  // 3. Llamar al WSAA
  const soapClient = await soap.createClientAsync(arcaConfig.wsaaUrl + "?WSDL");
  const [result] = await soapClient.loginCmsAsync({ in0: cms });

  // 4. Parsear el TA
  const ta = result.loginCmsReturn;
  const tokenMatch = ta.match(/<token>(.*?)<\/token>/s);
  const signMatch = ta.match(/<sign>(.*?)<\/sign>/s);

  return {
    token: tokenMatch![1],
    sign: signMatch![1],
    expiresAt: new Date(Date.now() + 11 * 3600000), // 11hs (margen 1h)
  };
}
```

### Implementar la llamada SOAP en `factura-c.ts`:

```typescript
import * as soap from "soap";

// Dentro de emitirFacturaC():
const lastNumber = await getUltimoComprobante(TipoComprobante.FacturaC);
requestData.FeCAEReq.FeDetReq.FECAEDetRequest[0].CbteDesde = lastNumber + 1;
requestData.FeCAEReq.FeDetReq.FECAEDetRequest[0].CbteHasta = lastNumber + 1;

const soapClient = await soap.createClientAsync(arcaConfig.wsfeUrl + "?WSDL");
const [result] = await soapClient.FECAESolicitarAsync(requestData);
const det = result.FeDetResp.FECAEDetResponse[0];

return {
  cae: det.CAE,
  caeFchVto: det.CAEFchVto,
  nroComprobante: det.CbteDesde,
  resultado: det.Resultado,
  observaciones: det.Observaciones?.Obs?.[0]?.Msg,
};
```

## Endpoints

| Ambiente | WSAA | WSFE |
|----------|------|------|
| Testing | `https://wsaahomo.afip.gov.ar/ws/services/LoginCms` | `https://wswhomo.afip.gov.ar/wsfev1/service.asmx` |
| Producción | `https://wsaa.afip.gov.ar/ws/services/LoginCms` | `https://servicios1.afip.gov.ar/wsfev1/service.asmx` |

## Tipos de comprobante

| Código | Nombre | Cuándo usar |
|--------|--------|-------------|
| 11 | Factura C | Ventas en Argentina (monotributo) |
| 19 | Factura E | Exportación de servicios digitales |
| 12 | Nota de débito C | Ajuste a favor tuyo |
| 13 | Nota de crédito C | Reembolso parcial |

## Pasar a producción

1. Cambiar `ARCA_ENV=production`
2. Verificar que el certificado sea el de producción (no el de homologación)
3. Hacer un test con importe mínimo antes de abrir al público

## Recursos oficiales

- [Manual del Desarrollador WSFE](https://serviciosweb.afip.gov.ar/clientes/manualDeveloper/)
- [WSDL Testing WSFE](https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL)
- [Padrón AFIP (consulta de CUIT)](https://serviciosweb.afip.gob.ar/clientes/portalcf/controller/ns/ws/queryClientesPadronService)

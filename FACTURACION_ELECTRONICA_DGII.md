# Facturacion Electronica e-CF DGII

Esta fase prepara la arquitectura de INVE-FAT SYSTEM para facturacion electronica e-CF en Republica Dominicana. No certifica automaticamente el sistema ante DGII y no envia documentos reales.

## Alcance preparado

- Submodulo Finanzas / Contabilidad > Facturacion Electronica e-CF.
- Registro de documentos emitidos desde Factura y Punto de venta cuando tienen NCF/e-NCF.
- Estructura XML base preparada para e-CF.
- Representacion impresa preparada con codigo de seguridad y datos QR.
- Registro de documentos recibidos de proveedores.
- Acuse de recibo simulado.
- Aprobacion comercial simulada.
- Archivo historico con retencion preparada por 10 anos.
- Modo contingencia y cola de reintentos.
- Configuracion DGII en modo simulacion.
- Configuracion de certificado digital sin guardar claves privadas.

## Requisitos para produccion

Para operar facturacion electronica real se requiere:

- Certificacion/autorizacion DGII.
- Especificaciones tecnicas XML oficiales vigentes.
- Certificado digital valido.
- Firma digital ejecutada en backend seguro o servicio autorizado.
- Conexion Web Service DGII desde backend.
- Manejo real de acuse de recibo.
- Manejo real de aprobacion comercial.
- Archivo historico legal de documentos electronicos.
- Plan de contingencia probado.
- Pruebas en ambiente DGII antes de produccion.

## Seguridad

No se deben guardar llaves privadas reales en el frontend, localStorage, repositorio ni variables publicas. La firma digital debe hacerse en backend seguro.

El frontend solo prepara:

- Datos del documento.
- XML base.
- Estados electronicos.
- Representacion impresa.
- Colas, historial y trazabilidad.

## Modo simulacion

Si no hay URLs ni credenciales DGII configuradas, el sistema opera en modo simulacion. Este modo permite probar el flujo operativo sin enviar documentos reales.

## Multiempresa

Los documentos electronicos usan almacenamiento por empresa mediante claves como:

- `invefat_[companyCode]_electronic_documents`
- `invefat_[companyCode]_electronic_received_documents`
- `invefat_[companyCode]_electronic_archive`
- `invefat_[companyCode]_electronic_contingency_queue`
- `invefat_[companyCode]_electronic_usage`

En Supabase, las tablas futuras deben incluir `company_id` y Row Level Security.

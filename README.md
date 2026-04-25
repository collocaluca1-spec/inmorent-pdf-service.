# inmorent-pdf-service

App Next.js independiente (App Router) para preview HTML premium del **Informe Comercial Locativo**.
No tiene dependencias con la app Base44 principal.

## Estructura

```
inmorent-pdf-service/
├── package.json
├── next.config.mjs
├── tsconfig.json
├── app/
│   ├── layout.tsx                         ← layout raíz + globals.css
│   ├── globals.css                        ← fuentes, A4, tablas, print
│   ├── page.tsx                           ← index con link al demo
│   └── preview/
│       └── locativo-demo/
│           └── page.tsx                   ← preview con datos mock
├── components/
│   └── informe/
│       ├── InformeLocativoTemplate.tsx    ← wrapper principal
│       ├── Page1.tsx                      ← pág 1: encabezado, KPIs, gauge, tabla bancaria
│       ├── Page2.tsx                      ← pág 2: donuts, barras, línea, entidades, fuentes
│       └── charts/
│           ├── ScoreGauge.tsx             ← gauge circular SVG
│           ├── DonutChart.tsx             ← donut SVG + leyenda
│           ├── BarChart.tsx               ← barras SVG + ejes
│           └── LineChart.tsx             ← línea multi-serie SVG + leyenda
└── lib/
    └── mock-locativo.ts                   ← tipos TypeScript + datos mock
```

## Desarrollo local

```bash
cd inmorent-pdf-service
npm install
npm run dev
# → http://localhost:3000/preview/locativo-demo
```

## Deploy en Vercel

1. Subir `inmorent-pdf-service/` como repositorio en GitHub.
2. Importar en Vercel → Framework: **Next.js** → Deploy.
3. Preview disponible en `/preview/locativo-demo`.

## Imprimir a PDF

En la preview, usar el botón **"Imprimir / Guardar PDF"** o `Ctrl+P` → Guardar como PDF.
Los estilos `@media print` ocultan la toolbar y aplican `page-break-after` entre páginas.

## Próximos pasos

- Agregar ruta `/api/pdf/locativo` con Puppeteer headless para PDF server-side
- Aceptar datos reales vía query params o body POST
- Conectar con el botón "Descargar PDF" de la app Base44
## Endpoint PDF premium

El servicio expone:

```txt
POST /api/pdf/locativo
```

Headers:

```txt
Content-Type: application/json
X-InmoRent-PDF-Secret: <PDF_API_SECRET>
```

Body recomendado:

```json
{
  "data": {
    "documento": "27217877550",
    "denominacion": "CARABELLI MARIA JOSE",
    "tipo_persona": "fisica",
    "fetchedAt": "2026-04-24T07:55:00.000Z",
    "score": 65,
    "riesgoLabel": "Revisión manual",
    "color": "amber",
    "bcraDisponible": true,
    "situacionVigente": 1,
    "peorSituacion24m": 5,
    "deudaVigente": 4168,
    "entidadPrincipal": "BANCO SANTANDER ARGENTINA S.A.",
    "tendencia6m": "normalizada",
    "ultimoPeriodoActual": "202602",
    "actualRows": [],
    "historicoRows": [],
    "periodosHistoricosAgregados": []
  }
}
```

El endpoint devuelve `application/pdf`.

En Vercel configurar la variable de entorno:

```txt
PDF_API_SECRET=<una_clave_larga>
```

Opcional, para resolver assets como el logo en generación server-side:

```txt
PDF_PUBLIC_ORIGIN=https://inmorent-pdf-service.vercel.app
```

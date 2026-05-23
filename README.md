# Harvin Distribuciones — Centro de Inteligencia Directiva

Tablero ejecutivo (BI) estático para la dirección de **Harvin Distribuciones**, distribuidor de autopartes. Consolida los 8 reportes del ERP en un solo panel interactivo con gráficas, KPIs y resúmenes ejecutivos por área, listo para publicarse en línea sin servidor ni base de datos.

Periodo analizado: **01 ene 2026 — 23 may 2026 (143 días)**. Moneda: **MXN**. Valuación de inventario y costeo a **último costo de compra** por artículo.

---

## Resumen del negocio

| Indicador | Valor |
|---|---|
| Ventas netas | **$5,895,559** (3,201 facturas · ticket $1,842) |
| Margen bruto | **$1,169,103** (20.2% sobre ventas) |
| Valor de inventario | **$8,056,267** |
| Capital inmovilizado (sin venta en el periodo) | **$5,209,660** — 64.7% del inventario (6,333 SKUs) |
| Capital activo (sí rota) | **$2,846,606** |
| Rotación real anual (COGS / inventario) | **1.46×** (~250 días de inventario) |
| Cartera por cobrar | **$276,514** (DSO 6.7 días — cartera sana) |
| Clientes activos | 31 · SKUs vendidos: 4,997 |
| Sugerencia de compra al proveedor | 1,996 artículos · inversión estimada **$778,661** |
| Capital liberable vía promociones | **$212,134** (30 candidatos) |

> **Hallazgo principal:** el inventario es la mayor palanca financiera. El 64.7% de su valor no registró ventas en el periodo. Activar ese capital mediante liquidación dirigida y depuración de catálogo libera flujo reinvertible en las referencias de alta rotación.

---

## Módulos del tablero (13)

**Visión General** — Resumen Ejecutivo · Ventas & Facturación · Margen & Rentabilidad
**Comercial** — Mejores Clientes · Artículos & ABC · Líneas de Producto · Cliente × Artículo
**Operación** — Inventario & Valuación · Rotación de Inventario · Capital Inmovilizado
**Decisiones** — Sugerencias de Compra · Promociones & Liquidación · Cobranza & Cartera

---

## Publicar en línea (GitHub Pages)

1. Crear un repositorio nuevo en GitHub (p. ej. `harvin-dashboard`).
2. Subir **todo el contenido de esta carpeta** a la raíz del repositorio:
   ```bash
   git init
   git add .
   git commit -m "Tablero directivo Harvin"
   git branch -M main
   git remote add origin https://github.com/USUARIO/harvin-dashboard.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guardar.
4. En 1–2 minutos el tablero quedará disponible en `https://USUARIO.github.io/harvin-dashboard/`.

El archivo `.nojekyll` ya está incluido para que GitHub Pages sirva los archivos tal cual.

> También funciona en cualquier hosting estático (Netlify, Vercel, Cloudflare Pages) o abriendo `index.html` directamente desde un servidor local: `python3 -m http.server` y visitar `http://localhost:8000`.

---

## Estructura

```
harvin-dashboard/
├── index.html              # Punto de entrada
├── assets/
│   ├── css/styles.css      # Tema "obsidiana"
│   └── js/
│       ├── data.js         # Datos consolidados (window.HARVIN)
│       └── app.js          # Vistas, gráficas (ECharts) y router
├── .nojekyll
├── LICENSE
└── README.md
```

Sin paso de compilación. ECharts se carga por CDN; el resto es HTML/CSS/JS.

---

## Metodología y notas

- **Fuente:** 8 reportes del ERP (ventas por artículo y por cliente, cliente×artículo, existencia y valor, inactivos, rotación, cobranza).
- **Costeo:** todo margen y utilidad usa el **último costo de compra** de cada artículo (criterio indicado por la dirección). Los SKUs sin costo registrado (30) se excluyen del cálculo de margen.
- **Capital inmovilizado:** se define como SKU con existencia valorizada que **no registró ventas en el periodo**, validando contra el reporte de ventas reales (no se confía en la columna del reporte de "inactivos" del ERP, que incluye artículos que sí vendieron).
- **Rotación real:** COGS del periodo anualizado dividido entre el valor de inventario, para reflejar la velocidad financiera real del stock.
- **Sugerencia de compra:** artículos con cobertura menor a 30 días, reabasteciendo a 45 días de demanda al ritmo de venta del periodo.

## Actualizar los datos

Los datos viven en `assets/js/data.js` (objeto `window.HARVIN`). Para refrescar con nuevos reportes del ERP, regenerar ese archivo a partir del consolidado y volver a publicar. La estructura del objeto debe conservarse para que las vistas funcionen.

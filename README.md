# Harvin Distribuciones — Centro de Inteligencia Directiva

Tablero ejecutivo (BI) estático para la dirección de **Harvin Distribuciones**, distribuidor de autopartes. Consolida los 8 reportes del ERP en un solo panel interactivo con gráficas, KPIs y resúmenes ejecutivos por área, listo para publicarse en línea sin servidor ni base de datos.

Periodo analizado: **01 ene 2026 — 23 may 2026 (143 días)**. Moneda: **MXN**. Valuación de inventario y costeo a **último costo de compra** por artículo.

---

## Resumen del negocio

| Indicador | Valor |
|---|---|
| Ventas netas | **$5,892,271** (3,197 facturas · ticket $1,843) |
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
├── index.html                    # Punto de entrada
├── assets/
│   ├── css/styles.css            # Tema "obsidiana" + estilos de administración
│   ├── data/
│   │   ├── harvin-data.json      # Datos consolidados publicados (fuente principal)
│   │   ├── raw-store.json        # Acumulado crudo de reportes (para modo "Acumular")
│   │   └── users.json            # Usuarios publicados (huellas SHA-256, nunca contraseñas)
│   └── js/
│       ├── data.js               # Respaldo embebido de datos (fallback sin red)
│       ├── loader.js             # Carga harvin-data.json sin caché; fallback a data.js
│       ├── auth.js               # Login multiusuario y sesiones (HAUTH)
│       ├── github.js             # Publicación vía API de GitHub con token (HGH)
│       ├── ingest.js             # Lectura de XLSX/CSV del ERP y consolidación (HINGEST)
│       ├── app.js                # Vistas, gráficas (ECharts) y router
│       └── admin-views.js        # Login, "Actualizar Datos" y "Usuarios"
├── .nojekyll
├── LICENSE
└── README.md
```

Sin paso de compilación. ECharts y SheetJS se cargan por CDN; el resto es HTML/CSS/JS.

---

## Metodología y notas

- **Fuente:** 8 reportes del ERP (ventas por artículo y por cliente, cliente×artículo, existencia y valor, inactivos, rotación, cobranza).
- **Costeo:** todo margen y utilidad usa el **último costo de compra** de cada artículo (criterio indicado por la dirección). Los SKUs sin costo registrado (30) se excluyen del cálculo de margen.
- **Capital inmovilizado:** se define como SKU con existencia valorizada que **no registró ventas en el periodo**, validando contra el reporte de ventas reales (no se confía en la columna del reporte de "inactivos" del ERP, que incluye artículos que sí vendieron).
- **Rotación real:** COGS del periodo anualizado dividido entre el valor de inventario, para reflejar la velocidad financiera real del stock.
- **Sugerencia de compra:** artículos con cobertura menor a 30 días, reabasteciendo a 45 días de demanda al ritmo de venta del periodo.

## Acceso (login)

El tablero está protegido con inicio de sesión. El **superusuario** es `b3t0` (contraseña definida por la dirección). Existen dos roles:

- **Administrador** — ve todos los tableros y además puede cargar reportes y gestionar usuarios.
- **Consulta (viewer)** — solo ve los tableros.

El superusuario da de alta usuarios desde **Administración → Usuarios**: se captura usuario, contraseña y rol; el alta queda como *borrador local* y se activa para todos los dispositivos al pulsar **Publicar usuarios** (requiere token de GitHub). Las contraseñas nunca se guardan: solo su huella SHA-256 con sal aleatoria. La sesión dura 8 horas y vive solo en la pestaña.

## Actualización semanal de datos

Desde **Administración → Actualizar Datos** (solo administradores):

1. **Parámetros** — las fechas de inicio y corte **se detectan solas** del título de los reportes al cargarlos ("Del 1 de enero al 23 de mayo del 2026") y pueden corregirse a mano. El **número de facturas y el IVA ya no se capturan**: salen del reporte *Diarios de ventas* (una fila por factura con importe neto, impuesto y total). Modo de integración:
   - **Automático** (recomendado): el sistema decide según las fechas. Si los reportes cubren todo el periodo desde el inicio (como los emite el ERP: del 01-ene al corte), se reemplaza el histórico con ellos — el tablero queda actualizado con todo lo integrado, sin duplicar nada. Si los reportes traen únicamente días posteriores al último corte publicado, las ventas se acumulan al histórico.
   - **Reemplazar**: fuerza la reconstrucción desde cero con los reportes cargados.
   - **Acumular**: fuerza la suma sobre lo publicado (con advertencia si el periodo se traslapa, porque duplicaría ventas). Existencia, cobranza, rotación e inactivos siempre se toman del archivo más reciente (son fotografías del momento).
2. **Reportes** — arrastra los XLSX/CSV del ERP. El sistema detecta automáticamente el tipo de reporte (por su título), la fila de encabezados, el mapeo de columnas e incluso los **formatos agrupados por bloques** (Cliente×Artículo y Cobranza); todo es corregible a mano. Los reportes que no alimentan el tablero (Diario de compras, Cobros realizados) se reconocen y se marcan como "No requerido". No es obligatorio cargar todos los tipos: lo que falte conserva la información publicada y se marca con advertencia.
3. **Procesar** — consolida y muestra una previsualización comparativa (KPIs actuales vs nuevos, con deltas) y las advertencias detectadas. Nada se modifica todavía.
4. **Aplicar / Publicar** —
   - **Aplicar al tablero**: actualiza todas las vistas *solo en tu sesión*, para revisar antes de comprometer.
   - **Publicar al repositorio**: sube `harvin-data.json` y `raw-store.json` al repo con tu token de GitHub. GitHub Pages refleja el cambio en 1–2 minutos; el tablero lee el JSON **sin caché**, así que todos los usuarios ven los datos nuevos al recargar.
   - **Descargar JSON**: alternativa sin token, para subir los archivos a mano.

### Token de GitHub

Crear en GitHub → *Settings → Developer settings → Fine-grained personal access tokens*: acceso únicamente a este repositorio con permiso **Contents: Read and write**. El token se pega en el formulario, se guarda **solo en la pestaña** (sessionStorage), nunca se escribe en el repositorio y se borra al cerrar sesión.

### Reportes soportados

Ventas por artículo (VTSART) · Ventas por cliente (VTSCLIE) · Cliente×Artículo agrupado (VTSCLIEARTS) · Existencia y valor (EXIVAL) · Artículos inactivos (INA) · Rotación (ROTINV) · Cobranza agrupada (COB) · **Diarios de ventas (DRVETS)** — fuente oficial de facturas, IVA y venta neta contable. El detector identifica cada reporte por su título, tolera celdas combinadas (encabezados dispersos, descripciones sin encabezado), infiere columnas por contenido, lee las fechas del periodo del propio título y excluye totales, subtotales por bloque y pies de página ("Página N"). Formatos numéricos con `$`, comas y paréntesis para negativos. Los reportes *Diario de compras* (COMPRAS) y *Cobros realizados* (COBROS) se reconocen y se omiten porque no alimentan el tablero. En el diario de ventas la integración es **por folio**: volver a cargar facturas ya integradas no las duplica.

## Aviso de seguridad

Este es un **sitio estático**: el control de acceso ocurre en el navegador y los archivos del repositorio (incluidas las huellas de contraseña en `users.json`) son visibles para quien tenga acceso al repo. Para información sensible se recomienda publicar desde un **repositorio privado** con GitHub Pages y usar contraseñas fuertes. El token de GitHub nunca debe compartirse ni subirse al repositorio.

# Calculadora de Costos

App web para emprendedores argentinos (imprenta, sublimación, laminado, manualidades…) que calcula **costos de producción** y **precios de venta** por canal, con integración a Mercado Libre y cotización del dólar.

- Insumos con costo por unidad, historial de precios y gráfico de evolución (ARS y USD).
- Carga de precios manual, buscando en Mercado Libre o pegando un link de una publicación.
- Estadísticas de mercado (mínimo, mediana, promedio, máximo) descartando atípicos por IQR.
- Mano de obra con perfiles, calculadora de valor hora y comparación con valores de referencia.
- Costos fijos prorrateados por unidad y amortización de máquinas por uso.
- Productos con receta (BOM): fracciones, rinde por lote, merma y gráfico de torta del costo.
- Precio sugerido por canal (directa, ML Clásica/Premium, mayorista) manteniendo la ganancia neta, con IVA, comisiones, pasarela, cuotas y envío.
- Descuentos por volumen, punto de equilibrio y simulador "¿cuánto me queda si vendo a $X?".
- Presupuestos con PDF y envío por WhatsApp.
- Calculadora de impresión: costo de tinta por hoja según el precio de tus botes, su rendimiento y la cobertura de cada color.
- Dashboard, calculadora rápida, alertas de precios desactualizados (+30 días), backup JSON/CSV, modo oscuro y PWA instalable.

## Stack

Next.js 15 (App Router) · TypeScript estricto · Tailwind CSS 4 + shadcn/ui · React Hook Form + Zod · Prisma + Postgres (Supabase) · Recharts · @react-pdf/renderer · decimal.js · Vitest.

## Instalación

Requisitos: Node.js 20 o superior.

```bash
npm install                 # también corre `prisma generate`
cp .env.example .env        # en Windows: copy .env.example .env
npx prisma migrate dev      # crea las tablas en Supabase y carga los datos de ejemplo
npm run dev                 # http://localhost:3000
```

Para volver a cargar los datos de ejemplo desde cero: `npm run db:reset`.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run typecheck` | Chequeo de tipos |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Nueva migración de Prisma |
| `npm run db:seed` | Carga los datos de ejemplo |
| `npm run db:reset` | Borra la base, aplica migraciones y vuelve a cargar el seed |
| `npm run db:studio` | Prisma Studio, para ver la base |

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de Supabase por el pooler (puerto 6543, con `?pgbouncer=true`). Lo usa la app. |
| `DIRECT_URL` | Connection string directo (puerto 5432). Lo usan las migraciones de Prisma. |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app |
| `MELI_CLIENT_ID` | App ID de tu aplicación de Mercado Libre |
| `MELI_CLIENT_SECRET` | Clave secreta de la app. **Queda solo en el servidor.** |
| `MELI_REDIRECT_URI` | URL de retorno del OAuth. Tiene que coincidir exacto con la configurada en ML. |

La integración con Mercado Libre es **opcional**: sin esas variables, la app funciona igual y los precios se cargan a mano.

## Cómo crear la app en Mercado Libre

1. Entrá a [developers.mercadolibre.com.ar/devcenter](https://developers.mercadolibre.com.ar/devcenter) con tu cuenta de ML y tocá **Crear una aplicación**.
2. Completá nombre, nombre corto y descripción. En **URIs de redirect** poné la URL de callback:
   - En producción: `https://tu-dominio.com/api/meli/callback`.
   - En desarrollo, ML exige `https`. Tenés dos opciones:
     - **Opción a.** Corré `npm run dev:https` y usá `https://localhost:3000/api/meli/callback`.
     - **Opción b.** Usá un túnel (ngrok, Cloudflare Tunnel) y su URL `https`.
3. En **Scopes** alcanza con *read* (lectura). Agregá *offline_access* para que el token se pueda refrescar.
4. Guardá. Pegá el **App ID** y la **Secret Key** en **Ajustes → Mercado Libre** (quedan guardados en la base, del lado del servidor). Si preferís, podés ponerlos en el `.env` (`MELI_CLIENT_ID`, `MELI_CLIENT_SECRET`, `MELI_REDIRECT_URI`), que tiene prioridad.
5. Abrí la app con `npm run dev:https`, entrá a `https://localhost:3000/ajustes` y tocá **Conectar con Mercado Libre**.

### Cómo funciona la integración

- El OAuth usa `state` (anti-CSRF) y PKCE. El access token y el refresh token se guardan **en la base, del lado del servidor** (tabla `MeliToken`) y se refrescan solos antes de vencer. El navegador nunca ve credenciales: siempre le pega a las Route Handlers propias (`/api/meli/*`).
- `GET /api/meli/search?q=` busca en `sites/MLA/search` y devuelve resultados más estadísticas IQR. Muchas apps reciben **403** en ese endpoint, aun autenticadas. En ese caso se usa el **catálogo de productos** (`/products/search`) con el precio de la publicación ganadora.
- `GET /api/meli/item?url=` extrae el ID de un link y consulta `/items/{id}`. Acepta links de artículo (`MLA-123…`), de catálogo (`/p/MLA…`) o el ID suelto.
- Las respuestas se cachean **30 minutos** en la tabla `MeliCache`.
- Si algo falla (sin configurar, sin conectar, token vencido, bloqueo o red), se muestra un mensaje claro y siempre se puede cargar el precio a mano.

## Tests

```bash
npm test
```

La lógica de cálculo vive en funciones puras en [`src/lib/calc`](src/lib/calc), con tests en `src/lib/calc/__tests__`. Incluye el caso del seed:

> **Foto plastificada A4** = 1 pouch ($28.949 / 100 = $289,49) + 1 hoja fotográfica ($300) + 1 impresión ($600) → **$1.189,49**

También hay tests de formato de moneda es-AR, parseo de montos tipeados ("28.949", "0,25"), parseo de links de ML, normalización de respuestas, CSV, presupuestos y el mensaje de WhatsApp.

## Decisiones de diseño

- **Plata sin floats.** Montos y cantidades se guardan como `Decimal` de Prisma (funciona igual en SQLite y Postgres) y se calculan con `decimal.js`. Se redondea a centavos solo al mostrar o al congelar un precio en un presupuesto. Los Decimal se pasan como `string` de Server a Client Components.
- **Validación compartida.** Los mismos schemas Zod (`src/lib/schemas`) validan el formulario en el navegador y la Server Action en el servidor.
- **Fórmula por canal.** `precio = (costo + ganancia + cargo fijo + envío) ÷ (1/(1+IVA) − comisiones%)`. Las comisiones se cobran sobre el precio final, así la ganancia neta queda igual en todos los canales. El IVA solo aplica si sos Responsable Inscripto.
- **Margen vs. markup.** Margen = ganancia ÷ precio. Markup = ganancia ÷ costo. Se elige en Ajustes y se puede pisar por producto.
- **Merma.** Se aplica sobre los materiales.
- **Costos fijos.** Se prorratean entre la producción mensual estimada. Las máquinas se amortizan por uso (precio ÷ vida útil).
- **Presupuestos.** Guardan una copia de la descripción y el precio: si después sube un insumo, el presupuesto enviado no cambia.
- **Dólar.** Viene de [dolarapi.com](https://dolarapi.com), cacheado 15 minutos. Cada cambio de precio guarda la cotización MEP del día, para comparar la evolución en USD y detectar insumos que subieron más que el dólar.
- **Un solo usuario, sin login.** Hay un único registro `Business`.

## Calculadora de impresión

En **Impresión** cargás cada tinta con el precio del bote o cartucho y su **rendimiento en páginas**. Es el dato del fabricante, que siempre se mide en hojas A4 al 5% de cobertura (norma ISO/IEC 24711).

Después elegís qué vas a imprimir: texto, documento, flyer o foto a sangre. También podés ajustar la **cobertura de cada color**, el tamaño de la hoja, la merma por limpiezas de cabezal y el papel.

```
tinta por hoja = Σ (precio ÷ rendimiento) × (cobertura ÷ 5%) × (área ÷ A4) × (1 + merma)
```

Ejemplo: botes CMYK de $12.000 (negro rinde 7.500 páginas, colores 6.000), foto A4 a sangre (negro 15%, colores 40%) y 10% de merma → **$58,08 de tinta por hoja**.

El resultado se guarda como insumo (servicio) para usarlo en las recetas. Si ya existe un insumo con el mismo nombre, se actualiza su precio. Las coberturas de los presets son orientativas.

## Base de datos (Supabase)

1. En Supabase: **Connect → ORMs → Prisma** y copiá `DATABASE_URL` y `DIRECT_URL` al `.env` (con tu contraseña, sin corchetes).
2. Corré `npx prisma migrate dev` para crear las tablas.
3. Para pasar datos entre bases: exportá el backup JSON desde **Ajustes** y restauralo en la otra.

Para varios usuarios habría que sumar auth (por ejemplo Supabase Auth) y un `businessId` en cada tabla.

## Estructura

```
prisma/              schema, migraciones y seed
public/              íconos PWA, service worker, página offline
src/app/             páginas (App Router) y Route Handlers (api/meli, api/dolar, api/backup, api/presupuestos)
src/actions/         Server Actions (mutaciones)
src/components/      ui (shadcn) + componentes por módulo
src/lib/calc/        lógica de cálculo pura + tests
src/lib/meli/        cliente ML (OAuth, cache, API, parseo de links)
src/lib/schemas/     schemas Zod compartidos
src/server/          consultas y armado de datos del lado del servidor
src/stores/          Zustand (preferencia ARS/USD)
```

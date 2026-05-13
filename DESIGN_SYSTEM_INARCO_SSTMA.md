# Inarco SSTMA · Sistema de Diseño Unificado

> Guía para Claude y el equipo de frontend. Esta es la **única fuente de verdad**
> para todas las pantallas del sistema SSTMA de Inarco. Antes de tocar cualquier
> componente nuevo, lee este archivo y revisa `index.html` (lienzo visual).

**Versión:** 1.0 · Mayo 2026
**Stack actual:** Angular + Angular Material
**Objetivo:** Unificar diseño, reemplazar el look "Material genérico" por una
identidad industrial-constructora coherente con la marca Inarco.

---

## 0 · Diagnóstico de las pantallas actuales

Lo que vimos en producción que **NO debe repetirse**:

| Pantalla | Problema |
|---|---|
| Reporte Histórico | Card de filtros flota sola en océano de espacio blanco. |
| Reporte SSTMA Obra | Filtros y tabla en cards separadas, tabla apretada, riesgos en texto plano. |
| Ingreso Accidente | Stepper visualmente pobre, 50 campos abiertos sin priorización, ícono naranja roto frente al resto del sistema. |
| Sidebar | Sin logo, sin nombre Inarco — parece cualquier ERP genérico. |
| Topbar | Vacío salvo por el nombre del usuario, desperdiciando 1440×56 px. |

---

## 1 · Tokens

### 1.1 Color

Tres familias. Nada más. No inventar variantes.

#### Marca
```css
--ink:          #0B1B3F;  /* Inarco Navy — chrome, CTA primario, headings */
--ink-2:        #142455;  /* Hover/depth del navy */
--ink-3:        #1C2F6B;  /* Acento sutil sobre navy */
--yellow:       #FFC629;  /* Amarillo construcción — acento, máx 1 por pantalla */
--yellow-deep:  #E0A500;  /* Hover/text del amarillo */
```

**Regla del amarillo:** máximo **un elemento** amarillo prominente por pantalla
(usualmente el CTA "Generar" o el ítem activo del sidebar). El amarillo grita
"acción importante"; si grita todo, no grita nada.

#### Neutros cálidos
```css
--paper:     #F6F4EF;  /* Fondo de página (no blanco puro) */
--paper-2:   #EFECE4;  /* Fondo secundario */
--slate-50:  #F3F4F8;  /* Hover de filas, fondos sutiles */
--slate-100: #E8EAF0;  /* Bordes default */
--slate-200: #D3D6E1;  /* Bordes de input */
--slate-300: #B7BBCD;  /* Placeholders */
--slate-500: #6C7290;  /* Texto secundario */
--slate-700: #404662;  /* Texto regular */
--slate-900: #15192A;  /* Texto principal */
```

#### Estado semántico
```css
--danger:   #C8321E;  /* Solo peligro / accidente fatal / errores destructivos */
--success:  #1F7A4B;  /* Solo confirmaciones positivas */
--info:     #1F5FB8;  /* Información neutra */
/* Atención usa --yellow */
```

### 1.2 Tipografía

**Migrar de Roboto** a este pair industrial:

```css
/* Cargar en index.html */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

| Rol | Fuente | Uso |
|---|---|---|
| Display / títulos | **Space Grotesk** | H1–H3, números grandes en KPIs, marca |
| Texto / UI | **DM Sans** | Body, labels, botones, tabla |
| Mono | **JetBrains Mono** | IDs (`ACC-2026-0147`), fechas (`12-05-2026`), horas, contadores |

**Escala fija — no usar tamaños intermedios:**

| Token | Tamaño | Uso |
|---|---|---|
| `--text-xs` | 11px | Eyebrows en mayúsculas, helpers, footer de filas |
| `--text-sm` | 12.5px | Texto de chips, paginación, metadatos |
| `--text-base` | 13.5px | Body principal, celdas de tabla |
| `--text-md` | 16px | Subtítulos de card |
| `--text-lg` | 22px | H2 de sección |
| `--text-xl` | 32px | H1 de página |
| `--text-display` | 44–56px | Solo títulos hero (tokens, splash) |

### 1.3 Espaciado

Base **4**. Solo usar: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64`.

### 1.4 Radios

```css
--radius-sm:  6px;   /* Inputs, botones pequeños, chips */
--radius-md:  8px;   /* Botones, filtros */
--radius-lg:  10px;  /* Cards pequeñas, KPIs */
--radius-xl:  14px;  /* Paneles, cards principales */
--radius-pill: 999px;
```

### 1.5 Sombras

```css
--shadow-sm: 0 1px 0 rgba(11, 27, 63, 0.02);  /* Cards */
--shadow-md: 0 4px 12px rgba(11, 27, 63, 0.06);  /* Modales */
--shadow-lg: 0 12px 32px rgba(11, 27, 63, 0.12);  /* Popovers */
```

### 1.6 Iconografía

**Material Symbols Rounded**, peso 400, una sola familia.
- Tamaño default: 18px
- Tamaño en sidebar: 18px
- Tamaño en KPI badges: 18px
- Tamaño en mini-actions: 14–15px
- `fill: 1` **solo** cuando el ítem está activo, seleccionado o representa estado fuerte (peligro, éxito).

```html
<link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet">
```

---

## 2 · Componentes núcleo

Reemplazan a los `mat-*` cuando hay equivalente. Mantener `mat-*` solo
para selects con búsqueda y datepickers complejos.

### 2.1 Botones

5 variantes, 2 tamaños (38px / 32px). Nunca más de 1 botón "accent" amarillo por pantalla.

| Variante | Background | Color | Cuándo |
|---|---|---|---|
| `primary` | `--ink` | `#fff` | Guardar, Actualizar, acción default |
| `accent` | `--yellow` | `--ink` | CTA destacado (Generar reporte, Continuar) |
| `secondary` | `#fff` + border `--slate-200` | `--ink` | Acciones secundarias |
| `ghost` | transparent | `--ink` | Limpiar, Cancelar |
| `danger` | `--danger` | `#fff` | Eliminar, acciones destructivas |

### 2.2 Pills de estado

```
[●  Pendiente]   neutral
[●  En revisión] info
[✓  Cerrado]     success
[!  Atención]    warn
[!  Crítico]     danger
[●  INARCO]      brand (texto amarillo sobre navy)
```

- Padding `4px 10px`, radio `999px`
- Borde tonal `#XXX25`
- Siempre con ícono, peso 600, letra 11.5

### 2.3 Inputs

- Alto: **40px**
- Label arriba en eyebrow (11px, 0.8 tracking, uppercase, gris 500)
- Required: asterisco rojo al lado del label
- Focus: borde `1.5px solid --ink` + outline `0 0 0 4px rgba(11,27,63,0.06)`
- Placeholder: `--slate-300`
- Datos numéricos / fechas: `font-family: 'JetBrains Mono'`, weight 500

### 2.4 Cards

```
┌──────────────────────────────────────┐
│ EYEBROW                              │  ← 11px, letter-spacing 1.4, slate-500
│ Título principal                     │  ← Space Grotesk 18px 600
├──────────────────────────────────────┤
│                                      │
│  Contenido — padding 24px            │
│                                      │
└──────────────────────────────────────┘
```

- Background `#fff`
- Radio `14px`
- Borde `1px solid --slate-100`
- Sombra `--shadow-sm`
- Header con `border-bottom: 1px solid --slate-100`

### 2.5 KPI Tile

- Alto ~110px
- Background `#fff` (o `--ink` para 1 destacado por fila — máx 1)
- Label arriba (eyebrow), ícono caja redondeada arriba-derecha
- Valor en Space Grotesk 38px 700 letter-spacing -1
- Delta abajo con color tonal y "vs. mes anterior"

### 2.6 Tabla

- Header: 12px padding vertical, eyebrow uppercase 11px
- Filas: 14px padding vertical, zebra suave (`--slate-50`)
- Border-bottom 1px slate-100
- Edge-to-edge dentro de su card contenedora (sin padding lateral en el card)
- ID en mono 12.5px 600 — `#0147` formato
- Acciones a la derecha: botones cuadrados 30×30 con `--slate-200` border

---

## 3 · Layout

### 3.1 Sidebar

```
┌─────────────────┐
│ [IN] INARCO     │  ← Bloque de marca, 36×36 amarillo + nombre Space Grotesk
│      SSTMA·2026 │  ← Sublabel amarillo 10.5px tracking 1.2
├─────────────────┤
│ MÓDULOS DE SSTMA│  ← Eyebrow 10px tracking 1.4 opacity 0.45
│  ▣ Plan...      │
│  ▼ Reportes     │
│     · Histórico │  ← Activo: bg amarillo 14% + barra amarilla 3px izq
│  ...            │
├─────────────────┤
│ ● Sincronizado  │  ← Status footer
└─────────────────┘
```

- Ancho expandido: **256px**
- Ancho colapsado: **64px**
- Background: `--ink`
- Texto: `#fff`
- Item activo: barra amarilla 3px a la izquierda + bg `rgba(255,198,41,0.14)` + texto amarillo

### 3.2 Topbar

- Alto: **56px**
- Background: `#fff`
- Contiene: `[Hamburguesa] [Breadcrumbs] ... [Obra selector] [Search] [Notif] [User]`
- Selector de obra siempre visible — comunica contexto de trabajo

### 3.3 Página

- Padding: **28px 32px**
- Background: `--paper` (no blanco)
- Header de página: H1 + eyebrow + descripción + acciones a la derecha (gap 8)
- Después del header: franja de KPIs (4 columnas)
- Después: contenido principal

---

## 4 · Las 10 reglas de oro

### 01 · Un solo lenguaje cromático
- Inarco Navy para chrome y primario
- Amarillo solo como **acento**, máximo 1 por pantalla
- Estados semánticos solo cuando corresponde (rojo SOLO para peligro)
- ❌ Nada de azul-rey, celestes, naranjas random

### 02 · Una tipografía industrial, no Material default
- Space Grotesk + DM Sans + JetBrains Mono
- Escala fija (ver §1.2)
- ❌ Nada de tamaños intermedios (15, 17, 19px)

### 03 · No más cards flotando en océanos de espacio
Si una pantalla tiene una sola card de filtros, **construye su contraparte**:
- Filtros 380px izquierda + preview/resultados derecha
- O filtros como chips arriba + tabla abajo
- ❌ La pantalla nunca espera al usuario en blanco

### 04 · Tablas edge-to-edge
- Filtros + tabla en **el mismo contenedor**
- Tabla sin padding lateral dentro del card
- Filas 14px vertical, zebra `--slate-50`
- Paginación dentro del mismo card abajo
- ❌ No cards anidadas en cards anidadas

### 05 · Identidad Inarco siempre presente
- Bloque de marca en sidebar (no solo "Módulos")
- Avatar del usuario: navy con iniciales en amarillo
- Subtítulo "Prevencionista · INARCO" bajo el nombre
- ❌ No parecer un ERP genérico cualquiera

### 06 · Estados de carga, vacío y error con personalidad
- Estado vacío: ícono + mensaje + CTA sugerido ("Sin reportes en este rango — prueba Trimestre")
- Estado de carga: skeleton lines, no spinner Material
- Errores: pill rojo con ícono + acción de recovery

### 07 · Wizards con contexto, no formularios kilométricos
- Stepper grande (38px badges), paso activo con borde amarillo
- Sidebar derecho con: contexto de la obra (KPIs en navy) + checklist de completitud + auto-save visible
- Footer fijo con: Cancelar | Próximo paso | Guardar y salir | Continuar
- ❌ No 50 inputs apilados sin jerarquía

### 08 · Métrica primero, control después
- Toda pantalla de listado/reporte abre con franja de **4–5 KPIs**
- Total · por categoría · críticos abiertos · rango activo
- El usuario ve el estado del negocio **antes** de filtrar

### 09 · Pills semánticas, no texto plano
- Riesgos: `Caídas de altura` → pill rojo con ícono warning
- "Buena práctica" → pill verde con ícono check
- Conteos: `147 registros` → pill con ícono apartment
- ❌ No `CAIDAS DE ALTURA` en texto plano mayúscula

### 10 · Iconografía única
- **Material Symbols Rounded** peso 400
- `fill: 1` solo cuando seleccionado/activo/estado fuerte
- ❌ No mezclar Material Outlined con Filled arbitrariamente

---

## 5 · Aplicación pantalla por pantalla

### 5.1 Reporte Histórico
- Layout 2 columnas: filtros 380px + preview 1fr
- Franja de KPIs arriba: Reportes generados · Plan Personalizado · Inspecciones · Rango activo
- Filtros: tipo + desde/hasta + atajos (Hoy / 7d / 30d / Mes / Trimestre / Año) + obra + riesgo + formato (PDF / Excel / JSON como cards de 56px)
- Preview: mini-chart de barras por semana (última en amarillo) + lista de resultados
- CTA: "Generar" en amarillo abajo a la derecha de filtros

### 5.2 Reporte SSTMA Obra
- Header con badge "147 registros" + Exportar Excel + Actualizar
- Franja de 5 KPIs: Total · Seguridad · Salud · Medio Ambiente · Críticos abiertos
- Filtros como chips (Obra · Empresa · Ámbito · Riesgo · Fecha) + search a la derecha
- Tabla edge-to-edge con zebra: ID mono · Obra · Empresa (pill INARCO marca o neutral) · Ámbito · Riesgo (pill semántico) · Fecha mono · Acciones
- Paginación dentro del card abajo

### 5.3 Ingreso Accidente
- Header destacado con barra roja izquierda (4px) + ícono cuadrado rojo + Pill "EN CURSO" + auto-save visible
- Stepper grande horizontal con 5 pasos, paso activo en navy con borde amarillo
- 2 columnas: formulario 1fr + sidebar contexto 320px
- Sidebar: card navy con KPIs de la obra (Días sin acc · Trabajadores · Acc YTD · Cumplimiento) + checklist de completitud + progress bar
- **Selector de gravedad visual** (4 cards: Leve verde / Moderado amarillo / Grave naranja / Fatal rojo)
- Footer fijo: Cancelar | Próximo paso info | Guardar y salir | Continuar al paso N

### 5.4 Listado de Accidentes
- Mismo patrón que Reporte SSTMA Obra
- KPIs: Total · Abiertos · Cerrados · Días perdidos · Críticos
- Filtros: Empresa · Obra · Gravedad · Estado · Fecha

### 5.5 Estadísticas
- Hero con número grande del KPI más importante (ej. "Días sin accidente: 47")
- Grid de 3 columnas con gráficos: barras por mes, pie por ámbito, línea de tendencia
- Tabla resumen abajo

### 5.6 Masa Laboral
- Tabla densa
- Filtros por empresa/obra/cargo
- KPIs: Total trabajadores · Inducciones vencidas · Próximas a vencer

### 5.7 Trabajadores
- Listado con avatar circular (iniciales en navy + amarillo)
- Filtros tipo chip
- Modal de detalle con tabs (Datos · Inducciones · Accidentes · EPP)

### 5.8 Plan Personalizado / Programa Personalizado
- Vista de calendario semanal/mensual
- Eventos con pill semántico según ámbito
- Sidebar de cumplimiento con barra de progreso

---

## 6 · Checklist de implementación para Claude

Cuando rediseñes una pantalla, verifica **todo** lo siguiente antes de cerrar:

- [ ] Usa solo los tokens de color (no hardcoded hex)
- [ ] Fuentes: Space Grotesk en títulos, DM Sans en texto, JetBrains Mono en datos
- [ ] Sidebar tiene bloque de marca INARCO
- [ ] Topbar tiene selector de obra activa
- [ ] La página abre con KPIs, no con filtros vacíos
- [ ] Cards anidadas → unificadas en 1 contenedor edge-to-edge
- [ ] Pills semánticos con ícono — no texto plano para estados
- [ ] Máximo 1 elemento amarillo por pantalla
- [ ] Iconos en Material Symbols Rounded peso 400
- [ ] `fill: 1` solo en activos
- [ ] Avatar del usuario navy + iniciales amarillas
- [ ] Estado vacío tiene mensaje + CTA
- [ ] Estado de error usa pill rojo con recovery action
- [ ] Auto-save / status visible cuando aplica
- [ ] Padding de página: 28px 32px
- [ ] Background de página: `--paper` (no blanco)

---

## 7 · Prompt sugerido para Claude

> Toma el archivo `DESIGN_SYSTEM_INARCO_SSTMA.md` como única fuente de verdad.
> Quiero que rediseñes la pantalla **[NOMBRE]** del sistema SSTMA de Inarco
> siguiendo estos lineamientos al 100%.
>
> Pasos:
> 1. Lee el .md completo
> 2. Lee el código actual de la pantalla en `enterprise/src/app/...`
> 3. Identifica qué viola las 10 reglas
> 4. Propón el nuevo layout en HTML/CSS standalone primero (sin Angular) para revisar el visual
> 5. Una vez aprobado, migra a los componentes Angular del proyecto manteniendo el sistema de diseño

---

## 8 · Archivos relacionados

- `index.html` — lienzo visual con tokens, componentes y 3 pantallas rediseñadas
- `tokens.jsx` — código de referencia de los tokens
- `frame.jsx` — sidebar + topbar unificados
- `components-library.jsx` — implementación de Btn, Pill, Field, Card, StatTile
- `screen-historico.jsx`, `screen-sstma-obra.jsx`, `screen-accidente.jsx` — pantallas ejemplo

---

**Última actualización:** Mayo 2026
**Mantenido por:** Felipe Gallardo (Prevencionista · INARCO) + equipo de diseño

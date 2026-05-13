# Rediseño SSTMA · Bitácora de implementación

> Bitácora del trabajo realizado sobre la rama **`feature/new-design`** para
> aplicar el sistema de diseño documentado en `DESIGN_SYSTEM_INARCO_SSTMA.md`.
> Esta es la fuente de verdad operativa: convenciones, archivos clave, deuda
> conocida y patrones reutilizables.

**Última actualización:** Mayo 2026
**Stack:** Angular 18 standalone + Material 18 + Chart.js + Bootstrap (legacy)
**Fuente de verdad del DS:** `DESIGN_SYSTEM_INARCO_SSTMA.md` en raíz del repo
**Build verificado:** `npx ng build --configuration development` exit 0

---

## 0 · Antes de empezar

### Por qué existe este documento

El rediseño tocó ~40 archivos, definió convenciones nuevas (variantes de
botón, patrón de page header, row actions) y creó capas que no estaban antes
(tokens semánticos, theme service, ui kit). Este log registra:

- **Qué se hizo** y **por qué**, en cada capa
- **Convenciones** que toda pantalla nueva debe respetar
- **Deuda conocida** y dónde vive
- **Cómo personalizar** la apariencia sin tocar componentes

### Stack relevante

- `src/styles/_tokens.scss` · primitivas y tokens semánticos
- `src/styles.scss` · overrides globales, dark mode, mat-button bridge
- `src/app/shared/ui/` · librería de componentes atómicos
- `src/app/core/services/theme.service.ts` · light/dark + persistencia

---

## 1 · Fundación

### Tokens (`src/styles/_tokens.scss`)

**Primitivas:**
- Marca: `--ink` `#0B1B3F` (navy), `--ink-2/-3` (hover/acento), `--yellow` `#FFC629`, `--yellow-deep`
- Neutros: `--paper` `#F6F4EF` (fondo), `--paper-2`, `--slate-50..900`
- Semánticos: `--danger` `#C8321E`, `--success` `#1F7A4B`, `--info` `#1F5FB8`
- Tipografía: `--font-display` (Space Grotesk), `--font-text` (DM Sans), `--font-mono` (JetBrains Mono)
- Escala fija: `--text-xs/sm/base/md/lg/xl/display`
- Espaciado base 4: `--space-1..16`
- Radios: `--radius-sm/md/lg/xl/pill`
- Sombras: `--shadow-sm/md/lg`

**Tokens semánticos (capa de personalización):**

```scss
--surface           // card / panel bg (#fff light, dark navy en dark)
--surface-muted     // footer card, zonas secundarias
--surface-page      // fondo de página
--surface-strong    // hero navy

--text-primary      // headings (slate-900)
--text-secondary    // body (slate-700)
--text-muted        // captions, eyebrow (slate-500)

--border-subtle     // card border (slate-100)
--border-strong     // inputs, dividers (slate-200)

// Botones — un set por variante con bg / fg / hover
--btn-primary-*     --btn-accent-*     --btn-secondary-*
--btn-ghost-*       --btn-danger-*

--pill-neutral-bg / --pill-neutral-fg
--focus-ring        // 0 0 0 3px rgba(11, 27, 63, 0.12)
```

Para una "personalización" futura (skin, white-label, modo daltónico) solo se
sobrescriben estos semánticos en un wrapper (`body.theme-x { --btn-accent-bg: ...; }`)
y todos los componentes consumidores cambian.

### Fuentes y iconos (`src/index.html`)

Cargados en paralelo a Roboto/Material Icons legacy:
- Space Grotesk + DM Sans + JetBrains Mono (Google Fonts)
- **Material Symbols Rounded** — única familia de iconos del nuevo DS

Roboto y Material Icons se mantienen como red de seguridad hasta que toda
pantalla legacy haya migrado. Iconos nuevos usan la clase `.ms-r`.

### Styles globales (`src/styles.scss`)

Contiene en orden:
1. Imports de tokens y dialogs
2. Variables legacy `--font-size-*` preservadas
3. Body en DM Sans + headings en Space Grotesk
4. Override global de `.page-header__title` a peso 600
5. Layout primitives globales: `.page`, `.eyebrow`, `.page-header*`
6. Mat-button bridge (color primary→`--ink`, accent→`--yellow`, warn→`--danger`)
7. Mat-spinner color `--ink`
8. `.row-action` (30×30 button)
9. `.field .mat-mdc-form-field` normalización (label oculta, altura 40px, sin notch)
10. Overrides de dark mode (`:root[data-theme="dark"]`)
11. Mat-menu panels: `.obra-menu-panel`, `.user-menu-panel`

---

## 2 · Librería UI compartida (`src/app/shared/ui/`)

Cuatro componentes standalone que solo consumen tokens:

### `<app-btn>`
- Variantes: `primary` (navy) · `accent` (amarillo CTA) · `secondary` (blanco+borde) · `ghost` (transparente) · `danger` (rojo)
- Tamaños: `md` (38px) · `sm` (32px)
- Inputs: `type`, `disabled`, `loading`, `block`, `icon`, `iconRight`, `formId`, `ariaLabel`
- Content projection para el texto, ícono interno con Material Symbols Rounded

### `<app-pill>`
- Variantes: `neutral` · `info` · `success` · `warn` · `danger` · `brand`
- Input: `icon?`
- Padding 4×10, radio pill, font 11.5px peso 600

### `<app-kpi-tile>`
- Inputs: `eyebrow?`, `label`, `value`, `delta?`, `deltaTone`, `icon?`, `highlight`
- Valor en Space Grotesk 38px 700, mín 110px alto, host con `height: 100%` para grid-stretch
- Variante `highlight` invierte a navy con texto blanco + amarillo

### `<app-spinner>`
- Sizes: `xs(16)` · `sm(24)` · `md(40)` · `lg(56)`
- Tones: `ink` (default navy) · `yellow` · `inherit`
- Inputs: `label?`, `block`
- SVG inline con animación CSS, sin dependencia de Material

**Barrel:** `src/app/shared/ui/index.ts` exporta los 4 componentes + sus tipos.

---

## 3 · Theme system (light/dark)

### `ThemeService` (`src/app/core/services/theme.service.ts`)

- `mode$: Observable<'light' | 'dark'>`
- `toggle()`, `setMode(mode)`, `current`
- Persiste en `localStorage` key `inarco:theme`
- Respeta `prefers-color-scheme` del SO como default
- Aplica `data-theme="dark"` en `<html>` al cambiar

### Paleta dark (`styles.scss` bajo `:root[data-theme="dark"]`)

Neutros invertidos manteniendo brand y semánticos:
- `--paper` → `#0E1428`, `--slate-50` → `#1A2240`, `--slate-900` → `#ECEEFC`
- `--ink` ilumina ligeramente (`#1A2A52`) para diferenciarse del fondo
- `--yellow`, `--danger`, `--success`, `--info` se mantienen idénticos
- `--surface` flip a `#131A33`

**Overrides globales agresivos** porque hay 60+ archivos con `background: #fff`
hardcoded en SCSS legacy. Lista de selectores cubiertos:
- DS nuevo: `.card`, `.form-card`, `.report-card`, `.preview-panel`, `.filters-panel`, `.chart-card`, `.summary-card`, `.kpi-tile`, `.hero-card`, `.sidebar-card`, `.tabs-card`, `.pdf-block`
- Legacy: `.mat-mdc-card`, `mat-card`, `.map-card`, `.map-container`, `.params-container`, `.access-container`, `.workers-container`, `.masa-laboral-container`, `.dashboard-container`, `.statistics-container`, `.accidents-container`, `.accidents-list-container`, `.worker-form-container`, `.form-container`, `.filters-container`, `.table-container`, `.info-card`, `.info-section`, `.indicators-card`, `.kpi-dashboard-card`, `.horizontal-calendar-container`, `.modal-container`, `.detail-dialog`, `.dashboard-card`, `.tasks-section`, `.periodo-destino-section`
- Texto: headings `h1..h6`, `.title`, `.section-title`, `.mat-mdc-card-title` → `--slate-900`
- Subtítulos y hints → `--slate-500`
- Mat-table, mat-form-field, mat-select-panel, mat-dialog-surface
- Topbar, sidebar, mat-menu panels

### Toggle en menú de usuario

`navbar.component.html` user menu trae:
- Header con avatar 40×40 navy + nombre + rol
- "Mi perfil" → `/check-list/administration/password-change` (sin pantalla dedicada todavía)
- "Cambiar clave" → `/check-list/administration/password-change`
- "Modo oscuro" con switch tipo iOS (knob amarillo cuando ON)
- Separador
- "Cerrar sesión" en variante danger (rojo)

---

## 4 · Chrome · Sidebar + Topbar

### Sidebar (`src/app/layout/sidebar/`)

- Ancho 256px expandido / 64px colapsado, fondo `--ink`
- **Bloque marca** arriba: cuadrado amarillo `[IN]` + "INARCO" Space Grotesk + sublabel "SSTMA · 2026" amarillo
- Eyebrow "MÓDULOS DE SSTMA" (gris claro uppercase letter-spacing 0.14em)
- 1 ítem directo (Plan Personalizado) + 5 grupos colapsables (Reportes, Accidentes, Programa Personalizado, Mantenedor, Administración)
- Item activo: barra amarilla 3px izq + bg `rgba(255, 198, 41, 0.14)` + texto + ícono amarillo
- Sub-items con punto guía vertical y indentación
- Status footer "● Sincronizado" con punto verde glow

Activación con `routerLinkActive="is-active"` en cada link.

### Topbar (`src/app/layout/navbar/`)

Renombrado de `.navbar` → `.app-topbar` para evitar colisión con Bootstrap.

Layout: `flex; align-items: stretch; height: 56px` con sub-contenedores
`__left/__right` en `align-items: center; height: 100%`. Todos los items
internos llevan `align-self: center` para superar el desfase de baseline del
glyph de Material Symbols.

**Contenido:**
- Hamburguesa (`.app-topbar__icon-btn` 36×36)
- Breadcrumbs auto-generados desde la URL via `Router.events filter NavigationEnd`. Mapa segmento → label en `navbar.component.ts`. Segmentos numéricos (IDs) se saltan.
- Obra selector: button trigger + `<mat-menu>` (no `<select>` nativo, no estilizable). Cablea `ObraService.getObrasByUser(userId)` y `ProjectSelectionService`. Al seleccionar, navega a `/check-list/obras/:id`.
- Botón de notificaciones (placeholder)
- User button: avatar navy+amarillo 36×36 con iniciales + nombre + rol "PREVENCIONISTA · INARCO"

### Layout wrapper (`check-list-layout.component.scss`)

`.layout-container` flex column 100vh, `.content-wrapper` flex con sidebar 256/64
+ `.main-content` flex 1 con `overflow-y: auto`. Fondo `--paper`.

---

## 5 · Pantallas rediseñadas

### Convenciones aplicadas en cada una

- `<section class="page">` con padding 28×32 fondo `--paper`
- `<header class="page-header">` con eyebrow + H1 Space Grotesk + descripción + acciones
- KPI strip de 4–5 `<app-kpi-tile>` en grid (primero con `[highlight]="true"`)
- Cards edge-to-edge con table interna sin padding lateral
- Pills semánticas con icono para estados (sin texto plano)
- Row actions cuadrados 30×30 (`.row-action`, `.row-action--danger`)
- Pagination dentro del card en footer slate-50
- Empty state con icono Material Symbols Rounded + CTA recovery

### §5 del DS · 8 pantallas

| § | Ruta | Componente | Notas |
|---|---|---|---|
| 5.1 | `/check-list/reports/history` | `HistoryReportComponent` | 2 cols (filtros 380px + preview 1fr) + tabs Métricas/Datos. Export Excel real desde preview. |
| 5.2 | `/check-list/reports/sstma-obra` | `SstmaObraReportComponent` | Card edge-to-edge + 5 KPIs + filter chips + pills semánticas. Mat-Table propio. |
| 5.3 | `/check-list/accidents/register` y `/edit/:id` | `AccidentsComponent` | Wizard 5 pasos. Header rojo. Stepper grande con badges 38px navy + borde amarillo. Sidebar contextual con KPIs obra (placeholder) + checklist completitud + progress. Severity cards 5 variantes (success/info/warn/orange/danger). Auto-save real con debounce 1.5s en localStorage. Footer sticky. |
| 5.4 | `/check-list/accidents/list` | `AccidentsListComponent` | Patrón espejo de 5.2. Helpers `severityVariant` y `estadoVariant`. |
| 5.5 | `/check-list/accidents/statistics` | `AccidentsStatisticsComponent` | Hero card navy "Días sin accidente" en display 44px amarillo. 5 KPIs. Charts 3 cols + 2 wide. Tabla resumen partes del cuerpo. Chart.js mantenido. |
| 5.6 | `/check-list/accidents/masa-laboral` | `MasaLaboralComponent` | Grid form 380px + tabla 1fr. Pills empresa (brand para INARCO). KPIs derivados (TODO: inducciones — modelo no las expone). |
| 5.7 | `/check-list/accidents/workers` | `AccidentWorkersListComponent` | Avatar circular 36×36 navy + iniciales amarillas. KPIs: total / activos / inactivos / edad promedio. Tabs detalle deuda. |
| 5.8 | `/check-list/planning` | `ActivityPlanningComponent` + `PlanificationGridComponent` | Toggle Diario/Semanal. Vista semanal con 5 buckets con conteo X/Y + % en color semántico. Sidebar cumplimiento global + por ámbito con progress bars. |

**Otras pantallas con page header aplicado:**

| Ruta | Componente |
|---|---|
| `/check-list/dashboard` | `CheckListDashboardComponent` |
| `/check-list/reports/add` | `AddReportsComponent` + `ReportsTableComponent` (paginador fixed) |
| `/check-list/reports/sstma-inspection` | `SstmaInspectionComponent` (paginador fixed) |
| `/check-list/reports/incident-report` | `IncidentReportComponent` |
| `/check-list/reports/inspection-tracking` | `InspectionTrackingComponent` |
| `/check-list/custom-program/library` | `LibraryPpComponent` |
| `/check-list/custom-program/replicate` | `ReplicatePpComponent` |
| `/check-list/custom-program/activities` | `AddActivitiesPpComponent` (HTML refactor, TS intacto 1711 líneas) |
| `/check-list/maintenance/work` | `WorkMaintenanceComponent` |
| `/check-list/maintenance/params` | `CreateParamsComponent` |
| `/check-list/maintenance/custom-params` | `AddCustomParamsComponent` + 4 sub-tabs |
| `/check-list/maintenance/workflow-oc` | `WorkflowOcComponent` |
| `/check-list/administration/organizational-map` | `OrganizationalMapComponent` |
| `/check-list/administration/password-change` | `ChangePasswordsComponent` |
| `/check-list/administration/accesses` | `CheckListAccessComponent` |
| `/check-list/accidents/workers/new` y `/edit/:id` | `AccidentWorkerFormComponent` |
| `/check-list/obras/:id` | `ObraProfileComponent` (NUEVA) |

### Nueva pantalla: Obra Profile

`/check-list/obras/:id` (lazy-loaded chunk 38 kB):
- Resuelve obra desde `ObraService.getObras()` por id
- Hero navy con días sin accidente (calculado desde max FechaAccidente)
- 4 KPIs: total accidentes / trabajadores / días perdidos / reportes último mes
- Bar chart de accidentes por mes (6 meses, SVG-less)
- Breakdown de partes del cuerpo afectadas con barras amarillas
- Sidebar con últimos 5 accidentes (con pills de gravedad) y top 5 trabajadores activos (con avatar)
- El selector de obra del topbar navega aquí
- `ngOnInit` empuja a `ProjectSelectionService` para hidratar el chip del navbar

---

## 6 · Convenciones de botones

| Acción | Variant | Color | Cuándo |
|---|---|---|---|
| Consultar / Buscar / Filtrar | `primary` | navy | Lectura, no escritura |
| Guardar / Crear / Generar / Nuevo | `accent` | amarillo | CTA principal de escritura |
| Exportar / Actualizar | `secondary` | blanco + borde | Acción secundaria |
| Limpiar / Cancelar / Volver | `ghost` | transparente | Acción terciaria |
| Eliminar / Anular | `danger` | rojo | Destructiva |

**Bridge para mat-button legacy:** mientras todo no migra a `<app-btn>`, una
regla global mapea `mat-raised/flat/unelevated-button` con `color="primary|accent|warn"`
a los tokens DS. Aparenta consistente aunque sea Material por dentro.

---

## 7 · Iconos edit/delete (`.row-action`)

Patrón unificado para acciones por fila (vive global en `styles.scss`):

```html
<button type="button" class="row-action" matTooltip="Editar"
        (click)="..." aria-label="Editar">
  <span class="ms-r" aria-hidden="true">edit</span>
</button>
<button type="button" class="row-action row-action--danger" matTooltip="Eliminar"
        (click)="..." aria-label="Eliminar">
  <span class="ms-r" aria-hidden="true">delete</span>
</button>
```

30×30 con borde slate-200, hover navy, variante `--danger` para destructivos.

---

## 8 · Inputs (`.field` wrapper)

Patrón estándar:

```html
<div class="field">
  <label class="field__label">Nombre del campo *</label>
  <mat-form-field appearance="outline" class="field__control">
    <input matInput formControlName="x" />
    <mat-error *ngIf="...">Requerido</mat-error>
  </mat-form-field>
</div>
```

Override global en `styles.scss` para `.field .mat-mdc-form-field`:
- Altura 40px consistente (`.mat-mdc-form-field-infix`)
- Label flotante oculta (usamos `.field__label` externa)
- Notch del outline cerrado (sin gap superior)
- Padding inferior reducido (sin reserva para hints)

Pattern para fila de filtros: `.filter-chip > .filter-chip__field` (igual normalización).

---

## 9 · Paginadores · cómo no romperlos

**Anti-patrón detectado en `reports-table` y `sstma-inspection`:**

```typescript
// ❌ MAL — recrear MatTableDataSource pierde el wiring del paginator
this.dataSource = new MatTableDataSource<X>(data);
```

```typescript
// ✓ BIEN — reusar la instancia
this.dataSource.data = data;
if (this.paginator) this.paginator.firstPage();
```

Patrón correcto en `ngAfterViewInit()`:

```typescript
this.dataSource.paginator = this.paginator;
this.dataSource.sort = this.sort;
```

Y un helper `syncDataSource()` que se llama tras cada actualización del array
de datos (apply filter, load success, load error, reset).

---

## 10 · Servicios introducidos / usados

| Servicio | Path | Función |
|---|---|---|
| `ThemeService` | `core/services/theme.service.ts` | Light/dark toggle, persistencia |
| `ProjectSelectionService` | `domains/check-list/services/project-selection.service.ts` | BehaviorSubject de obra activa global |
| `ExportService` | `shared/services/export.service.ts` | Excel export (consumido por history-report, sstma-obra, accidents-list, masa-laboral, reports-table) |

---

## 11 · Deuda conocida

### Funcional

- **Auto-save de Ingreso Accidente** persiste en `localStorage` (key `accidents:autosave:draft`). Borrador no se limpia automáticamente tras submit exitoso — `clearDraft()` existe, falta cablearlo al subscribe del create exitoso.
- **KPIs obra placeholder** en Ingreso Accidente (`Días sin acc / Trabajadores / Acc YTD / Cumplimiento`) — sin endpoint backend dedicado, valores `—`. `// TODO` en `accidents.component.ts`.
- **KPIs de Reporte Histórico** son placeholder `'—'` por la misma razón.
- **Inducciones / EPP / accidentes asociados a trabajador** — el modelo `TrabajadorDto` no expone esos campos. Pantalla de detalle con tabs (DS §5.7 lo pide) queda diferida hasta que backend amplíe el modelo.
- **Masa Laboral · inducciones vencidas / próximas a vencer** — el modelo `MasaLaboral` solo guarda `Periodo + TipoEmpresa + CantidadTrabajadores`. KPI muestra delta "sin datos".
- **ExportSelectorComponent (carrito sidebar) en history-report** preservado intacto pero no cableado al UI nuevo (sin trigger visible). Por ahora export Excel directo desde preview. Decidir si se elimina o reactiva con un trigger.

### Visual / técnica

- **`add-activities-pp.component.ts`** (1711 líneas) — TS intacto por riesgo de
  regresión. Solo HTML y SCSS migrados.
- **Sub-componentes de `history-metrics`** (`summary-kpi`, `dynamic-chart`,
  `metrics-filter`, `metrics-data`) — solo retematizamos SCSS a tokens. La
  lógica de Chart.js y los hardcodes de paleta dentro del componente siguen.
- **`history-table` con `ViewEncapsulation.None`** — sus selectores SCSS están
  prefijados con `app-history-table` para no contaminar `<app-datatable>`
  global. Importante mantener el prefijo en futuros cambios.
- **Iconos edit/delete en modales legacy** (incident-report-modal,
  art-modal, inspection-modal) — siguen siendo `mat-icon-button`. El override
  global de mat-button bridge los hace ver pasables pero no son `<app-btn>`.

### Cableo obra global

El servicio `ProjectSelectionService` se popula cuando el usuario selecciona
desde el navbar (que navega a `/obras/:id`). Solo `activity-planning` lo
empuja **saliente** cuando el usuario cambia el proyecto en pantalla. Las
suscripciones **entrantes** (pre-rellenar filtros locales en sstma-obra,
accidents-list, activity-planning) **se removieron** por confundir al usuario.
Si más adelante se quiere reactivar sync entrante, vivirá en cada pantalla
suscribiéndose a `selectedProjectId$`.

---

## 12 · Cómo personalizar la apariencia (futuro)

### Cambiar la paleta sin tocar componentes

Definir un wrapper class y sobrescribir los tokens semánticos:

```scss
body.theme-corporate-blue {
  --ink: #003D7A;
  --yellow: #2DD4BF;            // teal
  --btn-accent-bg: #2DD4BF;
  --btn-accent-fg: #fff;
  --pill-neutral-bg: #DBEAFE;
}
```

Activar desde un servicio (`document.body.classList.add('theme-corporate-blue')`).
Todos los `<app-btn>`, `<app-pill>`, `<app-kpi-tile>` cambian sin re-build.

### Cambiar tipografías

Sobrescribir `--font-display`, `--font-text`, `--font-mono`:

```scss
body.theme-modern {
  --font-display: 'Inter', sans-serif;
  --font-text: 'Inter', sans-serif;
}
```

### Cambiar tamaños de UI

Los tokens `--text-*` y `--space-*` son la API. Cambiando estos se reescala
toda la UI proporcionalmente.

---

## 13 · Comandos útiles

```bash
# Build de verificación
npx ng build --configuration development

# Dev server (no usado en este rediseño, el usuario verifica visualmente aparte)
npx ng serve
```

**Nota operativa:** los builds en background con `| tail -N` enmascaran el
exit code (el pipe devuelve el código de `tail`, siempre 0). Para verificar
builds críticos correr sin pipe o revisar el output completo.

---

## 14 · Estado del rediseño

| Fase | Estado |
|---|---|
| Fundación (tokens / fuentes / Material Symbols Rounded) | ✓ |
| shared/ui (Btn / Pill / KpiTile / Spinner) | ✓ |
| §3.1 Sidebar | ✓ |
| §3.2 Topbar (con obra selector mat-menu + user menu enriquecido) | ✓ |
| §5.1 Reporte Histórico (con export Excel real) | ✓ |
| §5.2 Reporte SSTMA Obra | ✓ |
| §5.3 Ingreso Accidente (wizard) | ✓ |
| §5.4 Listado Accidentes | ✓ |
| §5.5 Estadísticas | ✓ |
| §5.6 Masa Laboral | ✓ (sin inducciones — modelo) |
| §5.7 Trabajadores | ✓ (sin tabs detalle — modelo) |
| §5.8 Plan/Programa Personalizado (4 pantallas + toggle semanal + sidebar cumplimiento) | ✓ |
| Page header en 10+ pantallas auxiliares (dashboard, admin, mantenedor, reports faltantes) | ✓ |
| Obra Profile (nueva) | ✓ |
| Theme system (light/dark + toggle en menú usuario) | ✓ |
| Botones unificados (5 variantes + mat-button bridge) | ✓ |
| Row actions unificados (30×30) | ✓ |
| Tokens semánticos para personalización futura | ✓ |
| Paginadores auditados (reports-table, sstma-inspection bugs fixed) | ✓ |

---

**Mantenido por:** rama `feature/new-design` · trabajos posteriores deben
actualizar este log o crear su propia bitácora.

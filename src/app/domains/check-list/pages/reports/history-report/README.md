# Documentación del Módulo de Reportes Históricos

## Arquitectura General

El módulo de reportes históricos está estructurado como una aplicación Angular que sigue un patrón de componentes jerárquicos con flujo de datos unidireccional. Su objetivo es permitir a los usuarios consultar, filtrar y visualizar datos históricos a través de diferentes formatos de presentación.

### Estructura de Componentes

```
HistoryReportComponent (componente principal)
├── HistoryTableComponent (visualización en formato tabla)
└── HistoryMetricsComponent (visualización en formato métricas/gráficos)
    ├── MetricsFilterComponent (filtros laterales - columna izquierda 20%)
    └── MetricsDataComponent (visualización de datos - columna derecha 80%)
```

## Flujo de Datos

El flujo de datos en el módulo sigue un patrón de cascada desde el componente padre hacia los componentes hijos:

1. **Origen de los Datos**:
   - El componente `HistoryReportComponent` actúa como contenedor principal
   - Gestiona un formulario para que el usuario seleccione un rango de fechas
   - Realiza la consulta al backend a través de `ReportService.getHistoricalReport()`
   - Almacena los resultados en `tableData: HistoricalReportItem[]`

2. **Distribución de Datos**:
   - Los datos se pasan a los componentes hijos a través de `@Input` properties:
     - A `HistoryTableComponent` para visualización tabular
     - A `HistoryMetricsComponent` para visualización en formato de métricas y gráficos

3. **Procesamiento y Filtrado**:
   - En `HistoryMetricsComponent`:
     - Se mantienen dos conjuntos de datos: `data` (original) y `filteredData` (filtrado)
     - Se reciben eventos de filtrado desde `MetricsFilterComponent`
     - Se aplican los filtros mediante `applyFilters()` que actualiza `filteredData`

4. **Visualización de Métricas**:
   - Los datos filtrados se pasan a `MetricsDataComponent` mediante binding `[data]="filteredData"`
   - `MetricsDataComponent` procesa estos datos para generar:
     - Conteos estadísticos (`totalRegistros`, `registrosPorTipo`, etc.)
     - Visualizaciones gráficas (gráficos de donut para estados y tipos)

## Componentes en Detalle

### HistoryReportComponent

**Responsabilidades**:
- Punto de entrada del módulo
- Gestión del formulario de fechas
- Comunicación con el backend
- Distribución de datos a componentes hijos
- Control de estados de UI (carga, errores, expansión/colapso)

**Características Principales**:
- Implementa `OnInit`
- Utiliza `ReactiveFormsModule` para el formulario
- Maneja localización de fechas para formato español
- Utiliza `MatSnackBar` para notificaciones

### HistoryMetricsComponent

**Responsabilidades**:
- Mediador entre los filtros y la visualización de métricas
- Aplicación de filtros sobre los datos
- Distribución de datos filtrados

**Características Principales**:
- Implementa `OnChanges`
- Gestiona un objeto `activeFilters: {[key: string]: string[]}`
- Optimizaciones para evitar re-renderizados innecesarios (`haveFiltersChanged()`)
- Mapeo de tipos de filtro a campos de datos (`getFieldNameByFilterType()`)

### MetricsDataComponent

**Responsabilidades**:
- Procesamiento de datos para análisis estadístico
- Visualización de métricas en diferentes formatos
- Generación de gráficos interactivos

**Características Principales**:
- Implementa `OnChanges` y `AfterViewInit`
- Utiliza Chart.js a través de `NgChartsModule`
- Genera conteos agrupados por diversas dimensiones:
  - `registrosPorTipo`
  - `registrosPorEstado`
  - `registrosPorObra`
  - `registrosPorUsuario`
- Sistema de colores para visualización (`chartColors`, `getAvatarColor()`)
- Ajuste de visualización adaptativa (horizontal/vertical)

## Sistema de Filtrado

El sistema de filtrado implementa un enfoque adaptativo:

1. `MetricsFilterComponent` genera filtros basados en propiedades de tipo string en los datos
2. Los filtros se comportan diferente según la cantidad de elementos:
   - Autocomplete para listas de >15 elementos
   - Checkboxes para listas de <15 elementos
3. El filtrado es multiselector y se actualiza en tiempo real

### Reglas de Comportamiento de Filtros

#### Visualización Dinámica de Gráficos

1. **Generación dinámica de gráficos**:
   - Cuando un filtro está activo (tiene 1 o más elementos seleccionados), se agrega automáticamente una nueva fila de gráfico correspondiente a los valores seleccionados
   - Por ejemplo, al seleccionar "ver todos" en el filtro de cargo, se genera un gráfico específico para todos los items de ese cargo

2. **Valor principal de medición**:
   - El campo "estado" constituye el valor principal de medición en el sistema
   - Este campo proporciona el KPI de cumplimiento crucial para el análisis de datos

3. **Estados posibles y su significado**:
   - **Cumplida**: Tareas que han sido completadas satisfactoriamente
   - **No cumplida**: Tareas cuyo plazo de cumplimiento ha vencido sin completarse
   - **Pendiente**: Tareas que aún pueden ser cumplidas durante el día actual

4. **Interpretación de estados**:
   - El estado "No cumplida" indica que ya se venció el plazo para completar la tarea
   - Los estados permiten visualizar rápidamente el nivel de cumplimiento general y por filtros aplicados

5. Los filtros se aplican con operador lógico AND entre diferentes tipos
6. Cada tipo de filtro tiene un ícono específico asociado

## Visualización de Datos

El componente `metrics-data` implementa dos modos principales de visualización:

1. **Modo Horizontal** (predeterminado):
   - La lista de métricas se muestra en filas horizontales
   - Utiliza scroll horizontal
   - Adecuado para visualización en pantallas anchas

2. **Modo Vertical**:
   - La lista se reorganiza en columnas verticales
   - Utiliza scroll vertical
   - Optimizado para espacios más estrechos o visualización en dispositivos móviles

### Principios del DynamicChartComponent

El componente `DynamicChartComponent` implementa una visualización dinámica de los datos siguiendo estos principios:

1. **Visualización pura de datos**: Muestra los datos tal como vienen, sin interpretar su significado semántico. No importa si los estados se llaman "cumplida", "terminada", "cancelada" o cualquier otro nombre.

2. **Sin hardcoding de estados**: No asume cuáles estados representan "cumplimiento" o "incumplimiento". No filtra estados buscando palabras clave como "completado" o "finalizado".

3. **Distribución completa**: Muestra la distribución completa de todos los estados presentes en los datos, contando la cantidad de registros para cada estado directamente.

4. **Visualización mediante barras apiladas**: Cada valor filtrado (ej: proyecto, obra, tipo) muestra una barra horizontal compuesta por secciones apiladas, donde cada sección representa un estado diferente.

5. **Diferenciación visual**: Cada estado tiene su propio dataset y color en el gráfico para mostrar claramente su distribución y proporción respecto al total.

Este enfoque hace que el componente sea verdaderamente dinámico, capaz de adaptarse a cualquier estructura de datos sin asumir su significado, permitiendo que la interpretación de los datos quede en manos del usuario final.

## Optimizaciones de Rendimiento

El módulo implementa varias estrategias para optimizar el rendimiento:

1. **Detección inteligente de cambios en filtros**:
   - Evita re-renderizados cuando los filtros no han cambiado realmente
   - Comparación profunda de objetos de filtros (`haveFiltersChanged()`)

2. **Inicialización diferida de gráficos**:
   - Uso de `setTimeout` en `ngAfterViewInit` para garantizar que el DOM esté listo
   - Destrucción y recreación adecuada de gráficos al cambiar datos

3. **Búsqueda case-insensitive**:
   - Implementación de `findFieldCaseInsensitive()` para búsquedas más robustas

4. **Mapeo de campos una única vez**:
   - Creación de mapeo de campos antes del filtro para mejorar rendimiento

## Interacción entre Componentes

La comunicación entre componentes sigue un patrón estándar de Angular:

1. **Entrada de datos**: A través de `@Input()` decorators
2. **Notificación de eventos**: Mediante `@Output()` y `EventEmitter`
3. **Detección de cambios**: Uso de `ngOnChanges` para reaccionar a cambios en inputs

Este patrón asegura un flujo de datos predecible y una arquitectura fácil de mantener y escalar.

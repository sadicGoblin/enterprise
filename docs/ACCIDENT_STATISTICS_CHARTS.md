# Dashboard de Estadísticas de Accidentes - Generación de Gráficos

## Descripción General

El dashboard de estadísticas de accidentes (`accidents-statistics.component`) genera gráficos dinámicos procesando datos directamente desde el listado de accidentes del API. No requiere endpoints especializados de estadísticas, sino que agrupa y procesa los datos en el frontend.

## Arquitectura

### Flujo de Datos

```
API Backend (PHP)
    ↓
listarAccidentes() → Listado completo de accidentes
    ↓
processStatistics() → Agrupación y cálculo de estadísticas
    ↓
initializeCharts() → Creación de gráficos con Chart.js
    ↓
Visualización en el Dashboard
```

## Componentes del Sistema

### 1. Obtención de Datos

**Servicio:** `AccidenteService.listarAccidentes()`

```typescript
this.accidenteService.listarAccidentes(filters).subscribe({
  next: (response: any) => {
    this.accidentesRaw = Array.isArray(response.data) 
      ? response.data 
      : Object.values(response.data);
    this.processStatistics();
    this.initializeCharts();
  }
});
```

**Filtros aplicados:**
- `TipoFecha`: 'creacion' | 'accidente'
- `FechaDesde`: Fecha inicio (formato: YYYY-MM-DD HH:mm:ss)
- `FechaHasta`: Fecha fin (formato: YYYY-MM-DD HH:mm:ss)

### 2. Procesamiento de Estadísticas

**Método:** `processStatistics()`

Este método agrupa los datos crudos en diferentes categorías:

#### a) Por Gravedad (CalificacionPS)
```typescript
const gravedadMap = new Map<string, number>();
this.accidentesRaw.forEach(acc => {
  const gravedad = acc.CalificacionPS || 'Sin especificar';
  gravedadMap.set(gravedad, (gravedadMap.get(gravedad) || 0) + 1);
});
this.porGravedad = Array.from(gravedadMap.entries())
  .map(([Gravedad, Total]) => ({ Gravedad, Total: Total.toString() }));
```

**Valores posibles:** Leve, Menor, Importante, Grave, Fatal

#### b) Por Tipo de Accidente (TipoAccidente)
```typescript
const tipoMap = new Map<string, number>();
this.accidentesRaw.forEach(acc => {
  const tipo = acc.TipoAccidente || 'Sin especificar';
  tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
});
this.porTipo = Array.from(tipoMap.entries())
  .map(([TipoAccidente, Total]) => ({ TipoAccidente, Total: Total.toString() }));
```

**Valores posibles:** TRABAJO, COMÚN, NEP

#### c) Por Riesgo Asociado (RiesgoAsociado)
```typescript
const riesgoMap = new Map<string, number>();
this.accidentesRaw.forEach(acc => {
  const riesgo = acc.RiesgoAsociado;
  if (riesgo) {
    riesgoMap.set(riesgo, (riesgoMap.get(riesgo) || 0) + 1);
  }
});
this.porRiesgo = Array.from(riesgoMap.entries())
  .map(([Riesgo, Total]) => ({ Riesgo, Total: Total.toString() }))
  .sort((a, b) => parseInt(b.Total) - parseInt(a.Total));
```

**Ordenamiento:** De mayor a menor cantidad de accidentes

#### d) Por Parte del Cuerpo (ParteCuerpo)
```typescript
const parteCuerpoMap = new Map<string, number>();
this.accidentesRaw.forEach(acc => {
  const parte = acc.ParteCuerpo;
  if (parte) {
    parteCuerpoMap.set(parte, (parteCuerpoMap.get(parte) || 0) + 1);
  }
});
this.porParteCuerpo = Array.from(parteCuerpoMap.entries())
  .map(([ParteCuerpo, Total]) => ({ ParteCuerpo, Total: Total.toString() }))
  .sort((a, b) => parseInt(b.Total) - parseInt(a.Total));
```

#### e) Por Mes (FechaAccidente)
```typescript
const mesMap = new Map<string, number>();
this.accidentesRaw.forEach(acc => {
  if (acc.FechaAccidente) {
    const fecha = new Date(acc.FechaAccidente);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    mesMap.set(mes, (mesMap.get(mes) || 0) + 1);
  }
});
this.porMes = Array.from(mesMap.entries())
  .map(([Mes, Total]) => ({ Mes, Total: Total.toString() }))
  .sort((a, b) => a.Mes.localeCompare(b.Mes));
```

**Formato:** YYYY-MM (ordenado cronológicamente)

#### f) Por Empresa (NombreEmpresa)
```typescript
const empresaMap = new Map<string, number>();
this.accidentesRaw.forEach(acc => {
  const empresa = acc.NombreEmpresa || 'Sin especificar';
  empresaMap.set(empresa, (empresaMap.get(empresa) || 0) + 1);
});
this.porEmpresa = Array.from(empresaMap.entries())
  .map(([Empresa, Total]) => ({ Empresa, Total: Total.toString() }))
  .sort((a, b) => parseInt(b.Total) - parseInt(a.Total));
```

#### g) Días Perdidos Promedio
```typescript
let totalDias = 0;
let countConDias = 0;
this.accidentesRaw.forEach(acc => {
  const dias = parseInt(acc.DiasPerdidosEstimados || '0', 10);
  if (dias > 0) {
    totalDias += dias;
    countConDias++;
  }
});
this.diasPerdidosPromedio = countConDias > 0 
  ? Math.round(totalDias / countConDias) 
  : 0;
```

## Gráficos Generados

### 1. Distribución por Gravedad (Doughnut Chart)

**Tipo:** Gráfico de dona
**Datos:** `porGravedad`
**Colores:**
- Leve: `#4caf50` (verde)
- Menor: `#8bc34a` (verde claro)
- Importante: `#ff9800` (naranja)
- Grave: `#f44336` (rojo)
- Fatal: `#9c27b0` (morado)

```typescript
createGravedadChart(): void {
  const labels = this.porGravedad.map(g => g.Gravedad);
  const data = this.porGravedad.map(g => parseInt(g.Total, 10));
  const colors = labels.map(l => colorMap[l] || '#607d8b');
  
  this.gravedadChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: { cutout: '60%', ... }
  });
}
```

### 2. Tipo de Accidente (Doughnut Chart)

**Tipo:** Gráfico de dona
**Datos:** `porTipo`
**Colores:** `['#5B9BD5', '#ED7D31', '#70AD47', '#FFC000']`

```typescript
createTipoChart(): void {
  const labels = this.porTipo.map(t => t.TipoAccidente);
  const data = this.porTipo.map(t => parseInt(t.Total, 10));
  
  this.tipoChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: { cutout: '60%', ... }
  });
}
```

### 3. Riesgos Asociados (Horizontal Bar Chart)

**Tipo:** Gráfico de barras horizontal
**Datos:** `porRiesgo` (todos los riesgos, ordenados de mayor a menor)
**Colores:** Generados dinámicamente con `generateColors()`

```typescript
createRiesgoChart(): void {
  const labels = this.porRiesgo.map(r => r.Riesgo);
  const data = this.porRiesgo.map(r => parseInt(r.Total, 10));
  const colors = this.generateColors(this.porRiesgo.length);
  
  this.riesgoChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: { indexAxis: 'y', ... }
  });
}
```

### 4. Tendencia Mensual (Line Chart)

**Tipo:** Gráfico de línea
**Datos:** `porMes`
**Color:** `#f57c00` (naranja)

```typescript
createTendenciaChart(): void {
  const monthLabels = ['Ene', 'Feb', 'Mar', ...];
  const monthData = new Array(12).fill(0);
  
  this.porMes.forEach(m => {
    const [year, month] = m.Mes.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    monthData[monthIndex] = parseInt(m.Total, 10);
  });
  
  this.tendenciaChart = new Chart(ctx, {
    type: 'line',
    data: { labels: monthLabels, datasets: [{ data: monthData }] },
    options: { tension: 0.4, fill: true, ... }
  });
}
```

### 5. Tendencia Mensual por Tipo (Multi-line Chart)

**Tipo:** Gráfico de líneas múltiples
**Datos:** Procesados desde `accidentesRaw` agrupando por mes y tipo
**Colores por tipo:**
- TRABAJO: `#60a5fa` (azul)
- COMÚN: `#f59e0b` (naranja)
- NEP: `#10b981` (verde)

```typescript
createTendenciaTipoChart(): void {
  const tipos = [...new Set(this.accidentesRaw.map(acc => acc.TipoAccidente))];
  const meses = [...obtener meses únicos ordenados];
  
  const datasets = tipos.map(tipo => ({
    label: tipo,
    data: meses.map(mes => contar accidentes por mes y tipo),
    borderColor: colorMap[tipo],
    ...
  }));
  
  this.tendenciaTipoChart = new Chart(ctx, {
    type: 'line',
    data: { labels: meses, datasets },
    options: { interaction: { mode: 'index' }, ... }
  });
}
```

## KPI Cards

### Cards Superiores (Dark Theme)

```html
<div class="kpi-grid">
  <div class="kpi-card total">
    <div class="kpi-header">
      <mat-icon>warning</mat-icon>
      <span class="kpi-title">Total Accidentes</span>
    </div>
    <div class="kpi-value">{{ totalAccidentes }}</div>
  </div>
  <!-- Más KPI cards... -->
</div>
```

**Estilos aplicados:**
- Fondo: `linear-gradient(145deg, #1e2132, #2d3042)`
- Texto: Blanco (`#ffffff`)
- Bordes de color según tipo (naranja, morado, azul, rojo)

## Ciclo de Vida del Componente

### 1. Inicialización
```typescript
ngOnInit(): void {
  this.initializeDateFilters();
  this.loadStats();
}
```

### 2. Carga de Datos
```typescript
loadStats() → listarAccidentes() → processStatistics() → initializeCharts()
```

### 3. Creación de Gráficos
```typescript
initializeCharts(): void {
  // Destruir gráficos existentes
  this.gravedadChart?.destroy();
  this.tipoChart?.destroy();
  // ...
  
  setTimeout(() => {
    this.createGravedadChart();
    this.createTipoChart();
    this.createRiesgoChart();
    this.createTendenciaChart();
    this.createTendenciaTipoChart();
  }, 100);
}
```

### 4. Limpieza
```typescript
ngOnDestroy(): void {
  this.gravedadChart?.destroy();
  this.tipoChart?.destroy();
  this.riesgoChart?.destroy();
  this.tendenciaChart?.destroy();
  this.tendenciaTipoChart?.destroy();
}
```

## Campos del API Utilizados

### Estructura de Accidente (del servicio)
```typescript
{
  IdAccidente: string;
  NumeroAccidente: string;
  FechaAccidente: string;           // → Tendencia mensual
  TipoAccidente: string;             // → Gráfico de tipo, tendencia por tipo
  CalificacionPS: string;            // → Gráfico de gravedad
  RiesgoAsociado: string;            // → Gráfico de riesgos
  ParteCuerpo: string;               // → Grid de partes afectadas
  NombreEmpresa: string;             // → Estadísticas por empresa
  DiasPerdidosEstimados: string;     // → Promedio de días perdidos
  // ... otros campos
}
```

## Ventajas de este Enfoque

1. **No requiere cambios en el backend** - Usa el endpoint existente de listado
2. **Flexible** - Fácil agregar nuevas estadísticas sin modificar el API
3. **Filtros automáticos** - Los filtros de fecha funcionan automáticamente
4. **Procesamiento eficiente** - Usa Map para agrupación O(n)
5. **Mantenible** - Toda la lógica de estadísticas está en un solo lugar

## Debugging

### Console Logs Disponibles
```typescript
console.log('[AccidentsStats] Total accidentes:', this.accidentesRaw.length);
console.log('[AccidentsStats] Procesado - porTipo:', this.porTipo);
console.log('[AccidentsStats] Procesado - porGravedad:', this.porGravedad);
console.log('[AccidentsStats] Procesado - porEmpresa:', this.porEmpresa);
console.log('[AccidentsStats] Creando gráficos...');
```

### Verificación de Datos
1. Abrir DevTools (F12)
2. Ir a pestaña Console
3. Buscar mensajes `[AccidentsStats]`
4. Verificar que los datos procesados sean correctos

## Personalización

### Agregar un Nuevo Gráfico

1. **Agregar ViewChild:**
```typescript
@ViewChild('nuevoChart', { static: false }) nuevoChartRef!: ElementRef<HTMLCanvasElement>;
```

2. **Agregar propiedad del chart:**
```typescript
nuevoChart: Chart | null = null;
```

3. **Procesar datos en `processStatistics()`:**
```typescript
const nuevoMap = new Map<string, number>();
// ... lógica de agrupación
this.porNuevo = Array.from(nuevoMap.entries())...
```

4. **Crear método de gráfico:**
```typescript
createNuevoChart(): void {
  const ctx = this.nuevoChartRef?.nativeElement?.getContext('2d');
  this.nuevoChart = new Chart(ctx, { ... });
}
```

5. **Llamar en `initializeCharts()`:**
```typescript
this.createNuevoChart();
```

6. **Agregar canvas en HTML:**
```html
<canvas #nuevoChart></canvas>
```

## Tecnologías Utilizadas

- **Angular 18+** - Framework frontend
- **Chart.js** - Librería de gráficos
- **TypeScript** - Lenguaje de programación
- **Material Design** - Componentes UI
- **RxJS** - Manejo de observables

## Archivos Relacionados

- `accidents-statistics.component.ts` - Lógica del componente
- `accidents-statistics.component.html` - Template
- `accidents-statistics.component.scss` - Estilos (dark theme)
- `accidente.service.ts` - Servicio de API
- `accident.model.ts` - Modelos de datos

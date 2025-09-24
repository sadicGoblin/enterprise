# Sistema de Exportación Masiva - Componente Genérico

## 📋 Descripción

El sistema de exportación masiva es un conjunto de componentes reutilizables que permite a los usuarios seleccionar múltiples elementos de una página y exportarlos como imágenes PNG de forma individual o combinada.

## 🔧 Componentes Incluidos

### 1. ExportSelectorComponent
Componente principal que maneja la interfaz de selección y exportación.

### 2. ExportableDirective
Directiva para marcar elementos como exportables.

### 3. MassExportService
Servicio que maneja la lógica de exportación masiva.

## 🚀 Uso Básico

### Paso 1: Importar el componente

```typescript
import { ExportSelectorComponent, ExportableItem } from '../../../shared/components/export-selector/export-selector.component';
import { MassExportService } from '../../../shared/services/mass-export.service';
import { ExportableDirective } from '../../../shared/directives/exportable.directive';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [
    // ... otros imports
    ExportSelectorComponent,
    ExportableDirective
  ],
  // ...
})
export class MyComponent {
  exportableItems: ExportableItem[] = [
    { id: 'chart-1', name: 'Gráfico de Ventas', icon: 'bar_chart', type: 'chart' },
    { id: 'summary-1', name: 'Resumen KPI', icon: 'dashboard', type: 'kpi' }
  ];

  constructor(private massExportService: MassExportService) {}

  onExportRequested(selectedIds: string[]) {
    this.massExportService.exportMultipleElements(
      selectedIds, 
      this.exportableItems,
      { fileNamePrefix: 'mi-reporte', includeTimestamp: true }
    );
  }
}
```

### Paso 2: Usar en el template

```html
<!-- Selector de exportación con reordenamiento -->
<app-export-selector
  [exportableItems]="exportableItems"
  (exportRequested)="onExportRequested($event)"
  (orderChange)="onOrderChanged($event)">
</app-export-selector>

<!-- Elementos exportables -->
<div appExportable="chart-1" 
     exportName="Gráfico de Ventas" 
     exportIcon="bar_chart"
     exportType="chart"
     class="exportable-wrapper">
  <app-my-chart></app-my-chart>
</div>

<div appExportable="summary-1" 
     exportName="Resumen KPI" 
     exportIcon="dashboard"
     exportType="kpi"
     class="exportable-wrapper">
  <app-my-summary></app-my-summary>
</div>
```

## 🎯 Ejemplo de Migración desde metrics-data

### Antes (código específico):
```html
<!-- Barra de herramientas personalizada -->
<div class="export-toolbar">
  <div class="export-controls">
    <button (click)="toggleExportMode()">...</button>
    <!-- ... código específico ... -->
  </div>
</div>

<!-- Elementos con overlays personalizados -->
<div class="component-wrapper" [class.export-mode]="exportMode">
  <div class="selection-overlay" (click)="toggleElementSelection('summary-kpi')">
    <!-- ... código específico ... -->
  </div>
  <app-summary-kpi></app-summary-kpi>
</div>
```

### Después (usando componente genérico):
```html
<!-- Selector genérico reutilizable -->
<app-export-selector
  [exportableItems]="exportableItems"
  (exportRequested)="handleExport($event)">
</app-export-selector>

<!-- Elementos marcados con directiva -->
<div appExportable="summary-kpi" 
     exportName="Resumen KPI - Datos Globales" 
     exportIcon="dashboard"
     class="exportable-wrapper">
  <app-summary-kpi></app-summary-kpi>
</div>

<div *ngFor="let chart of dynamicCharts; let i = index"
     appExportable="dynamic-chart-{{i}}" 
     [exportName]="'Gráfico Dinámico - ' + chart.filterType" 
     exportIcon="bar_chart"
     class="exportable-wrapper">
  <app-dynamic-chart [filterType]="chart.filterType"></app-dynamic-chart>
</div>
```

## 🔄 Funcionalidad de Drag & Drop

### Reordenamiento de Elementos

Los usuarios pueden reordenar los elementos seleccionados arrastrando y soltando:

```typescript
// Manejar cambios en el orden
onOrderChanged(newOrder: string[]) {
  console.log('Nuevo orden:', newOrder);
  // El orden se mantiene automáticamente para la exportación
}

// Los elementos se exportarán en el orden especificado
onExportRequested(selectedIds: string[]) {
  // selectedIds ya viene en el orden correcto
  this.massExportService.exportMultipleElements(
    selectedIds, // Orden mantenido
    this.exportableItems,
    { fileNamePrefix: 'reporte-ordenado' }
  );
}
```

### Características del Drag & Drop:
- **Indicador visual de orden**: Cada elemento muestra su posición numérica
- **Handle de arrastre**: Icono `drag_indicator` para facilitar el agarre
- **Animaciones suaves**: Transiciones CSS para mejor UX
- **Preview durante arrastre**: Vista previa del elemento siendo movido
- **Placeholder visual**: Indica dónde se soltará el elemento

## ⚙️ Configuración Avanzada

### Opciones de Exportación
```typescript
const exportOptions = {
  fileNamePrefix: 'reporte-mensual',
  scale: 2,
  backgroundColor: '#ffffff',
  includeTimestamp: true,
  zipFiles: false // Para futuras implementaciones
};

await this.massExportService.exportMultipleElements(
  selectedIds, 
  exportableItems, 
  exportOptions
);
```

### Detección Automática de Elementos
```typescript
// El servicio puede detectar automáticamente elementos exportables
const autoDetectedItems = this.massExportService.getExportableElementsFromDOM('.container');
```

## 🎨 Estilos CSS

Los estilos están incluidos en el componente, pero puedes personalizar:

```scss
// En tu componente padre
.exportable-wrapper {
  // Estilos base para elementos exportables
  position: relative;
  
  &.export-mode {
    // Estilos cuando está en modo exportación
    border: 2px solid transparent;
    
    &:hover {
      border-color: #007bff;
    }
  }
}
```

## 🔄 Beneficios del Sistema Genérico

1. **Reutilizable**: Funciona en cualquier componente
2. **Consistente**: UI uniforme en toda la aplicación
3. **Mantenible**: Un solo lugar para actualizar la funcionalidad
4. **Extensible**: Fácil agregar nuevas funciones de exportación
5. **Tipado**: TypeScript completo para mejor desarrollo

## 📝 Notas de Implementación

- Los elementos deben tener IDs únicos o usar `data-export-id`
- El servicio MassExportService usa el ExportService existente
- Compatible con el sistema de exportación PNG actual
- Preparado para futuras extensiones (ZIP, PDF, etc.)

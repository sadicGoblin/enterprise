# ExportService - Servicio de Exportación Genérico

## Descripción
El `ExportService` es un servicio reutilizable que permite exportar contenido HTML a diferentes formatos:
- **Excel (.xlsx)** - Para datos tabulares
- **PNG (.png)** - Para capturas de elementos HTML

## Ubicación
`src/app/shared/services/export.service.ts`

## Configuración
El servicio está configurado como `providedIn: 'root'`, por lo que está disponible en toda la aplicación sin necesidad de importarlo en módulos.

## Uso para Exportación PNG

### 1. Inyectar el servicio en el componente:

```typescript
import { ExportService } from '../../shared/services/export.service';

@Component({
  // ... configuración del componente
})
export class MiComponente {
  constructor(private exportService: ExportService) {}
}
```

### 2. Exportar un elemento específico:

```typescript
// Opción A: Usando ViewChild (recomendado)
@ViewChild('miElemento', { static: false }) miElemento!: ElementRef;

async exportarElemento(): Promise<void> {
  const element = this.miElemento?.nativeElement;
  if (element) {
    await this.exportService.exportElementToPNG(element, {
      fileName: 'Mi_Grafico',
      scale: 2,
      backgroundColor: '#ffffff'
    });
  }
}

// Opción B: Usando selector CSS
async exportarPorSelector(): Promise<void> {
  await this.exportService.exportElementBySelectorToPNG('#mi-grafico', {
    fileName: 'Mi_Grafico',
    scale: 2
  });
}
```

### 3. Template HTML:

```html
<!-- Agregar referencia al elemento -->
<div #miElemento class="contenedor-exportable">
  <!-- Contenido a exportar -->
  <h2>Mi Gráfico</h2>
  <canvas></canvas>
  <table>...</table>
</div>

<!-- Botón para exportar -->
<button (click)="exportarElemento()" mat-icon-button>
  <mat-icon>download</mat-icon>
</button>
```

## Opciones de Configuración PNG

```typescript
interface PngExportOptions {
  fileName?: string;          // Nombre del archivo (sin extensión)
  scale?: number;             // Factor de escala (1-4, default: 2)
  backgroundColor?: string;   // Color de fondo (default: '#ffffff')
  useCORS?: boolean;         // Permitir recursos externos (default: true)
  allowTaint?: boolean;      // Permitir contenido tainted (default: true)
  width?: number;            // Ancho personalizado
  height?: number;           // Alto personalizado
}
```

## Ejemplos de Uso

### Exportar gráfico con alta calidad:
```typescript
await this.exportService.exportElementToPNG(element, {
  fileName: 'Reporte_Ventas',
  scale: 3,
  backgroundColor: '#f5f5f5'
});
```

### Exportar con dimensiones específicas:
```typescript
await this.exportService.exportElementToPNG(element, {
  fileName: 'Dashboard',
  width: 1200,
  height: 800,
  scale: 1
});
```

## Ventajas del Servicio

1. **Reutilizable**: Un solo servicio para toda la aplicación
2. **Configurable**: Múltiples opciones de personalización
3. **Automático**: Genera nombres de archivo con fecha
4. **Robusto**: Manejo de errores y validaciones
5. **Performante**: Optimizado para diferentes tipos de contenido
6. **Consistente**: API uniforme para todos los componentes

## Migración desde Código Inline

### Antes (código duplicado en cada componente):
```typescript
async exportToPNG(): Promise<void> {
  const canvas = await html2canvas(element, { /* opciones */ });
  const link = document.createElement('a');
  // ... lógica de descarga manual
}
```

### Después (usando el servicio):
```typescript
async exportToPNG(): Promise<void> {
  await this.exportService.exportElementToPNG(element, {
    fileName: 'Mi_Export'
  });
}
```

## Notas Importantes

- El servicio usa `html2canvas` internamente
- Los archivos se descargan automáticamente con fecha
- Compatible con componentes standalone
- Maneja errores automáticamente
- Optimizado para gráficos Chart.js y contenido HTML complejo

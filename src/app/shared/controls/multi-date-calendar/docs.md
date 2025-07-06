# Documentación del Componente Multi-Date Calendar

## Descripción

El componente Multi-Date Calendar es un conjunto de componentes Angular que permite la selección múltiple de fechas en un calendario. Está diseñado para ser reutilizable, flexible y fácil de integrar en diferentes partes de la aplicación.

## Estructura de Componentes

El sistema de calendario multi-fecha está compuesto por tres componentes principales:

1. **MultiDateCalendarComponent**: El componente base que muestra el calendario y maneja la lógica de selección de fechas.
2. **CalendarDialogComponent**: Un componente de diálogo que contiene el calendario y proporciona botones de acción.
3. **CalendarSelectComponent**: Un componente de botón con badge que abre el diálogo de calendario y emite las fechas seleccionadas.

```
multi-date-calendar/
│
├── multi-date-calendar.component.ts    # Componente base del calendario
├── multi-date-calendar.component.html  # Plantilla del calendario
├── multi-date-calendar.component.scss  # Estilos del calendario
├── calendar-dialog.component.ts        # Componente de diálogo
├── calendar-select.component.ts        # Componente de botón con badge
└── docs.md                             # Esta documentación
```

## API de los Componentes

### MultiDateCalendarComponent

Este es el componente base que implementa la funcionalidad del calendario multi-fecha.

#### Entradas (Inputs)

| Input | Tipo | Descripción | Valor por defecto |
|-------|------|-------------|-------------------|
| selectedDates | Date[] | Fechas ya seleccionadas en el calendario | [] |
| minDate | Date \| undefined | Fecha mínima seleccionable | undefined |
| maxDate | Date \| undefined | Fecha máxima seleccionable | undefined |
| defaultDates | number[] | Días predeterminados (1-31) para preseleccionar en el mes actual | [] |

#### Salidas (Outputs)

| Output | Tipo | Descripción |
|--------|------|-------------|
| datesChange | EventEmitter<Date[]> | Emite el array de fechas cuando cambia la selección |

#### Funcionalidades Clave

- Selección individual de fechas con clic
- Selección múltiple por arrastre (drag)
- Navegación entre meses
- Visualización de fechas actuales y seleccionadas
- Soporte para localización (días de la semana, nombres de meses)

### CalendarDialogComponent

Componente de diálogo que encapsula el MultiDateCalendarComponent para su uso en ventanas modales.

#### Interfaz CalendarDialogData

```typescript
export interface CalendarDialogData {
  selectedDates: Date[];          // Fechas ya seleccionadas
  defaultDays?: number[];         // Días predeterminados (1-31)
  rowData: any;                   // Datos adicionales (de la fila en caso de tablas)
  controlId: number;              // ID del control (útil para actualizaciones)
}
```

El diálogo se cierra emitiendo el array de fechas seleccionadas o `undefined` si se canceló.

### CalendarSelectComponent

Este componente proporciona un botón con icono y badge para abrir el diálogo de calendario.

#### Entradas (Inputs)

| Input | Tipo | Descripción | Valor por defecto |
|-------|------|-------------|-------------------|
| selectedDates | Date[] | Fechas ya seleccionadas | [] |
| defaultDays | number[] | Días predeterminados (1-31) | [] |
| rowData | any | Datos adicionales relacionados | null |
| controlId | number | ID del control para actualización | 0 |
| icon | string | Nombre del icono Material a mostrar | 'calendar_month' |
| tooltip | string | Texto del tooltip para el botón | 'Seleccionar fechas' |

#### Salidas (Outputs)

| Output | Tipo | Descripción |
|--------|------|-------------|
| datesSelected | EventEmitter<Date[]> | Emite las fechas seleccionadas cuando se guarda el diálogo |

## Ejemplos de Uso

### 1. Uso Básico del Calendario

```typescript
import { Component } from '@angular/core';
import { MultiDateCalendarComponent } from 'path/to/multi-date-calendar.component';

@Component({
  selector: 'app-example',
  template: `
    <app-multi-date-calendar
      [selectedDates]="mySelectedDates"
      (datesChange)="onDatesChange($event)">
    </app-multi-date-calendar>
  `,
  standalone: true,
  imports: [MultiDateCalendarComponent]
})
export class ExampleComponent {
  mySelectedDates: Date[] = [];

  onDatesChange(dates: Date[]): void {
    this.mySelectedDates = dates;
    console.log('Fechas seleccionadas:', dates);
  }
}
```

### 2. Uso del Botón de Calendario con Badge

```typescript
import { Component } from '@angular/core';
import { CalendarSelectComponent } from 'path/to/calendar-select.component';

@Component({
  selector: 'app-example',
  template: `
    <app-calendar-select
      [selectedDates]="mySelectedDates"
      [tooltip]="'Seleccionar días del mes'"
      (datesSelected)="onDatesSelected($event)">
    </app-calendar-select>
  `,
  standalone: true,
  imports: [CalendarSelectComponent]
})
export class ExampleComponent {
  mySelectedDates: Date[] = [];

  onDatesSelected(dates: Date[]): void {
    this.mySelectedDates = dates;
    // Hacer algo con las fechas...
  }
}
```

### 3. Integración en una Tabla (como en Activities)

```html
<ng-container matColumnDef="days">
  <th mat-header-cell *matHeaderCellDef>Días</th>
  <td mat-cell *matCellDef="let element">
    <app-calendar-select
      [selectedDates]="element.selectedDays || []"
      [rowData]="element"
      [controlId]="element.id"
      [tooltip]="'Seleccionar días para ' + element.name"
      (datesSelected)="onCalendarDatesSelected($event, element)">
    </app-calendar-select>
  </td>
</ng-container>
```

```typescript
onCalendarDatesSelected(dates: Date[], element: any): void {
  // Actualizar el elemento con las nuevas fechas
  const control = this.tableData.find(item => item.id === element.id);
  if (control) {
    control.selectedDays = dates;
    
    // Convertir fechas a string en formato requerido (ej: "1,2,15,30")
    const daysString = dates
      .map(date => date.getDate())
      .sort((a, b) => a - b)
      .join(',');
    
    control.days = daysString;
    
    // Opcional: Persistir cambios
    this.updateControlDays(control.id, daysString);
  }
}
```

## Personalización

### Estilos

Los estilos se pueden personalizar de varias maneras:

1. **Modificación Directa**: Los componentes utilizan encapsulación ViewEncapsulation.None, lo que permite sobrescribir estilos desde componentes padres.

2. **Variables CSS**: Si se implementan variables CSS, se podrían ajustar colores y dimensiones definiendo estas variables en el componente padre.

3. **Inputs Adicionales**: Se podrían añadir inputs como `themeColor` o `size` para permitir una personalización más flexible.

### Localización

El componente está preconfigurado para español, pero puede adaptarse a otros idiomas modificando:

1. Los arrays `weekDays` y `monthNames` en MultiDateCalendarComponent
2. Usando DateAdapter para la localización completa de Angular Material

## Buenas Prácticas

1. **Inicialización Adecuada**: Siempre proporcionar un array vacío si no hay fechas preseleccionadas.

2. **Manejo de Eventos**: Suscribirse al evento `datesSelected` para actuar cuando el usuario selecciona nuevas fechas.

3. **Conversión de Formatos**: Convertir entre objetos Date y formatos string según sea necesario para tu backend.

4. **Rendimiento**: Para tablas grandes, considera implementar `trackBy` para evitar re-renderizados innecesarios.

## Implementaciones Comunes

### 1. Como Campo de Formulario

```typescript
// En tu formulario reactivo
this.form = this.fb.group({
  selectedDates: [[], Validators.required]
});

// En tu template
<app-calendar-select
  [selectedDates]="form.get('selectedDates').value"
  (datesSelected)="form.get('selectedDates').setValue($event)">
</app-calendar-select>
```

### 2. Como Filtro de Fecha

```typescript
// En un componente de filtro
<app-calendar-select
  [selectedDates]="filterDates"
  (datesSelected)="onFilterDatesChanged($event)">
</app-calendar-select>

// Método en el componente
onFilterDatesChanged(dates: Date[]): void {
  this.filterDates = dates;
  this.applyFilters();
}
```

### 3. Como Selector de Días de Ejecución

Como se implementó en el componente de actividades, permite seleccionar días específicos del mes para la ejecución de tareas recurrentes.

## Consideraciones Adicionales

- El calendario está optimizado para selección de días dentro del mes actual, pero puede adaptarse para rangos más amplios.
- Para formularios complejos, considera implementar ControlValueAccessor para integrarlo mejor con ReactiveFormModule.
- Para mejor accesibilidad, se podrían añadir atributos ARIA adicionales.

## Contribuciones y Mejoras Futuras

Algunas mejoras potenciales incluyen:

1. Añadir soporte para rangos de fechas (fecha inicio - fecha fin)
2. Mejorar la navegación para fechas lejanas
3. Añadir soporte para temas personalizables
4. Implementar ControlValueAccessor para mejor integración con formularios
5. Añadir tests unitarios completos

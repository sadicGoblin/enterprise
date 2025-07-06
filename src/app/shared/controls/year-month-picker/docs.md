# Year Month Picker

Un componente Angular moderno y personalizado para seleccionar año y mes, devolviendo un valor en formato YYYYMM.

## Características

- Compatible con Angular Reactive Forms
- Diseño moderno con Material Design
- Devuelve un valor numérico en formato YYYYMM (ej: 202507)
- Funciona con formularios tanto template-driven como reactivos
- Totalmente personalizable con inputs

## Instalación

El componente es standalone y no requiere instalación adicional aparte de las dependencias de Angular Material.

## Uso

```typescript
// En tu componente
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-my-form',
  template: `
    <form [formGroup]="form">
      <app-year-month-picker 
        formControlName="period"
        label="Periodo"
        [required]="true"
      ></app-year-month-picker>
      
      <button type="submit" [disabled]="form.invalid">Guardar</button>
    </form>
    
    <p>Valor seleccionado: {{ form.get('period').value }}</p>
  `
})
export class MyFormComponent {
  form: FormGroup;
  
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      period: [202507, Validators.required]
    });
  }
}
```

## Inputs/Outputs

| Nombre        | Tipo                   | Descripción                                | Valor por defecto                 |
|---------------|------------------------|--------------------------------------------|---------------------------------|
| label         | string                 | Etiqueta del campo                        | 'Periodo'                       |
| placeholder   | string                 | Placeholder cuando no hay selección        | 'Seleccione un periodo'         |
| minYear       | number                 | Año mínimo disponible                      | año actual - 5                  |
| maxYear       | number                 | Año máximo disponible                      | año actual + 5                  |
| required      | boolean                | Si el campo es requerido                   | false                           |
| appearance    | 'fill' \| 'outline'    | Apariencia del campo (Material)            | 'outline'                       |
| disabled      | boolean                | Si el campo está deshabilitado             | false                           |

## Valor devuelto

El componente devuelve un valor numérico en formato YYYYMM, por ejemplo:
- Enero 2025 = 202501
- Julio 2025 = 202507
- Diciembre 2025 = 202512

Este formato es útil para operaciones de base de datos y para ordenar periodos cronológicamente.

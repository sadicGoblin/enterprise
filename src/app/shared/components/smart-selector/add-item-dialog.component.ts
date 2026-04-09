import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AddItemDialogData {
  title: string;
  fieldLabel: string;
  fieldPlaceholder?: string;
  extraFields?: { name: string; label: string; required?: boolean; type?: string; placeholder?: string }[];
  initialValues?: Record<string, any>;
  /** Nombres de controles en solo lectura: 'nombre' o nombres de extraFields (ej. 'RUT') */
  readonlyFieldNames?: string[];
}

export interface AddItemDialogResult {
  nombre: string;
  [key: string]: any;
}

@Component({
  selector: 'app-add-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="dialog-icon">add_circle</mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ data.fieldLabel }}</mat-label>
          <input matInput formControlName="nombre"
            [readonly]="isReadonly('nombre')"
            [placeholder]="data.fieldPlaceholder || 'Ingrese nombre...'"
            cdkFocusInitial>
          <mat-error *ngIf="form.get('nombre')?.hasError('required')">Campo requerido</mat-error>
          <mat-error *ngIf="form.get('nombre')?.hasError('minlength')">Mínimo 2 caracteres</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width"
          *ngFor="let field of data.extraFields">
          <mat-label>{{ field.label }}</mat-label>
          <input matInput [formControlName]="field.name" [type]="field.type || 'text'" [placeholder]="field.placeholder || ''"
            [readonly]="isReadonly(field.name)">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary"
        [disabled]="form.invalid"
        (click)="onSave()">
        <mat-icon>save</mat-icon>
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-icon {
      vertical-align: middle;
      margin-right: 8px;
      color: #388e3c;
    }
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 350px;
      padding-top: 8px;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class AddItemDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddItemDialogData
  ) {
    const controls: any = {
      nombre: ['', [Validators.required, Validators.minLength(2)]]
    };

    if (data.extraFields) {
      for (const field of data.extraFields) {
        controls[field.name] = ['', field.required ? Validators.required : []];
      }
    }

    this.form = this.fb.group(controls);

    if (data.initialValues) {
      this.form.patchValue(data.initialValues, { emitEvent: false });
    }
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  isReadonly(controlName: string): boolean {
    return (this.data.readonlyFieldNames || []).includes(controlName);
  }
}

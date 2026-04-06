import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MasaLaboralService } from '../../../services/masa-laboral.service';
import { MasaLaboral, MasaLaboralMapper, MasaLaboralApiResponse } from '../models/masa-laboral.model';

interface TipoEmpresa {
  value: string;
  label: string;
  descripcion: string;
}

@Component({
  selector: 'app-masa-laboral',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './masa-laboral.component.html',
  styleUrl: './masa-laboral.component.scss'
})
export class MasaLaboralComponent implements OnInit {
  displayedColumns: string[] = ['periodo', 'empresa', 'cantidad', 'observaciones', 'acciones'];
  dataSource: MasaLaboral[] = [];
  filteredData: MasaLaboral[] = [];
  
  masaLaboralForm: FormGroup;
  isLoading = false;
  isEditing = false;
  editingId: number | null = null;
  
  // Tipos de empresa fijos
  tiposEmpresa: TipoEmpresa[] = [
    { value: 'INARCO', label: 'INARCO', descripcion: 'Empresa Inarco' },
    { value: 'SUBCONTRATO', label: 'SUBCONTRATO', descripcion: 'Empresas Subcontratistas' }
  ];
  anios: number[] = [];
  meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  // Filtros
  filtroAnio: number | null = null;
  filtroTipoEmpresa: string | null = null;

  constructor(
    private fb: FormBuilder,
    private masaLaboralService: MasaLaboralService,
    private snackBar: MatSnackBar
  ) {
    this.masaLaboralForm = this.fb.group({
      tipoEmpresa: [null, Validators.required],
      anio: [new Date().getFullYear(), Validators.required],
      mes: [new Date().getMonth() + 1, Validators.required],
      cantidadTrabajadores: [0, [Validators.required, Validators.min(0)]],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.initializeAnios();
    this.loadMasaLaboral();
  }

  initializeAnios(): void {
    const currentYear = new Date().getFullYear();
    this.anios = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    this.filtroAnio = currentYear;
  }


  loadMasaLaboral(): void {
    this.isLoading = true;
    const filters: any = {};
    
    if (this.filtroAnio) {
      filters.Anio = this.filtroAnio;
    }
    if (this.filtroTipoEmpresa) {
      filters.TipoEmpresa = this.filtroTipoEmpresa;
    }

    this.masaLaboralService.listar(filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dataSource = MasaLaboralMapper.toViewModelArray(response.data);
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar masa laboral:', error);
        this.showMessage('Error al cargar los datos', 'error');
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredData = this.dataSource.filter(item => {
      const matchAnio = !this.filtroAnio || item.anio === this.filtroAnio;
      const matchTipoEmpresa = !this.filtroTipoEmpresa || item.tipoEmpresa === this.filtroTipoEmpresa;
      return matchAnio && matchTipoEmpresa;
    });
  }

  onFilterChange(): void {
    this.loadMasaLaboral();
  }

  onSubmit(): void {
    if (this.masaLaboralForm.invalid) {
      this.showMessage('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    const formValue = this.masaLaboralForm.value;
    const periodo = `${formValue.anio}-${String(formValue.mes).padStart(2, '0')}`;

    if (this.isEditing && this.editingId) {
      this.updateMasaLaboral(periodo);
    } else {
      this.createMasaLaboral(periodo);
    }
  }

  createMasaLaboral(periodo: string): void {
    const formValue = this.masaLaboralForm.value;
    
    this.isLoading = true;
    this.masaLaboralService.crear({
      TipoEmpresa: formValue.tipoEmpresa,
      Periodo: periodo,
      CantidadTrabajadores: formValue.cantidadTrabajadores,
      Observaciones: formValue.observaciones || null,
      created_by: 1 // TODO: Obtener del usuario actual
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Registro creado exitosamente', 'success');
          this.resetForm();
          this.loadMasaLaboral();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al crear:', error);
        this.showMessage(error.error?.message || 'Error al crear el registro', 'error');
        this.isLoading = false;
      }
    });
  }

  updateMasaLaboral(periodo: string): void {
    if (!this.editingId) return;

    const formValue = this.masaLaboralForm.value;
    
    this.isLoading = true;
    this.masaLaboralService.actualizar({
      IdMasaLaboral: this.editingId,
      TipoEmpresa: formValue.tipoEmpresa,
      Periodo: periodo,
      CantidadTrabajadores: formValue.cantidadTrabajadores,
      Observaciones: formValue.observaciones || null,
      updated_by: 1 // TODO: Obtener del usuario actual
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Registro actualizado exitosamente', 'success');
          this.resetForm();
          this.loadMasaLaboral();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al actualizar:', error);
        this.showMessage(error.error?.message || 'Error al actualizar el registro', 'error');
        this.isLoading = false;
      }
    });
  }

  editRow(row: MasaLaboral): void {
    this.isEditing = true;
    this.editingId = row.idMasaLaboral;
    
    this.masaLaboralForm.patchValue({
      tipoEmpresa: row.tipoEmpresa,
      anio: row.anio,
      mes: row.mes,
      cantidadTrabajadores: row.cantidadTrabajadores,
      observaciones: row.observaciones || ''
    });

    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteRow(row: MasaLaboral): void {
    if (!confirm(`¿Está seguro de eliminar el registro de ${row.tipoEmpresa} - ${MasaLaboralMapper.formatPeriodo(row.periodo)}?`)) {
      return;
    }

    this.isLoading = true;
    this.masaLaboralService.eliminar(row.idMasaLaboral).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Registro eliminado exitosamente', 'success');
          this.loadMasaLaboral();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        this.showMessage('Error al eliminar el registro', 'error');
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingId = null;
    this.masaLaboralForm.reset({
      tipoEmpresa: null,
      anio: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      cantidadTrabajadores: 0,
      observaciones: ''
    });
  }

  formatPeriodo(periodo: string): string {
    return MasaLaboralMapper.formatPeriodo(periodo);
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
    });
  }
}

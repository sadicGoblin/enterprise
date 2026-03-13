import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { AccidenteService } from '../../services/accidente.service';
import { SmartSelectorComponent, SmartSelectorOption } from '../../../../shared/components/smart-selector/smart-selector.component';
import { AddItemDialogComponent, AddItemDialogData } from '../../../../shared/components/smart-selector/add-item-dialog.component';
import {
  AccidenteApiResponse,
  CrearAccidenteRequest,
  ActualizarAccidenteRequest,
  CALIFICACION_PS_OPTIONS,
  ESTADO_ACCIDENTE_OPTIONS,
  ESTADO_LABELS
} from './models/accident.model';

@Component({
  selector: 'app-accidents',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    MatDialogModule,
    SmartSelectorComponent
  ],
  templateUrl: './accidents.component.html',
  styleUrl: './accidents.component.scss'
})
export class AccidentsComponent implements OnInit {
  isLoading = false;
  isLoadingDropdowns = true;
  accidentForm!: FormGroup;
  currentStep = 0;

  // Modo edición
  isEditMode = false;
  editId: number | null = null;
  numeroAccidente = '';

  // Opciones estáticas
  calificacionPSOptions = CALIFICACION_PS_OPTIONS;
  estadoOptions = ESTADO_ACCIDENTE_OPTIONS;
  estadoLabels = ESTADO_LABELS;

  // Opciones dinámicas como SmartSelectorOption[]
  obraOpts: SmartSelectorOption[] = [];
  empresaOpts: SmartSelectorOption[] = [];
  trabajadorOpts: SmartSelectorOption[] = [];
  tipoAccidenteOpts: SmartSelectorOption[] = [];
  riesgoOpts: SmartSelectorOption[] = [];
  lesionOpts: SmartSelectorOption[] = [];
  parteCuerpoOpts: SmartSelectorOption[] = [];
  cargoOpts: SmartSelectorOption[] = [];
  maquinaEquipoOpts: SmartSelectorOption[] = [];
  causaRaizOpts: SmartSelectorOption[] = [];
  calificacionPSOpts: SmartSelectorOption[] = [];

  // Mapeo tabla backend por campo de formulario
  private catalogMap: Record<string, { tabla: string; title: string; fieldLabel: string }> = {
    IdObra: { tabla: 'TB_ObrasAccidentes', title: 'Agregar Obra', fieldLabel: 'Nombre Obra' },
    IdEmpresa: { tabla: 'TB_Empresas', title: 'Agregar Empresa', fieldLabel: 'Nombre Empresa' },
    IdTrabajador: { tabla: 'TB_Trabajadores', title: 'Agregar Trabajador', fieldLabel: 'Nombre Trabajador' },
    IdTipoAccidente: { tabla: 'TB_TiposAccidente', title: 'Agregar Tipo Accidente', fieldLabel: 'Nombre Tipo' },
    IdRiesgoAsociado: { tabla: 'TB_RiesgosAsociados', title: 'Agregar Riesgo', fieldLabel: 'Nombre Riesgo' },
    IdLesion: { tabla: 'TB_Lesiones', title: 'Agregar Lesión', fieldLabel: 'Nombre Lesión' },
    IdParteCuerpo: { tabla: 'TB_PartesCuerpo', title: 'Agregar Parte del Cuerpo', fieldLabel: 'Nombre' },
    IdCargo: { tabla: 'TB_Cargos', title: 'Agregar Cargo', fieldLabel: 'Nombre Cargo' },
    IdMaquinaEquipo: { tabla: 'TB_MaquinasEquipos', title: 'Agregar Máquina/Equipo', fieldLabel: 'Nombre' },
    IdCausaRaiz: { tabla: 'TB_CausasRaiz', title: 'Agregar Causa Raíz', fieldLabel: 'Nombre Causa' },
    IdSupervisor: { tabla: 'TB_Trabajadores', title: 'Agregar Supervisor', fieldLabel: 'Nombre' },
    IdPTerreno: { tabla: 'TB_Trabajadores', title: 'Agregar Prof. Terreno', fieldLabel: 'Nombre' },
    IdAPR: { tabla: 'TB_Trabajadores', title: 'Agregar APR', fieldLabel: 'Nombre' },
    IdADO: { tabla: 'TB_Trabajadores', title: 'Agregar ADO', fieldLabel: 'Nombre' },
  };

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private accidenteService: AccidenteService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdowns();

    // Detectar modo edición por ruta /edit/:id
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.editId = parseInt(idParam, 10);
      this.loadAccidentData(this.editId);
    }
  }

  private loadAccidentData(id: number): void {
    this.isLoading = true;
    this.accidenteService.getAccidente(id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.populateForm(response.data);
        } else {
          this.showMessage('No se encontró el accidente', 'error');
          this.router.navigate(['/check-list/accidents/list']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[AccidentsComponent] Error loading accident:', err);
        this.showMessage('Error al cargar accidente', 'error');
        this.router.navigate(['/check-list/accidents/list']);
      }
    });
  }

  private populateForm(acc: AccidenteApiResponse): void {
    this.numeroAccidente = acc.NumeroAccidente || '';
    const toInt = (v: string | null): number | null => v ? parseInt(v, 10) : null;
    const toDate = (v: string | null): Date | null => {
      if (!v) return null;
      const d = new Date(v + 'T00:00:00');
      return isNaN(d.getTime()) ? null : d;
    };
    const toBool = (v: string | null): boolean => v === '1' || v === 'true';

    this.accidentForm.patchValue({
      IdObra: toInt(acc.IdObra),
      IdEmpresa: toInt(acc.IdEmpresa),
      IdTipoAccidente: toInt(acc.IdTipoAccidente),
      DiasPerdidosEstimados: toInt(acc.DiasPerdidosEstimados),
      FechaAccidente: toDate(acc.FechaAccidente),
      HoraAccidente: acc.HoraAccidente || '',
      FechaControl: toDate(acc.FechaControl),
      DiasPerdidosFinal: toInt(acc.DiasPerdidosFinal),
      NumEnfermedadProfesional: acc.NumEnfermedadProfesional || '',
      Descripcion: acc.Descripcion || '',
      IdTrabajador: toInt(acc.IdTrabajador),
      IdCargo: toInt(acc.IdCargo),
      IdSupervisor: toInt(acc.IdSupervisor),
      IdPTerreno: toInt(acc.IdPTerreno),
      IdAPR: toInt(acc.IdAPR),
      IdADO: toInt(acc.IdADO),
      IdRiesgoAsociado: toInt(acc.IdRiesgoAsociado),
      IdLesion: toInt(acc.IdLesion),
      IdParteCuerpo: toInt(acc.IdParteCuerpo),
      CalificacionPS: acc.CalificacionPS || null,
      FuenteAgente: acc.FuenteAgente || '',
      Accion: acc.Accion || '',
      Condicion: acc.Condicion || '',
      IdMaquinaEquipo: toInt(acc.IdMaquinaEquipo),
      IdCausaRaiz: toInt(acc.IdCausaRaiz),
      CtrlE: toBool(acc.CtrlE),
      CtrlS: toBool(acc.CtrlS),
      CtrlI: toBool(acc.CtrlI),
      CtrlA: toBool(acc.CtrlA),
      CtrlEPP: toBool(acc.CtrlEPP),
      Observaciones: acc.Observaciones || ''
    });
  }

  loadDropdowns(): void {
    this.isLoadingDropdowns = true;
    this.accidenteService.getDropdowns().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const d = response.data;
          this.obraOpts = (d.obras || []).map((o: any) => ({ value: parseInt(o.IdObra, 10), label: o.Nombre || o.Obra, sublabel: o.Codigo || undefined }));
          this.empresaOpts = (d.empresas || []).map((o: any) => ({ value: parseInt(o.IdEmpresa, 10), label: o.Nombre, sublabel: o.RUT || undefined }));
          this.trabajadorOpts = (d.trabajadores || []).map((o: any) => ({ value: parseInt(o.IdTrabajador, 10), label: o.Nombre, sublabel: o.RUT || undefined }));
          this.tipoAccidenteOpts = (d.tiposAccidente || []).map((o: any) => ({ value: parseInt(o.IdTipoAccidente, 10), label: o.Nombre }));
          this.riesgoOpts = (d.riesgosAsociados || []).map((o: any) => ({ value: parseInt(o.IdRiesgoAsociado, 10), label: o.Nombre }));
          this.lesionOpts = (d.lesiones || []).map((o: any) => ({ value: parseInt(o.IdLesion, 10), label: o.Nombre }));
          this.parteCuerpoOpts = (d.partesCuerpo || []).map((o: any) => ({ value: parseInt(o.IdParteCuerpo, 10), label: o.Nombre }));
          this.cargoOpts = (d.cargos || []).map((o: any) => ({ value: parseInt(o.IdCargo, 10), label: o.Nombre }));
          this.maquinaEquipoOpts = (d.maquinasEquipos || []).map((o: any) => ({ value: parseInt(o.IdMaquinaEquipo, 10), label: o.Nombre }));
          this.causaRaizOpts = (d.causasRaiz || []).map((o: any) => ({ value: parseInt(o.IdCausaRaiz, 10), label: o.Nombre }));
          this.calificacionPSOpts = CALIFICACION_PS_OPTIONS.map(c => ({ value: c, label: c }));
        }
        this.isLoadingDropdowns = false;
      },
      error: (err) => {
        console.error('[AccidentsComponent] Error loading dropdowns:', err);
        this.showMessage('Error al cargar datos del formulario', 'error');
        this.isLoadingDropdowns = false;
      }
    });
  }

  initializeForm(): void {
    this.accidentForm = this.fb.group({
      // ========== DATOS PRINCIPALES ==========
      IdObra: [null, Validators.required],
      IdEmpresa: [null],
      IdTipoAccidente: [null],
      DiasPerdidosEstimados: [null, Validators.min(0)],
      FechaAccidente: [new Date(), Validators.required],
      HoraAccidente: [''],
      FechaControl: [null],
      DiasPerdidosFinal: [null, Validators.min(0)],
      NumEnfermedadProfesional: [''],
      Descripcion: ['', Validators.minLength(10)],

      // ========== DATOS DEL TRABAJADOR ==========
      IdTrabajador: [null, Validators.required],
      IdCargo: [null],

      // ========== LÍNEA DE MANDO ==========
      IdSupervisor: [null],
      IdPTerreno: [null],
      IdAPR: [null],
      IdADO: [null],

      // ========== ANÁLISIS / TIPOLOGÍA ==========
      IdRiesgoAsociado: [null],
      IdLesion: [null],
      IdParteCuerpo: [null],
      CalificacionPS: [null],
      FuenteAgente: [''],
      Accion: [''],
      Condicion: [''],
      IdMaquinaEquipo: [null],

      // ========== GESTIÓN DEL CAMBIO ==========
      IdCausaRaiz: [null],
      CtrlE: [false],
      CtrlS: [false],
      CtrlI: [false],
      CtrlA: [false],
      CtrlEPP: [false],
      Observaciones: ['']
    });
  }

  onSubmit(): void {
    if (this.accidentForm.valid) {
      this.isLoading = true;
      const formValue = this.accidentForm.value;

      // Formatear fecha a YYYY-MM-DD
      const formatDate = (d: Date | string | null): string | undefined => {
        if (!d) return undefined;
        const date = new Date(d);
        if (isNaN(date.getTime())) return undefined;
        return date.toISOString().split('T')[0];
      };

      if (this.isEditMode && this.editId) {
        this.submitUpdate(formValue, formatDate);
      } else {
        this.submitCreate(formValue, formatDate);
      }
    } else {
      this.showMessage('Complete todos los campos requeridos', 'error');
      this.markFormGroupTouched(this.accidentForm);
    }
  }

  private submitCreate(formValue: any, formatDate: (d: any) => string | undefined): void {
    const request: CrearAccidenteRequest = {
      caso: 'Crea',
      IdObra: formValue.IdObra,
      IdTrabajador: formValue.IdTrabajador,
      IdEmpresa: formValue.IdEmpresa || undefined,
      FechaAccidente: formatDate(formValue.FechaAccidente),
      HoraAccidente: formValue.HoraAccidente || undefined,
      IdTipoAccidente: formValue.IdTipoAccidente || undefined,
      Descripcion: formValue.Descripcion || undefined,
      NumEnfermedadProfesional: formValue.NumEnfermedadProfesional || undefined,
      DiasPerdidosEstimados: formValue.DiasPerdidosEstimados ?? undefined,
      FechaControl: formatDate(formValue.FechaControl),
      IdCargo: formValue.IdCargo || undefined,
      IdSupervisor: formValue.IdSupervisor || undefined,
      IdPTerreno: formValue.IdPTerreno || undefined,
      IdAPR: formValue.IdAPR || undefined,
      IdADO: formValue.IdADO || undefined,
      IdRiesgoAsociado: formValue.IdRiesgoAsociado || undefined,
      IdLesion: formValue.IdLesion || undefined,
      IdParteCuerpo: formValue.IdParteCuerpo || undefined,
      CalificacionPS: formValue.CalificacionPS || undefined,
      FuenteAgente: formValue.FuenteAgente || undefined,
      Accion: formValue.Accion || undefined,
      Condicion: formValue.Condicion || undefined,
      IdMaquinaEquipo: formValue.IdMaquinaEquipo || undefined,
      IdCausaRaiz: formValue.IdCausaRaiz || undefined,
      CtrlE: formValue.CtrlE || false,
      CtrlS: formValue.CtrlS || false,
      CtrlI: formValue.CtrlI || false,
      CtrlA: formValue.CtrlA || false,
      CtrlEPP: formValue.CtrlEPP || false,
      Observaciones: formValue.Observaciones || undefined
    };

    this.accidenteService.crearAccidente(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.showMessage(
            `Accidente ${response.data.NumeroAccidente} creado correctamente`,
            'success'
          );
          this.router.navigate(['/check-list/accidents/list']);
        } else {
          this.showMessage(response.message || 'Error al crear accidente', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[AccidentsComponent] Error creating accident:', err);
        this.showMessage('Error de conexión al crear accidente', 'error');
      }
    });
  }

  private submitUpdate(formValue: any, formatDate: (d: any) => string | undefined): void {
    const request: ActualizarAccidenteRequest = {
      caso: 'Actualiza',
      IdAccidente: this.editId!,
      IdObra: formValue.IdObra,
      IdTrabajador: formValue.IdTrabajador,
      IdEmpresa: formValue.IdEmpresa || undefined,
      FechaAccidente: formatDate(formValue.FechaAccidente),
      HoraAccidente: formValue.HoraAccidente || undefined,
      IdTipoAccidente: formValue.IdTipoAccidente || undefined,
      Descripcion: formValue.Descripcion || undefined,
      NumEnfermedadProfesional: formValue.NumEnfermedadProfesional || undefined,
      DiasPerdidosEstimados: formValue.DiasPerdidosEstimados ?? undefined,
      DiasPerdidosFinal: formValue.DiasPerdidosFinal ?? undefined,
      FechaControl: formatDate(formValue.FechaControl),
      IdCargo: formValue.IdCargo || undefined,
      IdSupervisor: formValue.IdSupervisor || undefined,
      IdPTerreno: formValue.IdPTerreno || undefined,
      IdAPR: formValue.IdAPR || undefined,
      IdADO: formValue.IdADO || undefined,
      IdRiesgoAsociado: formValue.IdRiesgoAsociado || undefined,
      IdLesion: formValue.IdLesion || undefined,
      IdParteCuerpo: formValue.IdParteCuerpo || undefined,
      CalificacionPS: formValue.CalificacionPS || undefined,
      FuenteAgente: formValue.FuenteAgente || undefined,
      Accion: formValue.Accion || undefined,
      Condicion: formValue.Condicion || undefined,
      IdMaquinaEquipo: formValue.IdMaquinaEquipo || undefined,
      IdCausaRaiz: formValue.IdCausaRaiz || undefined,
      CtrlE: formValue.CtrlE || false,
      CtrlS: formValue.CtrlS || false,
      CtrlI: formValue.CtrlI || false,
      CtrlA: formValue.CtrlA || false,
      CtrlEPP: formValue.CtrlEPP || false,
      Observaciones: formValue.Observaciones || undefined
    };

    this.accidenteService.actualizarAccidente(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.showMessage('Accidente actualizado correctamente', 'success');
          this.router.navigate(['/check-list/accidents/list']);
        } else {
          this.showMessage(response.message || 'Error al actualizar accidente', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[AccidentsComponent] Error updating accident:', err);
        this.showMessage('Error de conexión al actualizar accidente', 'error');
      }
    });
  }

  onReset(): void {
    this.accidentForm.reset({
      CtrlE: false,
      CtrlS: false,
      CtrlI: false,
      CtrlA: false,
      CtrlEPP: false
    });
    this.currentStep = 0;
    this.showMessage('Formulario reiniciado', 'info');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: type === 'error' ? 'snack-error' : type === 'success' ? 'snack-success' : ''
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.accidentForm.get(fieldName);
    if (control?.hasError('required')) return 'Campo requerido';
    if (control?.hasError('minlength')) return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    if (control?.hasError('min')) return `Valor mínimo: ${control.errors?.['min'].min}`;
    if (control?.hasError('max')) return `Valor máximo: ${control.errors?.['max'].max}`;
    return '';
  }

  goToList(): void {
    this.router.navigate(['/check-list/accidents/list']);
  }

  goToStatistics(): void {
    this.router.navigate(['/check-list/accidents/statistics']);
  }

  onAddCatalog(formControlName: string): void {
    const config = this.catalogMap[formControlName];
    if (!config) return;

    const dialogData: AddItemDialogData = {
      title: config.title,
      fieldLabel: config.fieldLabel
    };

    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      width: '450px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.accidenteService.crearCatalogo(config.tabla, result.nombre, result.descripcion).subscribe({
        next: (resp) => {
          if (resp.success && resp.data) {
            const newId = resp.data.id;
            if (resp.data.exists) {
              this.showMessage(`"${result.nombre}" ya existe, se seleccionó automáticamente`, 'info');
            } else {
              this.showMessage(`"${result.nombre}" creado correctamente`, 'success');
            }
            // Reload dropdowns and set the new value
            this.loadDropdowns();
            this.accidentForm.get(formControlName)?.setValue(newId);
          }
        },
        error: (err) => {
          console.error('[AccidentsComponent] Error creating catalog item:', err);
          this.showMessage('Error al crear elemento', 'error');
        }
      });
    });
  }

  nextStep(): void {
    if (this.currentStep < 4) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  isStepValid(step: number): boolean {
    const fieldsPerStep: Record<number, string[]> = {
      0: ['IdObra', 'FechaAccidente'],
      1: ['IdTrabajador'],
      2: [],
      3: [],
      4: []
    };

    return fieldsPerStep[step]?.every(field => {
      const control = this.accidentForm.get(field);
      return control?.valid;
    }) ?? true;
  }
}

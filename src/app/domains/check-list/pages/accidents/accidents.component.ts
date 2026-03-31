import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { CustomDateAdapter } from '../../../../shared/adapters/custom-date-adapter';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
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

// Formato de fecha DD/MM/YYYY
const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

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
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  templateUrl: './accidents.component.html',
  styleUrl: './accidents.component.scss'
})
export class AccidentsComponent implements OnInit {
  isLoading = false;
  isLoadingDropdowns = true;
  isCreatingCatalogItem = false;
  accidentForm!: FormGroup;
  currentStep = 0;

  isEditMode = false;
  accidentId: number | null = null;
  editId: number | null = null;
  numeroAccidente = '';
  currentUserId: number | null = null;
  
  // Campos calculados
  diasPerdidosFinal: number | null = null;
  diasConsecutivos: number | null = null;

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
    private accidenteService: AccidenteService,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Date>
  ) {
    this.dateAdapter.setLocale('es-CL');
  }

  ngOnInit(): void {
    this.currentUserId = this.getUserId();
    this.initializeForm();
    this.loadDropdowns();
    this.setupDateCalculations();

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

  private setupDateCalculations(): void {
    // Calcular DiasConsecutivos cuando cambie FechaAccidente
    this.accidentForm.get('FechaAccidente')?.valueChanges.subscribe(fechaAccidente => {
      this.calcularDiasConsecutivos(fechaAccidente);
    });

    // Calcular DiasPerdidosFinal cuando cambien FechaAccidente o FechaControl
    this.accidentForm.get('FechaAccidente')?.valueChanges.subscribe(() => {
      this.calcularDiasPerdidosFinal();
    });

    this.accidentForm.get('FechaControl')?.valueChanges.subscribe(() => {
      this.calcularDiasPerdidosFinal();
    });

    // Calcular valores iniciales
    this.calcularDiasConsecutivos(this.accidentForm.get('FechaAccidente')?.value);
    this.calcularDiasPerdidosFinal();
  }

  private calcularDiasConsecutivos(fechaAccidente: Date | null): void {
    if (!fechaAccidente) {
      this.diasConsecutivos = null;
      return;
    }

    const fecha = new Date(fechaAccidente);
    const hoy = new Date();
    
    // Resetear horas para comparar solo fechas
    fecha.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    const diffTime = hoy.getTime() - fecha.getTime();
    this.diasConsecutivos = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  private calcularDiasPerdidosFinal(): void {
    const fechaAccidente = this.accidentForm.get('FechaAccidente')?.value;
    const fechaControl = this.accidentForm.get('FechaControl')?.value;

    if (!fechaAccidente || !fechaControl) {
      this.diasPerdidosFinal = null;
      return;
    }

    const inicio = new Date(fechaAccidente);
    const fin = new Date(fechaControl);

    // Resetear horas para comparar solo fechas
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);

    const diffTime = fin.getTime() - inicio.getTime();
    this.diasPerdidosFinal = Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
      Observaciones: formValue.Observaciones || undefined,
      created_by: this.currentUserId || undefined
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
      // DiasPerdidosFinal se calcula automáticamente en el backend
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
    this.showMessage('Formulario reiniciado', 'success');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
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
      
      const startTime = Date.now();
      console.log(`[TIMING-${startTime}] ========== INICIO CREAR CATALOGO ==========`);
      
      // Activar loading
      this.isCreatingCatalogItem = true;
      console.log('[LOADING] isCreatingCatalogItem =', this.isCreatingCatalogItem);
      
      // LOG: Payload enviado a CreaCatalogo
      const crearCatalogoPayload = {
        caso: 'CreaCatalogo',
        tabla: config.tabla,
        Nombre: result.nombre,
        Descripcion: result.descripcion
      };
      console.log(`[TIMING-${startTime}] Enviando CreaCatalogo...`);
      
      this.accidenteService.crearCatalogo(config.tabla, result.nombre, result.descripcion).subscribe({
        next: (resp) => {
          const crearTime = Date.now() - startTime;
          console.log(`[TIMING-${startTime}] CreaCatalogo respondió en ${crearTime}ms`);
          
          if (resp.success && resp.data) {
            const newId = resp.data.id;
            console.log(`[TIMING-${startTime}] Nuevo ID: ${newId}, exists: ${resp.data.exists}`);
            
            if (resp.data.exists) {
              this.showMessage(`"${result.nombre}" ya existe, se seleccionó automáticamente`, 'success');
            } else {
              this.showMessage(`"${result.nombre}" creado correctamente`, 'success');
            }
            
            // Agregar el elemento localmente sin recargar
            console.log(`[TIMING-${startTime}] Agregando elemento localmente...`);
            this.addItemToDropdown(formControlName, newId, result.nombre);
            
            // Setear el valor en el formulario
            this.accidentForm.patchValue({ [formControlName]: newId }, { emitEvent: false });
            
            // Forzar detección de cambios
            this.cdr.detectChanges();
            
            const totalTime = Date.now() - startTime;
            console.log(`[TIMING-${startTime}] ========== PROCESO COMPLETO: ${totalTime}ms ==========`);
            
            // Desactivar loading
            this.isCreatingCatalogItem = false;
          }
        },
        error: (err) => {
          console.error('[AccidentsComponent] Error creating catalog item:', err);
          this.showMessage('Error al crear elemento', 'error');
          // Desactivar loading en caso de error
          this.isCreatingCatalogItem = false;
        }
      });
    });
  }

  private addItemToDropdown(fieldName: string, newId: number, nombre: string): void {
    const newItem: SmartSelectorOption = {
      value: newId,
      label: nombre.toUpperCase(),
      sublabel: undefined
    };
    
    // Agregar al array correspondiente
    switch(fieldName) {
      case 'IdObra':
        this.obraOpts.push(newItem);
        this.obraOpts.sort((a, b) => a.label.localeCompare(b.label));
        console.log(`[ADD] Obra agregada: ${nombre} (ID: ${newId}), total: ${this.obraOpts.length}`);
        break;
      case 'IdEmpresa':
        this.empresaOpts.push(newItem);
        this.empresaOpts.sort((a, b) => a.label.localeCompare(b.label));
        console.log(`[ADD] Empresa agregada: ${nombre} (ID: ${newId}), total: ${this.empresaOpts.length}`);
        break;
      case 'IdTrabajador':
      case 'IdSupervisor':
      case 'IdPTerreno':
      case 'IdAPR':
      case 'IdADO':
        this.trabajadorOpts.push(newItem);
        this.trabajadorOpts.sort((a, b) => a.label.localeCompare(b.label));
        console.log(`[ADD] Trabajador agregado: ${nombre} (ID: ${newId}), total: ${this.trabajadorOpts.length}`);
        break;
      case 'IdTipoAccidente':
        this.tipoAccidenteOpts.push(newItem);
        this.tipoAccidenteOpts.sort((a, b) => a.label.localeCompare(b.label));
        console.log(`[ADD] Tipo Accidente agregado: ${nombre} (ID: ${newId}), total: ${this.tipoAccidenteOpts.length}`);
        break;
      case 'IdRiesgoAsociado':
        this.riesgoOpts.push(newItem);
        this.riesgoOpts.sort((a, b) => a.label.localeCompare(b.label));
        console.log(`[ADD] Riesgo agregado: ${nombre} (ID: ${newId}), total: ${this.riesgoOpts.length}`);
        break;
      case 'IdLesion':
        this.lesionOpts.push(newItem);
        this.lesionOpts.sort((a, b) => a.label.localeCompare(b.label));
        console.log(`[ADD] Lesión agregada: ${nombre} (ID: ${newId}), total: ${this.lesionOpts.length}`);
        break;
      case 'IdParteCuerpo':
        this.parteCuerpoOpts.push(newItem);
        this.parteCuerpoOpts.sort((a, b) => a.label.localeCompare(b.label));
        console.log(`[ADD] Parte Cuerpo agregada: ${nombre} (ID: ${newId}), total: ${this.parteCuerpoOpts.length}`);
        break;
      case 'IdCargo':
        this.cargoOpts.push(newItem);
        this.cargoOpts.sort((a, b) => a.label.localeCompare(b.label));
        console.log(`[ADD] Cargo agregado: ${nombre} (ID: ${newId}), total: ${this.cargoOpts.length}`);
        break;
      case 'IdMaquinaEquipo':
        this.maquinaEquipoOpts.push(newItem);
        this.maquinaEquipoOpts.sort((a, b) => a.label.localeCompare(b.label));
        console.log(`[ADD] Máquina/Equipo agregado: ${nombre} (ID: ${newId}), total: ${this.maquinaEquipoOpts.length}`);
        break;
      case 'IdCausaRaiz':
        this.causaRaizOpts.push(newItem);
        this.causaRaizOpts.sort((a, b) => a.label.localeCompare(b.label));
        console.log(`[ADD] Causa Raíz agregada: ${nombre} (ID: ${newId}), total: ${this.causaRaizOpts.length}`);
        break;
    }
  }

  private reloadSingleDropdown(fieldName: string, newId: number, startTime?: number): void {
    const reloadStart = Date.now();
    console.log(`[RELOAD] Recargando dropdown: ${fieldName}, ID: ${newId}`);
    
    this.accidenteService.getDropdowns(true).subscribe({
      next: (response) => {
        const apiTime = Date.now() - reloadStart;
        console.log(`[RELOAD] API ConsultaDropdowns respondió en ${apiTime}ms`);
        
        if (response.success && response.data) {
          const d = response.data;
          const mapStart = Date.now();
          
          // Actualizar solo el array de opciones correspondiente
          switch(fieldName) {
            case 'IdObra':
              this.obraOpts = (d.obras || []).map((o: any) => ({ value: parseInt(o.IdObra, 10), label: o.Nombre || o.Obra, sublabel: o.Codigo || undefined }));
              console.log(`[RELOAD] obraOpts actualizado: ${this.obraOpts.length} items`);
              break;
            case 'IdEmpresa':
              this.empresaOpts = (d.empresas || []).map((o: any) => ({ value: parseInt(o.IdEmpresa, 10), label: o.Nombre, sublabel: o.RUT || undefined }));
              console.log(`[RELOAD] empresaOpts actualizado: ${this.empresaOpts.length} items`);
              break;
            case 'IdTrabajador':
            case 'IdSupervisor':
            case 'IdPTerreno':
            case 'IdAPR':
            case 'IdADO':
              this.trabajadorOpts = (d.trabajadores || []).map((o: any) => ({ value: parseInt(o.IdTrabajador, 10), label: o.Nombre, sublabel: o.RUT || undefined }));
              console.log(`[RELOAD] trabajadorOpts actualizado: ${this.trabajadorOpts.length} items`);
              break;
            case 'IdTipoAccidente':
              this.tipoAccidenteOpts = (d.tiposAccidente || []).map((o: any) => ({ value: parseInt(o.IdTipoAccidente, 10), label: o.Nombre }));
              console.log(`[RELOAD] tipoAccidenteOpts actualizado: ${this.tipoAccidenteOpts.length} items`);
              break;
            case 'IdRiesgoAsociado':
              this.riesgoOpts = (d.riesgosAsociados || []).map((o: any) => ({ value: parseInt(o.IdRiesgoAsociado, 10), label: o.Nombre }));
              console.log(`[RELOAD] riesgoOpts actualizado: ${this.riesgoOpts.length} items`);
              break;
            case 'IdLesion':
              this.lesionOpts = (d.lesiones || []).map((o: any) => ({ value: parseInt(o.IdLesion, 10), label: o.Nombre }));
              console.log(`[RELOAD] lesionOpts actualizado: ${this.lesionOpts.length} items`);
              break;
            case 'IdParteCuerpo':
              this.parteCuerpoOpts = (d.partesCuerpo || []).map((o: any) => ({ value: parseInt(o.IdParteCuerpo, 10), label: o.Nombre }));
              console.log(`[RELOAD] parteCuerpoOpts actualizado: ${this.parteCuerpoOpts.length} items`);
              break;
            case 'IdCargo':
              this.cargoOpts = (d.cargos || []).map((o: any) => ({ value: parseInt(o.IdCargo, 10), label: o.Nombre }));
              console.log(`[RELOAD] cargoOpts actualizado: ${this.cargoOpts.length} items`);
              break;
            case 'IdMaquinaEquipo':
              this.maquinaEquipoOpts = (d.maquinasEquipos || []).map((o: any) => ({ value: parseInt(o.IdMaquinaEquipo, 10), label: o.Nombre }));
              console.log(`[RELOAD] maquinaEquipoOpts actualizado: ${this.maquinaEquipoOpts.length} items`);
              break;
            case 'IdCausaRaiz':
              this.causaRaizOpts = (d.causasRaiz || []).map((o: any) => ({ value: parseInt(o.IdCausaRaiz, 10), label: o.Nombre }));
              console.log(`[RELOAD] causaRaizOpts actualizado: ${this.causaRaizOpts.length} items`);
              break;
          }
          
          const mapTime = Date.now() - mapStart;
          console.log(`[RELOAD] Mapeo de opciones: ${mapTime}ms`);
          
          // Forzar detección de cambios para que las opciones se propaguen
          const cdr1Start = Date.now();
          this.cdr.detectChanges();
          console.log(`[RELOAD] 1er detectChanges: ${Date.now() - cdr1Start}ms`);
          
          // AHORA sí, setear el valor en el formulario
          const patchStart = Date.now();
          this.accidentForm.patchValue({ [fieldName]: newId }, { emitEvent: false });
          console.log(`[RELOAD] patchValue: ${Date.now() - patchStart}ms`);
          
          // Forzar otra detección de cambios para que el valor se propague al selector
          const cdr2Start = Date.now();
          this.cdr.detectChanges();
          console.log(`[RELOAD] 2do detectChanges: ${Date.now() - cdr2Start}ms`);
          
          const totalReload = Date.now() - reloadStart;
          console.log(`[RELOAD] Recarga completa: ${totalReload}ms`);
          
          if (startTime) {
            const totalProcess = Date.now() - startTime;
            console.log(`[TIMING-${startTime}] ========== PROCESO COMPLETO: ${totalProcess}ms ==========`);
          }
        }
      },
      error: (err) => {
        console.error(`[RELOAD] Error recargando dropdown ${fieldName}:`, err.message || err);
        this.showMessage('Error al recargar opciones', 'error');
      }
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

  private getUserId(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId, 10) : null;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.accidentForm.get(fieldName);
    if (!control) return '';
    
    if (control.hasError('required')) return 'Este campo es requerido';
    if (control.hasError('min')) return `Valor mínimo: ${control.errors?.['min'].min}`;
    if (control.hasError('max')) return `Valor máximo: ${control.errors?.['max'].max}`;
    if (control.hasError('minlength')) return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    if (control.hasError('maxlength')) return `Máximo ${control.errors?.['maxlength'].requiredLength} caracteres`;
    if (control.hasError('email')) return 'Email inválido';
    if (control.hasError('pattern')) return 'Formato inválido';
    
    return '';
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: type === 'success' ? 3000 : 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
    });
  }
}

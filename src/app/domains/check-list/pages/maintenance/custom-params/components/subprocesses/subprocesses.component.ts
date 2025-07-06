import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../../../shared/controls/custom-select/custom-select.component';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subscription, catchError, finalize, map, of } from 'rxjs';
import { DataTableComponent } from '../../../../../../../shared/components/data-table/data-table.component';
import { SubParametroService, EtapaConstructivaItem, SubprocesoItem } from '../../../../../services/sub-parametro.service';
import { ProjectSelectionService } from '../../../../../services/project-selection.service';
import { ProxyService } from '../../../../../../../core/services/proxy.service';

// Define interfaces localmente
export interface TableColumn {
  name: string;
  label: string;
  cssClass?: string;
}

export interface ActionButton {
  icon: string;
  color: string;
  tooltip: string;
  action: string;
}

@Component({
  selector: 'app-subprocesses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSnackBarModule,
    CustomSelectComponent,
    ReactiveFormsModule,
    DataTableComponent
  ],
  templateUrl: './subprocesses.component.html',
  styleUrls: ['./subprocesses.component.scss']
})

export class SubprocessesComponent implements OnInit, OnDestroy {
  // Suscripción al ID de proyecto seleccionado
  private projectSubscription: Subscription | null = null;
  
  // ID del proyecto actualmente seleccionado
  selectedProjectId: string | null = null;
  
  // Control para etapa constructiva
  etapaConstructivaControl: FormControl = new FormControl('', Validators.required);
  etapasConstructivasList: EtapaConstructivaItem[] = [];
  etapasParaSelect: SelectOption[] = [];
  
  // Props para los subprocesos
  isLoadingSubprocesos: boolean = false;
  newSubprocessCode: string = '';
  newSubprocessName: string = '';
  editingSubprocess: boolean = false;
  editingSubprocessId: string | null = null;
  subprocessSearchKey: string = '';
  subprocessesByEtapa: Record<string, SubprocesoItem[]> = {};
  filteredSubprocesos: SubprocesoItem[] = [];
  selectedEtapaId: string | null = null;

  // Props para la tabla de subprocesos
  subprocesoTableColumns: TableColumn[] = [
    { name: 'codigo', label: 'Código' },
    { name: 'nombre', label: 'Nombre' }
  ];
  subprocesoActionButtons: ActionButton[] = [
    { icon: 'edit', color: 'primary', tooltip: 'Editar', action: 'edit' },
    { icon: 'delete', color: 'warn', tooltip: 'Eliminar', action: 'delete' }
  ];
  subprocesoTablePageSize = 10;
  subprocesoTablePageSizeOptions = [5, 10, 25, 50];

  constructor(
    private subParametroService: SubParametroService,
    private proxyService: ProxyService,
    private projectSelectionService: ProjectSelectionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Suscribirse al ID de proyecto seleccionado
    this.projectSubscription = this.projectSelectionService.selectedProjectId$
      .subscribe(projectId => {
        console.log('SubprocessesComponent: Received project ID', projectId);
        this.selectedProjectId = projectId;
        
        // Limpiar la selección de etapa constructiva y datos relacionados cuando cambia el proyecto
        if (this.etapaConstructivaControl.value || this.selectedEtapaId) {
          // Reset selectedEtapaId to hide the table and form
          this.selectedEtapaId = null;
          this.filteredSubprocesos = [];
          this.etapaConstructivaControl.setValue(null);
        }
        
        if (projectId) {
          // Cargar las etapas constructivas del proyecto seleccionado
          this.loadEtapasConstructivas();
        } else {
          // Limpiar los datos cuando no hay proyecto seleccionado
          this.etapasConstructivasList = [];
          this.etapasParaSelect = [];
          this.filteredSubprocesos = [];
        }
      });
  }
  
  /**
   * Limpia suscripciones cuando el componente se destruye
   */
  ngOnDestroy(): void {
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
  }

  /**
   * Carga las etapas constructivas filtradas por el proyecto seleccionado
   */
  loadEtapasConstructivas(): void {
    if (!this.selectedProjectId) {
      console.log('No hay proyecto seleccionado. No se cargarán etapas.');
      this.etapasConstructivasList = [];
      this.etapasParaSelect = [];
      return;
    }
    
    this.isLoadingSubprocesos = true;
    
    this.subParametroService.getEtapasConstructivas()
      .pipe(
        map((response: EtapaConstructivaItem[]) => {
          console.log('Todas las etapas constructivas:', response);
          
          // Filtrar las etapas por el proyecto seleccionado
          this.etapasConstructivasList = response.filter(etapa => 
            etapa.idObra === this.selectedProjectId
          );
          
          console.log(`Etapas filtradas para proyecto ${this.selectedProjectId}:`, this.etapasConstructivasList);
          
          // Convertir a formato de opciones para el selector
          this.etapasParaSelect = this.etapasConstructivasList.map(etapa => ({
            value: etapa.idEtapaConstructiva || '',
            label: `${etapa.codigo || ''} - ${etapa.nombre || ''}`
          }));
        }),
        catchError((error: Error) => {
          console.error('Error al cargar etapas constructivas:', error);
          this.etapasConstructivasList = [];
          this.etapasParaSelect = [];
          return of(null);
        }),
        finalize(() => {
          this.isLoadingSubprocesos = false;
        })
      )
      .subscribe();
  }

  /**
   * Maneja el cambio de selección de etapa constructiva
   */
  onEtapaConstructivaSelectionChange(event: { value: string } | null): void {
    console.log('📊 EVENTO DE CAMBIO EN SELECCIÓN DE ETAPA CONSTRUCTIVA:', event);
    
    const etapaId = event?.value || '';
    if (!etapaId) {
      console.log('❌ No se seleccionó ninguna etapa constructiva, reseteando datos...');
      this.filteredSubprocesos = [];
      this.selectedEtapaId = null;
      this.resetSubprocessForm();
      return;
    }
    
    this.selectedEtapaId = etapaId;
    console.log('✅ Etapa constructiva seleccionada:', {
      etapaId: etapaId,
      endpoint: '/ws/EtapaConstructivaSvcImpl.php',
      caso: 'ConsultaSubProcesos',
      descripción: 'Consultando subprocesos para la etapa seleccionada',
      próximaAcción: 'loadSubprocessesByEtapa con ID: ' + etapaId
    });
    
    this.loadSubprocessesByEtapa(etapaId);
    this.resetSubprocessForm();
  }

  /**
   * Carga los subprocesos por etapa constructiva
   * @param etapaId ID de la etapa constructiva
   * @param forceRefresh Si es true, fuerza la recarga desde la API ignorando la caché
   */
  loadSubprocessesByEtapa(etapaId: string, forceRefresh: boolean = false): void {
    if (!etapaId) return;

    this.isLoadingSubprocesos = true;

    // Si ya tenemos los subprocesos cargados para esta etapa y no se requiere refresco forzado, usamos la caché
    if (!forceRefresh && this.subprocessesByEtapa[etapaId]) {
      console.log('💾 USANDO DATOS EN CACHÉ para subprocesos de la etapa:', etapaId);
      this.filteredSubprocesos = [...this.subprocessesByEtapa[etapaId]];
      this.isLoadingSubprocesos = false;
      return;
    }

    console.log('🌐 REALIZANDO LLAMADA A API para cargar subprocesos:');
    console.log('ℹ️ DETALLES DE LA SOLICITUD API:', {
      endpoint: '/ws/EtapaConstructivaSvcImpl.php',
      method: 'POST',
      caso: 'ConsultaSubProcesos',
      idEtapaConstructiva: etapaId,
      servicio: 'SubParametroService.getSubprocesosPorEtapa',
      payload: {
        caso: 'ConsultaSubProcesos',
        idEtapaConstructiva: parseInt(etapaId, 10),
        idSubProceso: 0,
        codigo: 0,
        nombre: null
      }
    });
    
    // Realizamos la llamada a la API - convertimos el ID a número para la API
    const etapaIdNum = parseInt(etapaId, 10);
    this.subParametroService.getSubprocesosPorEtapa(etapaIdNum)
      .pipe(
        map((response: SubprocesoItem[]) => {
          console.log('Respuesta de subprocesos:', response);
          // Actualizamos la caché
          this.subprocessesByEtapa[etapaId] = response || [];
          this.filteredSubprocesos = [...this.subprocessesByEtapa[etapaId]];
        }),
        catchError((error: Error) => {
          console.error('Error al cargar subprocesos:', error);
          this.subprocessesByEtapa[etapaId] = [];
          this.filteredSubprocesos = [];
          return of(null);
        }),
        finalize(() => {
          this.isLoadingSubprocesos = false;
        })
      )
      .subscribe();
  }

  /**
   * Agrega o actualiza un subproceso
   * @returns void
   */
  addSubprocess(): void {
    if (!this.selectedEtapaId) {
      console.error('No se ha seleccionado una etapa constructiva');
      this.snackBar.open('Por favor, seleccione una etapa constructiva', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    console.log('=== INICIO DE SOLICITUD PARA AGREGAR/ACTUALIZAR SUBPROCESO ===');
    
    const subprocessCode = this.newSubprocessCode.trim();
    const subprocessName = this.newSubprocessName.trim();
    
    if (!subprocessCode || !subprocessName) {
      console.error('Código y nombre de subproceso son requeridos');
      this.snackBar.open('Código y nombre de subproceso son requeridos', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    this.isLoadingSubprocesos = true;
    
    if (this.editingSubprocess && this.editingSubprocessId) {
      // Actualizamos un subproceso existente
      const subprocessToUpdate: SubprocesoItem = {
        idSubproceso: this.editingSubprocessId,
        codigo: subprocessCode,
        nombre: subprocessName,
        idEtapaConstructiva: this.selectedEtapaId
      };
      
      console.log('📤 ENVIANDO DATOS PARA ACTUALIZACIÓN:', {
        método: 'updateSubproceso',
        endpoint: '/ws/EtapaConstructivaSvcImpl.php',
        caso: 'ModificaSubProceso', // Actualizado al nuevo caso requerido
        idSubProceso: this.editingSubprocessId, // Nota: camelCase idSubProceso
        idEtapaConstructiva: this.selectedEtapaId,
        codigo: subprocessCode,
        nombre: subprocessName
      });
      
      this.subParametroService.updateSubproceso(subprocessToUpdate)
        .pipe(
          map((response: { success?: boolean; message?: string; data?: any, glosa?: string }) => {
            console.log('📥 RESPUESTA DE ACTUALIZACIÓN DE SUBPROCESO:', response);
            
            if (response && response.success) {
              // Éxito en la actualización
              // Forzamos la recarga desde la API para asegurar datos actualizados
              this.loadSubprocessesByEtapa(this.selectedEtapaId as string, true);
              
              this.snackBar.open(`Subproceso "${subprocessName}" actualizado correctamente`, 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              
              this.resetSubprocessForm();
            } else {
              // Error en la respuesta de la API
              console.error('Error en la respuesta de la API:', response);
              this.snackBar.open(`Error al actualizar el subproceso: ${response?.glosa || response?.message || 'Error desconocido'}`, 'Cerrar', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
            }
          }),
          catchError((error: Error) => {
            console.error('Error al actualizar el subproceso:', error);
            this.snackBar.open(`Error al actualizar el subproceso: ${error.message || 'Error de comunicación con el servidor'}`, 'Cerrar', {
              duration: 5000, // Mayor duración para mensajes de error
              panelClass: ['error-snackbar']
            });
            return of(null);
          }),
          finalize(() => {
            this.isLoadingSubprocesos = false;
          })
        )
        .subscribe();
    } else {
      // Agregamos un nuevo subproceso
      const newSubprocessData = {
        codigo: subprocessCode,
        nombre: subprocessName
      };

      console.log('📤 ENVIANDO DATOS PARA CREACIÓN DE NUEVO SUBPROCESO:', {
        método: 'addSubproceso',
        endpoint: '/ws/EtapaConstructivaSvcImpl.php',
        caso: 'CreaSubProceso',
        idEtapaConstructiva: this.selectedEtapaId,
        idSubProceso: 0, // Para nuevos registros siempre es 0
        codigo: subprocessCode,
        nombre: subprocessName,
        datos_completos: newSubprocessData
      });
      
      this.subParametroService.addSubproceso(newSubprocessData, this.selectedEtapaId)
        .pipe(
          map((response: { success?: boolean; message?: string; data?: any; glosa?: string }) => {
            console.log('📥 RESPUESTA DE CREACIÓN DE SUBPROCESO:', response);
            
            if (response && response.success) {
              // Éxito en la creación
              // Forzamos la recarga desde la API para obtener el nuevo subproceso con su ID
              this.loadSubprocessesByEtapa(this.selectedEtapaId as string, true);
              
              this.snackBar.open(`Subproceso "${subprocessName}" agregado correctamente`, 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              
              this.resetSubprocessForm();
            } else {
              // Error en la respuesta de la API
              console.error('Error en la respuesta de la API:', response);
              this.snackBar.open(`Error al agregar el subproceso: ${response?.glosa || response?.message || 'Error desconocido'}`, 'Cerrar', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
            }
          }),
          catchError((error: Error) => {
            console.error('Error al agregar el subproceso:', error);
            this.snackBar.open(`Error al agregar el subproceso: ${error.message || 'Error de comunicación con el servidor'}`, 'Cerrar', {
              duration: 5000, // Mayor duración para mensajes de error
              panelClass: ['error-snackbar']
            });
            return of(null);
          }),
          finalize(() => {
            this.isLoadingSubprocesos = false;
          })
        )
        .subscribe();
    }
  }

  /**
   * Prepara el formulario para editar un subproceso
   */
  editSubprocess(subprocess: SubprocesoItem): void {
    this.editingSubprocess = true;
    this.editingSubprocessId = subprocess.idSubproceso || null;
    this.newSubprocessCode = subprocess.codigo || '';
    this.newSubprocessName = subprocess.nombre || '';
  }

  /**
   * Elimina un subproceso
   */
  deleteSubprocess(subprocess: SubprocesoItem): void {
    if (!subprocess.idSubproceso || !this.selectedEtapaId) return;

    this.isLoadingSubprocesos = true;
    
    this.subParametroService.deleteSubproceso(subprocess.idSubproceso)
      .pipe(
        map(() => {
          // Eliminamos el subproceso del caché
          if (this.selectedEtapaId && this.subprocessesByEtapa[this.selectedEtapaId]) {
            this.subprocessesByEtapa[this.selectedEtapaId] = 
              this.subprocessesByEtapa[this.selectedEtapaId].filter(s => 
                s.idSubproceso !== subprocess.idSubproceso);
            this.filteredSubprocesos = [...this.subprocessesByEtapa[this.selectedEtapaId]];
          }
        }),
        catchError((error: Error) => {
          console.error('Error al eliminar el subproceso:', error);
          return of(null);
        }),
        finalize(() => {
          this.isLoadingSubprocesos = false;
        })
      )
      .subscribe();
  }

  /**
   * Maneja las acciones de la tabla de subprocesos
   */
  handleSubprocessTableAction(data: { action: string; item: SubprocesoItem; index: number }): void {
    const { action, item } = data;
    
    switch (action) {
      case 'edit':
        this.editSubprocess(item);
        break;
      case 'delete':
        this.deleteSubprocess(item);
        break;
      default:
        console.warn(`Acción no manejada: ${action}`);
    }
  }

  /**
   * Filtra los subprocesos según el texto de búsqueda
   */
  onSearchSubprocesses(): void {
    if (!this.selectedEtapaId || !this.subprocessesByEtapa[this.selectedEtapaId]) {
      this.filteredSubprocesos = [];
      return;
    }
    
    const searchKeyLower = this.subprocessSearchKey.toLowerCase().trim();
    
    if (!searchKeyLower) {
      // Si no hay texto de búsqueda, mostramos todos los subprocesos
      this.filteredSubprocesos = [...this.subprocessesByEtapa[this.selectedEtapaId]];
      return;
    }
    
    // Filtramos los subprocesos que coincidan con el texto de búsqueda
    this.filteredSubprocesos = this.subprocessesByEtapa[this.selectedEtapaId].filter(subprocess => {
      const codigo = subprocess.codigo || '';
      const nombre = subprocess.nombre || '';
      return codigo.toLowerCase().includes(searchKeyLower) || 
             nombre.toLowerCase().includes(searchKeyLower);
    });
  }

  /**
   * Resetea el formulario de subprocesos y campos de búsqueda
   */
  resetSubprocessForm(): void {
    this.newSubprocessCode = '';
    this.newSubprocessName = '';
    this.editingSubprocess = false;
    this.editingSubprocessId = null;
    this.subprocessSearchKey = '';
  }

  /**
   * Cancela la edición de un subproceso
   */
  cancelEditSubprocess(): void {
    this.resetSubprocessForm();
  }
}

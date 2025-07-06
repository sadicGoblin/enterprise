import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../../../shared/controls/custom-select/custom-select.component';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, catchError, finalize, map, of } from 'rxjs';
import { DataTableComponent } from '../../../../../../../shared/components/data-table/data-table.component';
import { SubParametroService, EtapaConstructivaItem, SubprocesoItem } from '../../../../../services/sub-parametro.service';
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
    CustomSelectComponent,
    ReactiveFormsModule,
    DataTableComponent
  ],
  templateUrl: './subprocesses.component.html',
  styleUrls: ['./subprocesses.component.scss']
})

export class SubprocessesComponent implements OnInit {
  
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
    private proxyService: ProxyService
  ) {}

  ngOnInit(): void {
    // Cargar las etapas constructivas disponibles
    this.loadEtapasConstructivas();
  }

  /**
   * Carga todas las etapas constructivas disponibles
   */
  loadEtapasConstructivas(): void {
    this.isLoadingSubprocesos = true;
    
    this.subParametroService.getEtapasConstructivas()
      .pipe(
        map((response: EtapaConstructivaItem[]) => {
          this.etapasConstructivasList = response;
          console.log("etapasConstructivasList", this.etapasConstructivasList);
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
    const etapaId = event?.value || '';
    if (!etapaId) {
      this.filteredSubprocesos = [];
      this.selectedEtapaId = null;
      this.resetSubprocessForm();
      return;
    }
    this.selectedEtapaId = etapaId;
    this.loadSubprocessesByEtapa(etapaId);
    this.resetSubprocessForm();
  }

  /**
   * Carga los subprocesos por etapa constructiva
   */
  loadSubprocessesByEtapa(etapaId: string): void {
    if (!etapaId) return;

    this.isLoadingSubprocesos = true;

    // Si ya tenemos los subprocesos cargados para esta etapa, usamos el caché
    if (this.subprocessesByEtapa[etapaId]) {
      this.filteredSubprocesos = [...this.subprocessesByEtapa[etapaId]];
      this.isLoadingSubprocesos = false;
      return;
    }

    // Convertir el ID a número para la API
    const etapaIdNum = parseInt(etapaId, 10);
    
    this.subParametroService.getSubprocesosPorEtapa(etapaIdNum)
      .pipe(
        map((response: SubprocesoItem[]) => {
          // Guardamos en caché
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
      return;
    }
    
    const subprocessCode = this.newSubprocessCode.trim();
    const subprocessName = this.newSubprocessName.trim();
    
    if (!subprocessCode || !subprocessName) {
      console.error('Código y nombre de subproceso son requeridos');
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
      
      this.subParametroService.updateSubproceso(subprocessToUpdate)
        .pipe(
          map((response: { success?: boolean; message?: string; data?: any }) => {
            // Actualizamos el subproceso en el caché
            if (this.selectedEtapaId && this.subprocessesByEtapa[this.selectedEtapaId]) {
              const subprocessIndex = this.subprocessesByEtapa[this.selectedEtapaId]
                .findIndex(s => s.idSubproceso === this.editingSubprocessId);
              
              if (subprocessIndex !== -1) {
                this.subprocessesByEtapa[this.selectedEtapaId][subprocessIndex] = {
                  ...this.subprocessesByEtapa[this.selectedEtapaId][subprocessIndex],
                  codigo: subprocessCode,
                  nombre: subprocessName
                };
                
                this.filteredSubprocesos = [...this.subprocessesByEtapa[this.selectedEtapaId]];
              }
            }
            
            this.resetSubprocessForm();
          }),
          catchError((error: Error) => {
            console.error('Error al actualizar el subproceso:', error);
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
      
      if (!this.selectedEtapaId) {
        console.error('No se ha seleccionado una etapa constructiva');
        this.isLoadingSubprocesos = false;
        return;
      }
      
      this.subParametroService.addSubproceso(newSubprocessData, this.selectedEtapaId)
        .pipe(
          map((response: { success?: boolean; message?: string; data?: any }) => {
            // Recargamos los subprocesos para obtener el nuevo subproceso con su ID
            this.loadSubprocessesByEtapa(this.selectedEtapaId as string);
            this.resetSubprocessForm();
          }),
          catchError((error: Error) => {
            console.error('Error al agregar el subproceso:', error);
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
   * Resetea el formulario de subprocesos
   */
  resetSubprocessForm(): void {
    this.newSubprocessCode = '';
    this.newSubprocessName = '';
    this.editingSubprocess = false;
    this.editingSubprocessId = null;
  }

  /**
   * Cancela la edición de un subproceso
   */
  cancelEditSubprocess(): void {
    this.resetSubprocessForm();
  }
}

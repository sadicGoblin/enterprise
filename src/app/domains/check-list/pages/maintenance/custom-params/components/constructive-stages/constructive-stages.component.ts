import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../../../shared/controls/custom-select/custom-select.component';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, catchError, finalize, map, of } from 'rxjs';
import { DataTableComponent } from '../../../../../../../shared/components/data-table/data-table.component';
import { SubParametroService, EtapaConstructivaItem } from '../../../../../services/sub-parametro.service';
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
  selector: 'app-constructive-stages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CustomSelectComponent,
    ReactiveFormsModule,
    DataTableComponent
  ],
  templateUrl: './constructive-stages.component.html',
  styleUrls: ['./constructive-stages.component.scss']
})


export class ConstructiveStagesComponent implements OnInit {
  
  // Props para el Custom Select de Proyecto
  projectControl: FormControl = new FormControl('', Validators.required);
  projectParameterType = ParameterType.OBRA;
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectOptionValue = 'IdObra';
  projectOptionLabel = 'Obra';

  // Props para las etapas constructivas
  isLoadingStages: boolean = false;
  newStageCode: string = '';
  newStageName: string = '';
  editingStage: boolean = false;
  editingStageId: string | null = null;
  stageSearchKey: string = '';
  stagesByProject: Record<string, EtapaConstructivaItem[]> = {};
  filteredStages: EtapaConstructivaItem[] = [];
  selectedProjectId: string | null = null;

  // Props para la tabla de etapas
  stageTableColumns: TableColumn[] = [
    { name: 'codigo', label: 'Código' },
    { name: 'nombre', label: 'Nombre' }
  ];
  stageActionButtons: ActionButton[] = [
    { icon: 'edit', color: 'primary', tooltip: 'Editar', action: 'edit' },
    { icon: 'delete', color: 'warn', tooltip: 'Eliminar', action: 'delete' }
  ];
  stageTablePageSize = 10;
  stageTablePageSizeOptions = [5, 10, 25, 50];

  constructor(
    private subParametroService: SubParametroService,
    private proxyService: ProxyService
  ) {}

  projectApiCaso = 'Consulta';
  projectApiRequestBody!: ProjectApiRequestBody; // Will be initialized in ngOnInit 


  ngOnInit(): void {
    let userId = 0; // Default user ID
    if (typeof localStorage !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      console.log("user IDDDDDD", storedUserId)
      if (storedUserId) {
        const parsedUserId = parseInt(storedUserId, 10);
        if (!isNaN(parsedUserId)) {
          userId = parsedUserId;
        }
      }
    }
    this.projectApiRequestBody = {
      caso: this.projectApiCaso,
      idObra: 0,
      idUsuario: userId
    };
  }

  /**
   * Maneja el cambio de selección de proyecto
   */
  onProjectSelectionChange(event: { value: string } | null): void {
    const projectId = event?.value || '';
    if (!projectId) {
      this.filteredStages = [];
      this.selectedProjectId = null;
      this.resetStageForm();
      return;
    }
    this.selectedProjectId = projectId;
    this.loadStagesByProject(projectId);
    this.resetStageForm();
  }

  /**
   * Carga las etapas constructivas por proyecto
   */
  loadStagesByProject(projectId: string): void {
    if (!projectId) return;

    this.isLoadingStages = true;

    // Si ya tenemos las etapas cargadas para este proyecto, usamos el caché
    if (this.stagesByProject[projectId]) {
      this.filteredStages = [...this.stagesByProject[projectId]];
      this.isLoadingStages = false;
      return;
    }

    // Si no hay etapas cargadas para este proyecto, realizamos la llamada a la API para obtener todas las etapas constructivas
    // y filtramos por proyecto en el cliente
    this.subParametroService.getEtapasConstructivas()
      .pipe(
        map((response: EtapaConstructivaItem[]) => {
          // Filtramos las etapas por el proyecto seleccionado
          const stagesByProject = response.filter(stage => 
            stage.idObra === projectId
          );
          
          // Guardamos en caché
          this.stagesByProject[projectId] = stagesByProject;
          this.filteredStages = [...stagesByProject];
        }),
        catchError((error: Error) => {
          console.error('Error al cargar etapas constructivas:', error);
          this.stagesByProject[projectId] = [];
          this.filteredStages = [];
          return of(null);
        }),
        finalize(() => {
          this.isLoadingStages = false;
        })
      )
      .subscribe();
  }

  /**
   * Agrega o actualiza una etapa constructiva
   * @returns void
   */
  addStage(): void {
    if (!this.selectedProjectId) {
      console.error('No project selected');
      return;
    }
    
    const stageCode = this.newStageCode.trim();
    const stageName = this.newStageName.trim();
    
    if (!stageCode || !stageName) {
      console.error('Stage code and name are required');
      return;
    }
    
    this.isLoadingStages = true;
    
    if (this.editingStage && this.editingStageId) {
      // Actualizamos una etapa existente
      const stageToUpdate: EtapaConstructivaItem = {
        idEtapaConstructiva: this.editingStageId,
        codigo: stageCode,
        nombre: stageName,
        idObra: this.selectedProjectId
      };
      
      this.subParametroService.updateEtapaConstructiva(stageToUpdate)
        .pipe(
          map((response: { success?: boolean; message?: string; data?: any }) => {
            // Actualizamos la etapa en el caché
            if (this.selectedProjectId && this.stagesByProject[this.selectedProjectId]) {
              const stageIndex = this.stagesByProject[this.selectedProjectId]
                .findIndex(s => s.idEtapaConstructiva === this.editingStageId);
              
              if (stageIndex !== -1) {
                this.stagesByProject[this.selectedProjectId][stageIndex] = {
                  ...this.stagesByProject[this.selectedProjectId][stageIndex],
                  codigo: stageCode,
                  nombre: stageName
                };
                
                this.filteredStages = [...this.stagesByProject[this.selectedProjectId]];
              }
            }
            
            this.resetStageForm();
          }),
          catchError((error: Error) => {
            console.error('Error al actualizar la etapa constructiva:', error);
            return of(null);
          }),
          finalize(() => {
            this.isLoadingStages = false;
          })
        )
        .subscribe();
    } else {
      // Agregamos una nueva etapa
      const newStageData = {
        codigo: stageCode,
        nombre: stageName
      };
      
      if (!this.selectedProjectId) {
        console.error('No project selected');
        this.isLoadingStages = false;
        return;
      }
      
      this.subParametroService.addEtapaConstructiva(newStageData, this.selectedProjectId)
        .pipe(
          map((response: { success?: boolean; message?: string; data?: any }) => {
            // Recargamos las etapas para obtener la nueva etapa con su ID
            this.loadStagesByProject(this.selectedProjectId as string);
            this.resetStageForm();
          }),
          catchError((error: Error) => {
            console.error('Error al agregar la etapa constructiva:', error);
            return of(null);
          }),
          finalize(() => {
            this.isLoadingStages = false;
          })
        )
        .subscribe();
    }
  }

  /**
   * Prepara el formulario para editar una etapa
   */
  editStage(stage: EtapaConstructivaItem): void {
    this.editingStage = true;
    this.editingStageId = stage.idEtapaConstructiva || null;
    this.newStageCode = stage.codigo || '';
    this.newStageName = stage.nombre || '';
  }
  
  /**
   * Elimina una etapa constructiva
   */
  deleteStage(stage: EtapaConstructivaItem): void {
    if (!stage.idEtapaConstructiva || !this.selectedProjectId) return;

    this.isLoadingStages = true;
    
    this.subParametroService.deleteEtapaConstructiva(stage.idEtapaConstructiva)
      .pipe(
        map(() => {
          // Eliminamos la etapa del caché
          if (this.selectedProjectId && this.stagesByProject[this.selectedProjectId]) {
            this.stagesByProject[this.selectedProjectId] = 
              this.stagesByProject[this.selectedProjectId].filter(s => 
                s.idEtapaConstructiva !== stage.idEtapaConstructiva);
            this.filteredStages = [...this.stagesByProject[this.selectedProjectId]];
          }
        }),
        catchError((error: Error) => {
          console.error('Error al eliminar la etapa constructiva:', error);
          return of(null);
        }),
        finalize(() => {
          this.isLoadingStages = false;
        })
      )
      .subscribe();
  }

  /**
   * Maneja las acciones de la tabla de etapas
   */
  handleStageTableAction(data: { action: string; row: EtapaConstructivaItem }): void {
    const { action, row } = data;
    
    switch (action) {
      case 'edit':
        this.editStage(row);
        break;
      case 'delete':
        this.deleteStage(row);
        break;
      default:
        console.warn(`Acción no manejada: ${action}`);
    }
  }

  /**
   * Filtra las etapas según el texto de búsqueda
   */
  onSearchStages(): void {
    if (!this.selectedProjectId || !this.stagesByProject[this.selectedProjectId]) {
      this.filteredStages = [];
      return;
    }
    
    const searchKeyLower = this.stageSearchKey.toLowerCase().trim();
    
    if (!searchKeyLower) {
      // Si no hay texto de búsqueda, mostramos todas las etapas
      this.filteredStages = [...this.stagesByProject[this.selectedProjectId]];
      return;
    }
    
    // Filtramos las etapas que coincidan con el texto de búsqueda
    this.filteredStages = this.stagesByProject[this.selectedProjectId].filter(stage => {
      const codigo = stage.codigo || '';
      const nombre = stage.nombre || '';
      return codigo.toLowerCase().includes(searchKeyLower) || 
             nombre.toLowerCase().includes(searchKeyLower);
    });
  }

  /**
   * Resetea el formulario de etapas
   */
  resetStageForm(): void {
    this.newStageCode = '';
    this.newStageName = '';
    this.editingStage = false;
    this.editingStageId = null;
  }

  /**
   * Cancela la edición de una etapa
   */
  cancelEditStage(): void {
    this.resetStageForm();
  }
}

interface ProjectApiRequestBody {
  caso: string;
  idObra: number;
  idUsuario: number;
}


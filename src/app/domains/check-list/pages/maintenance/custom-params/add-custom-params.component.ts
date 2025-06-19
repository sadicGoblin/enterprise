import { Component, OnInit } from '@angular/core'; // Import OnInit
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, catchError, map, of } from 'rxjs';

import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../shared/controls/custom-select/custom-select.component';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { SubParametroService, EtapaConstructivaItem, SubprocesoItem, AmbitoItem } from '../../../services/sub-parametro.service';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

// Define interfaces locally as they are not exported from the DataTableComponent
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
  selector: 'app-add-custom-params',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule, // Re-added for other tabs still using mat-table
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    // MatPaginatorModule, // Still removed as other tables don't seem to use it
    CustomSelectComponent,
    ReactiveFormsModule,
    DataTableComponent, // Ensured DataTableComponent is here
  ],
  templateUrl: './add-custom-params.component.html',
  styleUrls: ['./add-custom-params.component.scss'],
})
export class AddCustomParamsComponent implements OnInit {
  // Configuration for DataTableComponent (Stages)
  stageTablePageSize = 5;
  stageTablePageSizeOptions: number[] = [5, 10, 25, 100]; // DataTableComponent uses number[] for pageSizeOptions
  stageTableColumns: TableColumn[] = [
    { name: 'codigo', label: 'Código', cssClass: 'small-cell' },
    { name: 'nombre', label: 'Nombre', cssClass: 'large-cell' },
  ];
  stageActionButtons = [
    { icon: 'edit', color: 'accent', tooltip: 'Editar', action: 'editStageAction' },
    { icon: 'delete', color: 'warn', tooltip: 'Eliminar', action: 'deleteStageAction' }
  ];
  allStagesData: EtapaConstructivaItem[] = []; // Holds all stages from API for the selected project
  filteredStages: EtapaConstructivaItem[] = []; // Holds stages after search filter
  stageSearchKey: string = '';
  isLoadingStages = false;
  constructor(private subParametroService: SubParametroService) {} // Inject service
  // Properties for Project app-custom-select
  projectControl = new FormControl(null, [Validators.required]);

  projectApiEndpoint = '/ws/ObrasSvcImpl.php'; // Make path relative for proxy
  projectApiCaso = 'Consulta';
  projectApiRequestBody!: ProjectApiRequestBody; // Will be initialized in ngOnInit 
  projectOptionValue = 'IdObra';
  projectOptionLabel = 'Obra';
  projectParameterType = ParameterType.OBRA;

  // Properties for E. Constructiva app-custom-select (Sub-procesos Tab)
  etapaConstructivaControl = new FormControl({ value: null, disabled: true }, [Validators.required]);
  etapasParaSubprocesoSelect: SelectOption[] = [];

  // Properties for Sub-procesos Tab
  selectedEtapaId: number | null = null;
  allSubprocesosData: SubprocesoItem[] = [];
  filteredSubprocesosData: SubprocesoItem[] = [];
  isLoadingSubprocesos = false;
  subprocesoSearchValue: string = '';
  newSubprocessCode: string = '';
  newSubprocessName: string = '';
  
  // Properties for Ambitos Tab
  ambitosTableColumns: TableColumn[] = [
    { name: 'codigo', label: 'Código', cssClass: 'small-cell' },
    { name: 'nombre', label: 'Nombre', cssClass: 'large-cell' },
  ];
  ambitosActionButtons: ActionButton[] = [
    { icon: 'edit', color: 'accent', tooltip: 'Editar', action: 'editAmbitoAction' },
    { icon: 'delete', color: 'warn', tooltip: 'Eliminar', action: 'deleteAmbitoAction' }
  ];
  ambitosTablePageSize = 5;
  ambitosTablePageSizeOptions: number[] = [5, 10, 25, 100];
  allAmbitosData: AmbitoItem[] = [];
  filteredAmbitosData: AmbitoItem[] = [];
  isLoadingAmbitos = false;
  ambitoSearchValue: string = '';
  newAmbitoCode: string = '';
  newAmbitoName: string = '';
  editingAmbito: AmbitoItem | null = null;
  editingSubproceso: SubprocesoItem | null = null;

  subprocesoTableColumns: TableColumn[] = [
    { name: 'codigo', label: 'Código', cssClass: 'small-cell' },
    { name: 'nombre', label: 'Nombre', cssClass: 'large-cell' },
  ];

  subprocesoActionButtons: ActionButton[] = [
    { icon: 'edit', color: 'primary', tooltip: 'Editar Sub-proceso', action: 'edit' },
    { icon: 'delete', color: 'warn', tooltip: 'Eliminar Sub-proceso', action: 'delete' },
  ];
  // You can create a form group for adding new sub-processes later for better validation


  ngOnInit(): void {
    let userId = 0; // Default user ID
    if (typeof localStorage !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        const parsedUserId = parseInt(storedUserId, 10);
        if (!isNaN(parsedUserId)) {
          userId = parsedUserId;
        }
      }
    }
    this.projectApiRequestBody = {
      caso: this.projectApiCaso,
      idObra: 0, // For fetching all projects
      idUsuario: userId
    };
    
    // Load Ambitos data on component initialization
    this.loadAmbitos();
  }
  
  // Ambitos Tab Methods
  loadAmbitos(): void {
    console.log('[AddCustomParamsComponent] Starting to load Ambitos data');
    this.isLoadingAmbitos = true;
    this.allAmbitosData = [];
    this.filteredAmbitosData = [];
    
    this.subParametroService.getAmbitos().subscribe({
      next: (ambitos: AmbitoItem[]) => {
        console.log('[AddCustomParamsComponent] Ambitos loaded successfully:', ambitos);
        if (ambitos && ambitos.length > 0) {
          console.log('[AddCustomParamsComponent] First ambito item:', ambitos[0]);
          this.allAmbitosData = ambitos;
          this.applyAmbitoSearchFilter();
        } else {
          console.warn('[AddCustomParamsComponent] Ambitos array is empty');
          // For testing, add some mock data if API returns empty
          this.allAmbitosData = [
            { IdAmbito: '1', codigo: '100', nombre: 'SALUD OCUPACIONAL' },
            { IdAmbito: '3', codigo: '200', nombre: 'SEGURIDAD' },
            { IdAmbito: '4', codigo: '300', nombre: 'MEDIO AMBIENTE' },
            { IdAmbito: '8', codigo: '400', nombre: 'INTEGRADO' }
          ];
          this.applyAmbitoSearchFilter();
        }
        this.isLoadingAmbitos = false;
      },
      error: (err: any) => {
        console.error('[AddCustomParamsComponent] Error loading ambitos:', err);
        this.isLoadingAmbitos = false;
        
        // For testing, add some mock data if API fails
        console.log('[AddCustomParamsComponent] Using mock data due to API error');
        this.allAmbitosData = [
          { IdAmbito: '1', codigo: '100', nombre: 'SALUD OCUPACIONAL' },
          { IdAmbito: '3', codigo: '200', nombre: 'SEGURIDAD' },
          { IdAmbito: '4', codigo: '300', nombre: 'MEDIO AMBIENTE' },
          { IdAmbito: '8', codigo: '400', nombre: 'INTEGRADO' }
        ];
        this.applyAmbitoSearchFilter();
      }
    });
  }

  onSearchAmbitos(event: Event): void {
    this.ambitoSearchValue = (event.target as HTMLInputElement).value;
    this.applyAmbitoSearchFilter();
  }

  applyAmbitoSearchFilter(): void {
    if (!this.ambitoSearchValue) {
      this.filteredAmbitosData = [...this.allAmbitosData];
    } else {
      const searchKeyLower = this.ambitoSearchValue.toLowerCase();
      this.filteredAmbitosData = this.allAmbitosData.filter(ambito =>
        ambito.nombre.toLowerCase().includes(searchKeyLower) ||
        ambito.codigo.toLowerCase().includes(searchKeyLower)
      );
    }

    // Update pageSizeOptions for DataTableComponent
    const defaultOptions = [5, 10, 25, 100];
    let newPageSizeOptions = Array.from(new Set([...defaultOptions, this.filteredAmbitosData.length])).sort((a, b) => a - b);
    if (this.filteredAmbitosData.length === 0) {
      newPageSizeOptions = [5, 10, 25, 50];
    }
    this.ambitosTablePageSizeOptions = newPageSizeOptions.filter(op => op > 0);

    // Adjust ambitosTablePageSize if needed
    if (this.ambitosTablePageSize > this.filteredAmbitosData.length && this.filteredAmbitosData.length > 0) {
      this.ambitosTablePageSize = this.filteredAmbitosData.length;
    } else if (this.filteredAmbitosData.length === 0) {
      this.ambitosTablePageSize = 5;
    } else if (this.ambitosTablePageSize === 0 && this.filteredAmbitosData.length > 0) {
      this.ambitosTablePageSize = Math.min(...this.ambitosTablePageSizeOptions.filter(op => op > 0));
    }
  }

  handleAmbitoTableAction(event: { action: string, item: AmbitoItem, index: number }): void {
    switch (event.action) {
      case 'editAmbitoAction':
        this.editAmbito(event.item);
        break;
      case 'deleteAmbitoAction':
        this.deleteAmbito(event.item);
        break;
    }
  }

  editAmbito(ambitoToEdit: AmbitoItem): void {
    this.editingAmbito = ambitoToEdit;
    this.newAmbitoCode = ambitoToEdit.codigo;
    this.newAmbitoName = ambitoToEdit.nombre;
  }

  deleteAmbito(ambitoToDelete: AmbitoItem): void {
    // This would normally call an API to delete the ambito
    // For now, just remove it from the local array
    console.log('[AddCustomParamsComponent] Delete ambito:', ambitoToDelete);
    this.allAmbitosData = this.allAmbitosData.filter(a => a.IdAmbito !== ambitoToDelete.IdAmbito);
    this.applyAmbitoSearchFilter();
  }

  addAmbito(): void {
    // This would normally call an API to add or update an ambito
    // For now, just add it to the local array
    if (this.editingAmbito) {
      // Update existing ambito
      const index = this.allAmbitosData.findIndex(a => a.IdAmbito === this.editingAmbito!.IdAmbito);
      if (index !== -1) {
        this.allAmbitosData[index] = {
          ...this.editingAmbito,
          codigo: this.newAmbitoCode,
          nombre: this.newAmbitoName
        };
      }
      this.editingAmbito = null;
    } else {
      // Add new ambito (with a mock ID)
      const newId = Math.max(0, ...this.allAmbitosData.map(a => parseInt(a.IdAmbito, 10))) + 1;
      this.allAmbitosData.push({
        IdAmbito: newId.toString(),
        codigo: this.newAmbitoCode,
        nombre: this.newAmbitoName
      });
    }
    
    // Reset form
    this.newAmbitoCode = '';
    this.newAmbitoName = '';
    this.applyAmbitoSearchFilter();
  }

  cancelEditAmbito(): void {
    this.editingAmbito = null;
    this.newAmbitoCode = '';
    this.newAmbitoName = '';
  }

  selectedProjectId: string | null = null;
  newStageCode = '';
  newStageName = '';
  editingStage: EtapaConstructivaItem | null = null;

  selectedProjectIdSubprocess: string | null = null;

  // stagesByProject: Record<string, EtapaConstructivaItem[]> = {
  //   1: [
  //     { code: '2900', name: 'Aguas lluvias piso -1 obra gruesa' },
  //     { code: '14400', name: 'Aguas lluvias (piso 11 azotea - obra gruesa)' },
  //     { code: '1700', name: 'Aguas lluvias piso -2 (instalaciones)' },
  //     {
  //       code: '17000',
  //       name: 'Artefactos y accesorios sanitarios (piso 1 terminacion)',
  //     },
  //     {
  //       code: '15900',
  //       name: 'Artefactos y accesorios sanitarios (piso -1 terminacion)',
  //     },
  //     {
  //       code: '26900',
  //       name: 'Artefactos y accesorios sanitarios (piso 10 terminacion)',
  //     },
  //     {
  //       code: '18100',
  //       name: 'Artefactos y accesorios sanitarios (piso 2 terminacion)',
  //     },
  //   ],
  //   2: [{ code: '3100', name: 'Instalación eléctrica primer piso' }],
  // };

  subprocessesByProject: Record<string, { code: string; name: string }[]> = {
    1: [{ code: 'SP01', name: 'Hormigón losa piso 1' }],
    2: [{ code: 'SP02', name: 'Tabiquería estructural' }],
  };

  activityScopes = ['Safety', 'Quality', 'Environment'];
  frequencies = ['Daily', 'Weekly', 'Biweekly', 'Monthly'];
  activityCategories = ['Photo Evidence', 'Technical Report', 'Checklist'];
  associatedParameters = ['Parameter A', 'Parameter B', 'Parameter C'];
  associatedDocuments = ['Document X', 'Document Y', 'Document Z'];

  selectedScope: string = '';
  activityName = '';
  activityCode = '';
  activityFrequency = '';
  activityCategory = '';
  activityParameter = '';
  activityDocument = '';

  activities: {
    code: string;
    name: string;
    scope: string;
    frequency: string;
    category: string;
    parameter: string;
    document: string;
  }[] = [];

  displayedColumnsActivities = [
    'code',
    'name',
    'frequency',
    'category',
    'parameter',
    'document',
    'actions',
  ];

  addActivity() {
    if (
      !this.activityCode ||
      !this.activityName ||
      !this.selectedScope ||
      !this.activityFrequency ||
      !this.activityCategory ||
      !this.activityParameter ||
      !this.activityDocument
    )
      return;

    this.activities.push({
      code: this.activityCode,
      name: this.activityName,
      scope: this.selectedScope,
      frequency: this.activityFrequency,
      category: this.activityCategory,
      parameter: this.activityParameter,
      document: this.activityDocument,
    });

    this.activityCode = '';
    this.activityName = '';
    this.selectedScope = '';
    this.activityFrequency = '';
    this.activityCategory = '';
    this.activityParameter = '';
    this.activityDocument = '';
  }

  editActivity(index: number) {
    const a = this.activities[index];
    this.activityCode = a.code;
    this.activityName = a.name;
    this.selectedScope = a.scope;
    this.activityFrequency = a.frequency;
    this.activityCategory = a.category;
    this.activityParameter = a.parameter;
    this.activityDocument = a.document;
    this.deleteActivity(index);
  }

  deleteActivity(index: number) {
    this.activities.splice(index, 1);
  }

  saveActivity(){
    
  }

  selectedStages: { code: string; name: string }[] = []; // Direct source for the table

  // Property for the subprocesses table, using existing hardcoded data for now
  get selectedSubprocesses(): { code: string; name: string }[] {
    return this.selectedProjectIdSubprocess
      ? this.subprocessesByProject[this.selectedProjectIdSubprocess] || []
      : [];
  }

  addStage(): void {
    if (!this.selectedProjectId) {
      console.error('No project selected.');
      // TODO: Show user-friendly message
      return;
    }
    const stageCode = this.newStageCode.trim();
    const stageName = this.newStageName.trim();

    if (!stageName || !stageCode) {
      console.error('Stage Name and Code are required.');
      // TODO: Show user-friendly message
      return;
    }

    this.isLoadingStages = true;

    if (this.editingStage) {
      // Update existing stage
      const updatedStage: EtapaConstructivaItem = {
        ...this.editingStage,
        codigo: stageCode,
        nombre: stageName,
        idObra: this.selectedProjectId // Ensure idObra is correctly passed
      };

      this.subParametroService.updateEtapaConstructiva(updatedStage).subscribe({
        next: (response) => {
          console.log('Stage updated successfully via API:', response);
          // TODO: Show success message
          this.newStageName = '';
          this.newStageCode = '';
          this.editingStage = null;
          this.loadStagesForProject(); // Reload stages
        },
        error: (error) => {
          console.error('Error updating stage via API:', error);
          // TODO: Show error message
          this.isLoadingStages = false;
        }
      });
    } else {
      // Add new stage
      const stageData = { codigo: stageCode, nombre: stageName };
      this.subParametroService.addEtapaConstructiva(stageData, this.selectedProjectId).subscribe({
        next: (response) => {
          console.log('Stage added successfully via API:', response);
          // TODO: Show success message
          this.newStageName = '';
          this.newStageCode = '';
          this.loadStagesForProject(); // Reload stages
        },
        error: (error) => {
          console.error('Error adding stage via API:', error);
          // TODO: Show error message
          this.isLoadingStages = false;
        }
      });
    }
  }

  deleteStage(stageToDelete: EtapaConstructivaItem): void {
    if (!stageToDelete || !stageToDelete.idEtapaConstructiva) {
      console.error('Invalid stage data for deletion.');
      // TODO: Show user-friendly error
      return;
    }

    // Optional: Add a confirmation dialog here before deleting
    // if (!confirm(`¿Está seguro de que desea eliminar la etapa "${stageToDelete.nombre}"?`)) {
    //   return;
    // }

    this.isLoadingStages = true; // Show loading indicator
    this.subParametroService.deleteEtapaConstructiva(stageToDelete.idEtapaConstructiva).subscribe({
      next: (response) => {
        console.log('Stage deleted successfully via API:', response);
        // TODO: Show success message to user
        this.loadStagesForProject(); // Reload stages to reflect deletion
        // isLoadingStages will be set to false in loadStagesForProject
      },
      error: (error) => {
        console.error('Error deleting stage via API:', error);
        // TODO: Show error message to user
        this.isLoadingStages = false; // Hide loading indicator on error
      }
    });
  }

  editStage(stageToEdit: EtapaConstructivaItem): void {
    console.log('Editing stage:', stageToEdit);
    this.editingStage = stageToEdit;
    this.newStageCode = stageToEdit.codigo;
    this.newStageName = stageToEdit.nombre;
    // Consider scrolling to the form or highlighting it
  }

  cancelEditStage(): void {
    this.editingStage = null;
    this.newStageCode = '';
    this.newStageName = '';
  }

  saveStages() {
    console.log('Stages saved:', this.selectedStages);
  }

  saveSubprocesses() {
    console.log('Subprocesses saved:', this.subprocessesByProject);
  }

  onEtapaConstructivaSelectionChange(selectedOption: SelectOption): void {
    if (selectedOption && selectedOption.value) {
      this.selectedEtapaId = Number(selectedOption.value);
      this.loadSubprocesosForEtapa();
    } else {
      this.selectedEtapaId = null;
      this.allSubprocesosData = [];
      this.applySubprocesoSearchFilter();
    }
  }

  loadSubprocesosForEtapa(): void {
    if (!this.selectedEtapaId) return;

    this.isLoadingSubprocesos = true;
    this.subParametroService.getSubprocesosPorEtapa(this.selectedEtapaId).subscribe({
      next: (subprocesos) => {
        this.allSubprocesosData = subprocesos;
        console.log(`Loaded subprocesos for etapa ${this.selectedEtapaId}:`, this.allSubprocesosData);
        this.applySubprocesoSearchFilter();
        this.isLoadingSubprocesos = false;
      },
      error: (err) => {
        console.error('Error loading subprocesos:', err);
        this.isLoadingSubprocesos = false;
        this.allSubprocesosData = [];
        this.applySubprocesoSearchFilter();
      }
    });
  }

  handleSubprocesoTableAction(event: { action: string; item: SubprocesoItem; index?: number }): void {
    console.log('Subproceso action:', event.action, 'Item:', event.item);
    switch (event.action) {
      case 'edit': // Corrected to match subprocesoActionButtons
        this.populateSubprocessFormForEdit(event.item);
        break;
      case 'delete': // Corrected to match subprocesoActionButtons
        this.deleteSubprocesoItem(event.item);
        break;
    }
  }

  populateSubprocessFormForEdit(item: SubprocesoItem): void {
    console.log('Populating form for subproceso edit:', item);
    this.editingSubproceso = item;
    this.newSubprocessCode = item.codigo;
    this.newSubprocessName = item.nombre;
    // Consider scrolling to the form or highlighting it
    console.log('Populated form for editing subprocess:', item, 'editingSubproceso set to:', this.editingSubproceso);
  }

  deleteSubprocesoItem(itemToDelete: SubprocesoItem): void {
    if (!itemToDelete || !itemToDelete.idSubproceso) {
      console.error('Invalid subprocess data for deletion.');
      // TODO: Show user-friendly error
      return;
    }

    // Optional: Add a confirmation dialog here
    // if (!confirm(`¿Está seguro de que desea eliminar el subproceso "${itemToDelete.nombre}"?`)) {
    //   return;
    // }

    this.isLoadingSubprocesos = true;
    this.subParametroService.deleteSubproceso(itemToDelete.idSubproceso).subscribe({
      next: (response) => {
        console.log('Subprocess deleted successfully via API:', response);
        // TODO: Show success message
        if (this.selectedEtapaId) {
          this.loadSubprocesosForEtapa(); // Reload subprocesses for the current stage
        }
      },
      error: (error) => {
        console.error('Error deleting subprocess via API:', error);
        // TODO: Show error message
        this.isLoadingSubprocesos = false;
      }
    });
  }

  addSubproceso(): void {
    if (!this.selectedEtapaId) {
      console.error('No stage selected to add or update subprocess.');
      // TODO: Show user-friendly message
      return;
    }
    const subprocessCode = this.newSubprocessCode.trim();
    const subprocessName = this.newSubprocessName.trim();

    if (!subprocessCode || !subprocessName) {
      console.error('Subprocess Code and Name are required.');
      // TODO: Show user-friendly message
      return;
    }

    this.isLoadingSubprocesos = true;

    if (this.editingSubproceso) {
      // Update existing subprocess
      const updatedSubproceso: SubprocesoItem = {
        ...this.editingSubproceso,
        codigo: subprocessCode,
        nombre: subprocessName,
        // idEtapaConstructiva is already part of editingSubproceso and shouldn't change here
      };
      this.subParametroService.updateSubproceso(updatedSubproceso).subscribe({
        next: (response) => {
          console.log('Subprocess updated successfully via API:', response);
          // TODO: Show success message
          this.newSubprocessCode = '';
          this.newSubprocessName = '';
          this.editingSubproceso = null;
          if (this.selectedEtapaId) {
            this.loadSubprocesosForEtapa();
          }
        },
        error: (error) => {
          console.error('Error updating subprocess via API:', error);
          // TODO: Show error message
          this.isLoadingSubprocesos = false;
        }
      });
    } else {
      // Add new subprocess
      const subprocessData = { codigo: subprocessCode, nombre: subprocessName };
      this.subParametroService.addSubproceso(subprocessData, String(this.selectedEtapaId!)).subscribe({
        next: (response) => {
          console.log('Subprocess added successfully via API:', response);
          // TODO: Show success message
          this.newSubprocessCode = '';
          this.newSubprocessName = '';
          if (this.selectedEtapaId) {
            this.loadSubprocesosForEtapa();
          }
        },
        error: (error) => {
          console.error('Error adding subprocess via API:', error);
          // TODO: Show error message
          this.isLoadingSubprocesos = false;
        }
      });
    }
  }

  cancelEditSubproceso(): void {
    this.editingSubproceso = null;
    this.newSubprocessCode = '';
    this.newSubprocessName = '';
    console.log('Subprocess edit cancelled.');
  }

  applySubprocesoSearchFilter(): void {
    if (!this.subprocesoSearchValue) {
      this.filteredSubprocesosData = [...this.allSubprocesosData];
    } else {
      const filterValue = this.subprocesoSearchValue.toLowerCase();
      this.filteredSubprocesosData = this.allSubprocesosData.filter(item =>
        item.nombre.toLowerCase().includes(filterValue) ||
        item.codigo.toLowerCase().includes(filterValue)
      );
    }
    // Here you would update the data source for the new table
    // For now, we just log it.
    console.log('Filtered subprocesos:', this.filteredSubprocesosData);
  }

  loadStagesForProject(): void {
    if (!this.selectedProjectId) {
      this.allStagesData = [];
      this.filteredStages = []; // Ensure filteredStages is also cleared
      this.applyStageSearchFilter();
      // Clear and disable E. Constructiva select if no project
      this.etapasParaSubprocesoSelect = [];
      this.etapaConstructivaControl.reset();
      this.etapaConstructivaControl.disable();
      // Clear sub-process data as well
      this.selectedEtapaId = null;
      this.allSubprocesosData = [];
      this.filteredSubprocesosData = [];
      return;
    }

    this.isLoadingStages = true;
    this.subParametroService.getEtapasConstructivas().subscribe({
      next: (etapas: EtapaConstructivaItem[]) => {
        this.allStagesData = etapas.filter(etapa => etapa.idObra === this.selectedProjectId);
        console.log(`Loaded and filtered stages for idObra ${this.selectedProjectId}:`, this.allStagesData);
        this.applyStageSearchFilter();

        if (this.allStagesData.length > 0) {
          const defaultOptions = [5, 10, 25, 100];
          const combinedOptions = new Set([...defaultOptions, this.allStagesData.length]);
          this.stageTablePageSizeOptions = Array.from(combinedOptions).filter(op => typeof op === 'number').sort((a, b) => a - b) as number[];
        } else {
          this.stageTablePageSizeOptions = [5, 10, 25, 100];
        }

        this.isLoadingStages = false;

        // Populate E. Constructiva select for Sub-procesos tab
        if (this.allStagesData && this.allStagesData.length > 0) {
          this.etapasParaSubprocesoSelect = this.allStagesData.map(etapa => ({
            value: etapa.idEtapaConstructiva,
            label: `${etapa.codigo} - ${etapa.nombre}` // Using detailed label
          }));
          this.etapaConstructivaControl.enable();
        } else {
          this.etapasParaSubprocesoSelect = [];
          this.etapaConstructivaControl.reset();
          this.etapaConstructivaControl.disable(); // Ensure it's disabled if no stages
        }
        // Reset sub-process selection when project changes and stages are reloaded
        this.etapaConstructivaControl.reset();
        this.selectedEtapaId = null;
        this.allSubprocesosData = [];
        this.filteredSubprocesosData = [];
      },
      error: (err) => {
        console.error(`Error loading stages for project ${this.selectedProjectId}:`, err);
        this.isLoadingStages = false;
        this.allStagesData = [];
        this.filteredStages = [];
        this.applyStageSearchFilter();
        this.etapasParaSubprocesoSelect = [];
        this.etapaConstructivaControl.reset();
        this.etapaConstructivaControl.disable();
        this.selectedEtapaId = null;
        this.allSubprocesosData = [];
        this.filteredSubprocesosData = [];
      }
    });
  }

  onProjectSelectionChange(selectedProject: SelectOption | null): void {
    if (selectedProject && selectedProject.value) {
      this.selectedProjectId = String(selectedProject.value);
      console.log('Project selected in Etapas:', this.selectedProjectId);
      this.loadStagesForProject(); // This will now also handle sub-process tab's E.Constructiva dropdown
    } else {
      console.log('Project cleared in Etapas');
      this.selectedProjectId = null;
      this.allStagesData = [];
      this.filteredStages = [];
      this.applyStageSearchFilter();

      // Clear and disable E. Constructiva dropdown in Sub-procesos tab
      this.etapasParaSubprocesoSelect = [];
      this.etapaConstructivaControl.reset();
      this.etapaConstructivaControl.disable();
      this.selectedEtapaId = null;
      this.allSubprocesosData = [];
      this.filteredSubprocesosData = [];
    }
  }

  // updatePagedStages(): void { // Removed, DataTableComponent handles its own pagination
  //   const startIndex = (this.currentPageStages - 1) * this.itemsPerPageStages;
  //   const endIndex = startIndex + this.itemsPerPageStages;
  //   this.pagedStages = this.filteredStages.slice(startIndex, endIndex);
  // }
    applyStageSearchFilter(): void {
    if (!this.stageSearchKey) {
      this.filteredStages = [...this.allStagesData];
    } else {
      const searchKeyLower = this.stageSearchKey.toLowerCase();
      this.filteredStages = this.allStagesData.filter(stage =>
        stage.nombre.toLowerCase().includes(searchKeyLower) ||
        stage.codigo.toLowerCase().includes(searchKeyLower)
      );
    }
    // DataTableComponent manages its own page state and data updates.

    // Update pageSizeOptions for DataTableComponent
    const defaultOptions = [5, 10, 25, 100]; // Match initial pageSizeOptions
    let newPageSizeOptions = Array.from(new Set([...defaultOptions, this.filteredStages.length])).sort((a, b) => a - b);
    if (this.filteredStages.length === 0) {
      newPageSizeOptions = [5, 10, 25, 50]; // Default if no data
    }
    this.stageTablePageSizeOptions = newPageSizeOptions.filter(op => op > 0); // Ensure no zero or negative options

    // Adjust stageTablePageSize if it was set to 'all' (i.e., > largest default option) and now exceeds the new total
    if (this.stageTablePageSize > this.filteredStages.length && this.filteredStages.length > 0) {
      this.stageTablePageSize = this.filteredStages.length;
    } else if (this.filteredStages.length === 0) {
      this.stageTablePageSize = 5; // Default page size if no data
    } else if (this.stageTablePageSize === 0 && this.filteredStages.length > 0) {
      this.stageTablePageSize = Math.min(...this.stageTablePageSizeOptions.filter(op => op > 0)); // Smallest valid option
    }
  }

  onSearchStages(event: Event): void {
    this.stageSearchKey = (event.target as HTMLInputElement).value;
    this.applyStageSearchFilter();
  }

  handleStageTableAction(event: { action: string, item: EtapaConstructivaItem, index: number }): void {
    switch (event.action) {
      case 'editStageAction':
        this.editStage(event.item);
        break;
      case 'deleteStageAction':
        this.deleteStage(event.item);
        break;
    }
  }

  // onStagePageChange(event: PageEvent): void { // Removed, DataTableComponent handles its own pagination events
  //   // Logic previously here is now handled by DataTableComponent or removed.
  // }
}

interface ProjectApiRequestBody {
  caso: string;
  idObra: number;
  idUsuario: number;
}



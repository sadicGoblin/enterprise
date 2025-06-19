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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../shared/controls/custom-select/custom-select.component';
import { SubParametroService, EtapaConstructivaItem } from '../../../services/sub-parametro.service'; // Import service and interface
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms'; // Added Validators

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
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    CustomSelectComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './add-custom-params.component.html',
  styleUrls: ['./add-custom-params.component.scss'],
})
export class AddCustomParamsComponent implements OnInit {
  // Pagination for Stages
  currentPageStages = 1;
  itemsPerPageStages = 5;
  pagedStages: { code: string; name: string }[] = [];
  stagePaginatorPageSizeOptions: number[] = [5, 10, 25, 100];
  allStagesData: { code: string; name: string }[] = []; // Holds all stages from API
  filteredStages: { code: string; name: string }[] = []; // Holds stages after search filter
  stageSearchKey: string = '';
  isLoadingStages = false;
  constructor(private subParametroService: SubParametroService) {} // Inject service
  // Properties for Project app-custom-select
  projectControl = new FormControl(null, [Validators.required]);
  subprocessProjectControl = new FormControl(null, [Validators.required]);
  projectApiEndpoint = '/ws/ObrasSvcImpl.php'; // Make path relative for proxy
  projectApiCaso = 'Consulta';
  projectApiRequestBody: any; // Will be initialized in ngOnInit 
  projectOptionValue = 'IdObra';
  projectOptionLabel = 'Obra';
  projectParameterType = ParameterType.OBRA;

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
  }

  selectedProjectId: string | null = null;
  newStageName = '';
  newStageCode = '';

  newSubprocessName = '';
  newSubprocessCode = '';
  selectedProjectIdSubprocess: string | null = null;

  // stagesByProject: Record<string, { code: string; name: string }[]> = {
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

  addStage() {
    if (!this.selectedProjectId || !this.newStageCode || !this.newStageName)
      return;

    const newStage = { code: this.newStageCode, name: this.newStageName };
    this.allStagesData.push(newStage);
    console.log('Added stage locally to allStagesData:', newStage);
    this.applyStageSearchFilter(); // Re-apply search and update pagination

    this.newStageCode = '';
    this.newStageName = '';
  }

  addSubprocess(): void {
    if (
      !this.selectedProjectIdSubprocess ||
      !this.newSubprocessCode ||
      !this.newSubprocessName
    )
      return;

    // Use subprocessesByProject here
    const list = this.subprocessesByProject[this.selectedProjectIdSubprocess] || [];
    list.push({ code: this.newSubprocessCode, name: this.newSubprocessName });
    this.subprocessesByProject[this.selectedProjectIdSubprocess] = list;

    this.newSubprocessCode = '';
    this.newSubprocessName = '';
  }

  deleteStage(index: number): void {
    if (this.selectedProjectId && index >= 0 && index < this.pagedStages.length) {
      const stageToDelete = this.pagedStages[index];
      const actualIndexInAllData = this.allStagesData.findIndex(s => s.code === stageToDelete.code && s.name === stageToDelete.name);
      if (actualIndexInAllData > -1) {
        const removedStage = this.allStagesData.splice(actualIndexInAllData, 1);
        console.log('Deleted stage from allStagesData:', removedStage);
        this.applyStageSearchFilter(); // Re-apply search and update pagination
      } else {
        console.warn('Could not find stage to delete in allStagesData:', stageToDelete);
      }
    }
  }

  editStage(index: number): void {
    const stageToEdit = this.pagedStages[index]; // Edit from the currently viewed page
    if (stageToEdit) {
      this.newStageCode = stageToEdit.code;
      this.newStageName = stageToEdit.name;
      console.log('Populated form fields for editing stage:', stageToEdit);
      // TODO: Implement actual update logic (e.g., mark for update, open dialog, etc.)
    }
  }

  deleteSubprocess(index: number): void {
    if (this.selectedProjectIdSubprocess && this.subprocessesByProject[this.selectedProjectIdSubprocess]) {
      const removedSubprocess = this.subprocessesByProject[this.selectedProjectIdSubprocess].splice(index, 1);
      console.log('Deleted subprocess locally:', removedSubprocess);
    }
  }

  editSubprocess(index: number): void {
    if (this.selectedProjectIdSubprocess && this.subprocessesByProject[this.selectedProjectIdSubprocess]) {
      const subprocessToEdit = this.subprocessesByProject[this.selectedProjectIdSubprocess][index];
      if (subprocessToEdit) {
        this.newSubprocessCode = subprocessToEdit.code;
        this.newSubprocessName = subprocessToEdit.name;
        console.log('Populated form fields for editing subprocess:', subprocessToEdit);
        // TODO: Implement actual update logic for subprocesses
      }
    }
  }

  saveStages() {
    console.log('Stages saved:', this.selectedStages);
  }

  saveSubprocesses() {
    console.log('Subprocesses saved:', this.subprocessesByProject);
  }

  stageColumns = ['code', 'name', 'actions'];
  subprocessColumns = ['code', 'name', 'actions'];

  onProjectSelectionChange(selectedOption: SelectOption): void {
    if (selectedOption && selectedOption.value !== null && selectedOption.value !== undefined) {
      this.selectedProjectId = String(selectedOption.value);
      console.log('Project selected:', this.selectedProjectId);
      this.loadStagesForProject();
    } else {
      this.selectedProjectId = null;
      this.selectedStages = []; // Clear stages if no project is selected
      console.log('Project selection cleared');
    }
  }

  loadStagesForProject(): void {
    if (!this.selectedProjectId) {
      this.allStagesData = [];
      this.applyStageSearchFilter();
      return;
    }
    // The API for Etapas Constructivas doesn't use selectedProjectId in request body, it uses idObra: 0
    // So, we call it directly without passing the selectedProjectId to the service method itself.
    // The service method getEtapasConstructivas already has idObra: 0 hardcoded in its request.
    this.isLoadingStages = true;
    this.subParametroService.getEtapasConstructivas().subscribe({
      next: (etapas: EtapaConstructivaItem[]) => {
        this.allStagesData = etapas.map(etapa => ({
          code: etapa.codigo,
          name: etapa.nombre
        }));
        console.log('Loaded all stages:', this.allStagesData);
        this.applyStageSearchFilter(); // Apply filter and update pagination

        if (this.allStagesData.length > 0) {
          const defaultOptions = [5, 10, 25, 100];
          // Use a Set to ensure uniqueness if selectedStages.length is already in defaultOptions
          const combinedOptions = new Set([...defaultOptions, this.allStagesData.length]);
          this.stagePaginatorPageSizeOptions = Array.from(combinedOptions).sort((a, b) => a - b);
        } else {
          this.stagePaginatorPageSizeOptions = [5, 10, 25, 100];
        }

        this.updatePagedStages(); // Update paged data before hiding spinner
        this.isLoadingStages = false;
      },
      error: (err) => {
        console.error('Error loading stages:', err);
        this.allStagesData = []; // Clear stages on error
        this.applyStageSearchFilter(); // Apply filter and update paged stages
        this.stagePaginatorPageSizeOptions = [5, 10, 25, 100]; // Reset options on error
        this.isLoadingStages = false;
      }
    });
  }

  onSubprocessProjectSelectionChange(selectedOption: SelectOption): void {
    if (selectedOption && selectedOption.value !== null && selectedOption.value !== undefined) {
      this.selectedProjectIdSubprocess = String(selectedOption.value);
      console.log('Subprocess Project selected:', this.selectedProjectIdSubprocess);
      // Any additional logic when a project is selected for subprocesses
    } else {
      this.selectedProjectIdSubprocess = null;
      // Clear dependent data if needed
    }
  }

  updatePagedStages(): void {
    const startIndex = (this.currentPageStages - 1) * this.itemsPerPageStages;
    const endIndex = startIndex + this.itemsPerPageStages;
    this.pagedStages = this.filteredStages.slice(startIndex, endIndex);
  }

  applyStageSearchFilter(): void {
    if (!this.stageSearchKey) {
      this.filteredStages = [...this.allStagesData];
    } else {
      const searchKeyLower = this.stageSearchKey.toLowerCase();
      this.filteredStages = this.allStagesData.filter(stage =>
        stage.name.toLowerCase().includes(searchKeyLower) ||
        stage.code.toLowerCase().includes(searchKeyLower)
      );
    }
    this.currentPageStages = 1; // Reset to first page after search
    this.updatePagedStages();
  }

  onSearchStages(event: Event): void {
    this.stageSearchKey = (event.target as HTMLInputElement).value;
    this.applyStageSearchFilter();
  }

  onStagePageChange(event: PageEvent): void {
    this.currentPageStages = event.pageIndex + 1;
    this.itemsPerPageStages = event.pageSize;
    this.updatePagedStages();
  }
}

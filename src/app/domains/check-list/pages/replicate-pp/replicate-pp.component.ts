import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CustomSelectComponent, ParameterType } from '../../../../shared/controls/custom-select/custom-select.component';
import { ProxyService } from '../../../../core/services/proxy.service';
import { CloningService, TaskItem, GetControlFilterResponse } from '../../services/cloning.service';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

@Component({
  selector: 'app-replicate-pp',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTableModule,
    MatTooltipModule,
    MatCheckboxModule,
    CustomSelectComponent
  ],
  templateUrl: './replicate-pp.component.html',
  styleUrl: './replicate-pp.component.scss'
})
export class ReplicatePpComponent implements OnInit {
  isLoading: boolean = false;
  message: string = '';
  
  // Make ParameterType available in template
  ParameterType = ParameterType;

  // Form controls
  obraControl = new FormControl<any>(null);
  usuarioControl = new FormControl<any>(null);
  periodoInicioControl = new FormControl<Date | null>(null);
  periodoFinControl = new FormControl<Date | null>(null);
  
  // Selected periods for month/year only
  selectedPeriodoOrigen: Date | null = null;
  selectedPeriodoDestino: Date | null = null;
  
  // Store full selected objects to access labels
  selectedObraObject: any = null;
  selectedUsuarioObject: any = null;
  
  // Task preview functionality
  userTasks: TaskItem[] = [];
  filteredTasks: TaskItem[] = [];
  selectedIdControls: string[] = []; // Array to track IdControl values for API
  showTasksTable: boolean = false;
  searchingTasks: boolean = false;
  
  // Table configuration
  displayedColumns: string[] = [
    'selection', 
    'actividad', 
    'etapaConst', 
    'subProceso', 
    'ambito', 
    'usuario'
  ];

  // API configurations for dropdowns (using working config from create-dashboard-pp)
  parameterTypeCustomApi = ParameterType.CUSTOM_API;
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectOptionValueKey = 'IdObra';
  projectOptionLabelKey = 'Obra';
  
  // RequestBody para la API
  projectApiRequestBody = {
    caso: 'Consulta',
    idObra: 0,
    idUsuario: '478' // Valor por defecto
  };

  // Usuario/Collaborator selection using custom select component (matching activity-planning)
  usuarioParameterType = ParameterType.CUSTOM_API;
  usuarioApiEndpoint = '/ws/UsuarioSvcImpl.php';
  usuarioApiRequestBody: { [key: string]: string | number } = {
    caso: 'ConsultaUsuariosObra',
    idObra: 0,
    idUsuario: 0
  };
  usuarioOptionValue = 'IdUsuario';
  usuarioOptionLabel = 'nombre';
  
  @ViewChild('usuarioSelect') usuarioSelect!: CustomSelectComponent;

  constructor(
    private proxyService: ProxyService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private cloningService: CloningService
  ) { }

  ngOnInit(): void {
    // Get user id from localStorage or default to 478
    const userId = localStorage.getItem('id_usuario') || '478';
    
    // Setup API request body with the user ID
    this.projectApiRequestBody = {
      caso: 'Consulta',
      idObra: 0,
      idUsuario: userId
    };
    
    // Set default period only for origen (current month) - removed auto-initialization of destino
    const now = new Date();
    this.selectedPeriodoOrigen = new Date(now.getFullYear(), now.getMonth(), 1);
    this.periodoInicioControl.setValue(this.selectedPeriodoOrigen);
    
    console.log('Default period origen set:', this.selectedPeriodoOrigen);
  }

  onObraSelectionChange(selectedObra: any): void {
    console.log('Obra seleccionada:', selectedObra);
    
    // Store the full selected object for display purposes
    this.selectedObraObject = selectedObra;
    
    // Enable usuario selection after project is selected
    if (selectedObra && this.usuarioSelect) {
      // Configure and enable the usuario select component
      this.usuarioSelect.isDisabled = false;
      this.usuarioSelect.customApiEndpoint = '/ws/UsuarioSvcImpl.php';
      
      // Update API request body with the correct parameters
      this.usuarioSelect.customApiRequestBody = {
        "caso": "ConsultaUsuariosObra",
        "idObra": Number(selectedObra.value) || 0,
        "idUsuario": 0
      };
      
      // Update mapping to match API response fields
      this.usuarioSelect.customOptionValueKey = 'IdUsuario';
      this.usuarioSelect.customOptionLabelKey = 'nombre';
      
      // Clear the selection
      this.usuarioSelect.writeValue(null);
      console.log('Usuario select enabled with project:', selectedObra.value);
      
      // Update component properties to match actual API settings
      this.usuarioApiRequestBody = this.usuarioSelect.customApiRequestBody;
      this.usuarioOptionValue = this.usuarioSelect.customOptionValueKey;
      this.usuarioOptionLabel = this.usuarioSelect.customOptionLabelKey;
      
      // Force the component to reload options with the new settings
      setTimeout(() => {
        if (this.usuarioSelect) {
          console.log('Triggering reload of usuario options with project ID:', selectedObra.value);
          this.usuarioSelect.reloadOptions();
        }
      }, 100);
    } else if (this.usuarioSelect) {
      // Disable if no project selected
      this.usuarioSelect.isDisabled = true;
      this.usuarioSelect.writeValue(null);
    }
  }

  onUsuarioSelectionChange(selectedUsuario: any): void {
    console.log('Usuario seleccionado:', selectedUsuario);
    
    // Store the full selected object for display purposes
    this.selectedUsuarioObject = selectedUsuario;
  }

  onPeriodoOrigenChange(date: Date | null): void {
    this.selectedPeriodoOrigen = date;
    console.log('Período Origen changed:', date);
    
    // Validate that origen is not after destino
    if (this.selectedPeriodoOrigen && this.selectedPeriodoDestino) {
      if (this.selectedPeriodoOrigen > this.selectedPeriodoDestino) {
        this.showMessage('El período origen no puede ser posterior al período destino');
        // Reset to previous valid value or default
        const now = new Date();
        this.selectedPeriodoOrigen = new Date(now.getFullYear(), now.getMonth(), 1);
        this.periodoInicioControl.setValue(this.selectedPeriodoOrigen);
      }
    }
  }
  
  onPeriodoDestinoChange(date: Date | null): void {
    this.selectedPeriodoDestino = date;
    console.log('Período Destino changed:', date);
    
    // Validate that destino is not before origen
    if (this.selectedPeriodoOrigen && this.selectedPeriodoDestino) {
      if (this.selectedPeriodoDestino < this.selectedPeriodoOrigen) {
        this.showMessage('El período destino no puede ser anterior al período origen');
        // Reset to previous valid value or default
        const now = new Date();
        this.selectedPeriodoDestino = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        this.periodoFinControl.setValue(this.selectedPeriodoDestino);
      }
    }
  }
  
  setMonthAndYearOrigen(date: Date, datepicker: any): void {
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), 1);
    this.selectedPeriodoOrigen = selectedDate;
    this.periodoInicioControl.setValue(selectedDate);
    this.onPeriodoOrigenChange(selectedDate);
    datepicker.close();
  }
  
  setMonthAndYearDestino(date: Date, datepicker: any): void {
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), 1);
    this.selectedPeriodoDestino = selectedDate;
    this.periodoFinControl.setValue(selectedDate);
    this.onPeriodoDestinoChange(selectedDate);
    datepicker.close();
  }
  
  // Format date to show only month and year
  formatMonthYear(date: Date | null): string {
    if (!date) return '';
    return this.cloningService.formatPeriodForDisplay(date);
  }

  buscarTareas(): void {
    if (!this.selectedPeriodoOrigen) {
      this.showMessage('Por favor selecciona el período origen');
      return;
    }

    // Auto-initialize destination period when searching tasks
    this.initializePeriodoDestino();

    this.searchingTasks = true;
    this.showTasksTable = false;
    
    const selectedObra = this.obraControl.value;
    const selectedUsuario = this.usuarioControl.value;
    const periodo = this.cloningService.formatPeriodForApi(this.selectedPeriodoOrigen);

    console.log('Searching tasks for:', {
      idUsuario: selectedUsuario,
      periodo: periodo,
      idObra: selectedObra
    });

    this.cloningService.getUserTasks(
      selectedUsuario,
      periodo,
      selectedObra
    ).subscribe({
      next: (response: GetControlFilterResponse) => {
        this.searchingTasks = false;
        console.log('User tasks response:', response);
        
        if (response.success && response.data) {
          this.userTasks = response.data;
          this.filteredTasks = [...this.userTasks]; // Copy for editing
          this.selectedIdControls = this.userTasks.map(task => task.IdControl); // Initialize IdControl array
          this.showTasksTable = true;
          
          const taskCount = this.userTasks.length;
          const userName = this.selectedUsuarioObject?.label || 'Usuario';
          const periodDisplay = this.cloningService.formatPeriodForDisplay(this.selectedPeriodoOrigen!);
          
          // Initialize all tasks as selected by default
          this.selectedIdControls = this.filteredTasks.map(task => task.IdControl);
          console.log('Selected IdControls for replication:', this.selectedIdControls);
          if (this.usuarioControl.value) {
            this.showMessage(`Se encontraron ${taskCount} tareas para ${userName} en ${periodDisplay}.`);
          } else {
            this.showMessage(`Se encontraron ${taskCount} tareas en ${periodDisplay}.`);
          }
        } else {
          this.userTasks = [];
          this.filteredTasks = [];
          this.selectedIdControls = [];
          this.showTasksTable = false;
          this.showMessage(response.message || 'No se encontraron tareas para el usuario u obra seleccionado');
        }
      },
      error: (error) => {
        this.searchingTasks = false;
        this.showTasksTable = false;
        this.selectedIdControls = [];
        console.error('Error searching tasks:', error);
        this.showMessage('Error al buscar las tareas. Inténtalo nuevamente.');
      }
    });
  }

  // Method to confirm and remove a task from the preview list
  removeTask(taskIndex: number): void {
    if (taskIndex >= 0 && taskIndex < this.filteredTasks.length) {
      const taskToRemove = this.filteredTasks[taskIndex];
      
      // Show confirmation dialog
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '450px',
        data: {
          title: 'Confirmar Eliminación',
          message: `¿Estás seguro que deseas eliminar la tarea "<strong>${taskToRemove.Actividad}</strong>" de la lista de replicación?`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar'
        }
      });

      dialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed) {
          // Remove from filtered tasks array
          this.filteredTasks.splice(taskIndex, 1);
          
          // Remove corresponding IdControl from the array
          const idControlToRemove = taskToRemove.IdControl;
          const idControlIndex = this.selectedIdControls.indexOf(idControlToRemove);
          if (idControlIndex > -1) {
            this.selectedIdControls.splice(idControlIndex, 1);
          }
          
          // Force table update by reassigning the dataSource
          this.filteredTasks = [...this.filteredTasks];
          
          console.log('Task removed:', taskToRemove);
          console.log('Updated IdControls:', this.selectedIdControls);
          
          const remainingCount = this.filteredTasks.length;
          
          if (remainingCount === 0) {
            this.showTasksTable = false;
            this.showMessage('No quedan tareas para clonar.');
          } else {
            this.showMessage(`Tarea "${taskToRemove.Actividad}" eliminada. Quedan ${remainingCount} tareas para clonar.`);
          }
        }
      });
    }
  }

  // Methods for checkbox selection
  isTaskSelected(idControl: string): boolean {
    return this.selectedIdControls.includes(idControl);
  }

  toggleTaskSelection(idControl: string, isSelected: boolean): void {
    if (isSelected) {
      // Add to selected if not already included
      if (!this.selectedIdControls.includes(idControl)) {
        this.selectedIdControls.push(idControl);
      }
    } else {
      // Remove from selected
      const index = this.selectedIdControls.indexOf(idControl);
      if (index > -1) {
        this.selectedIdControls.splice(index, 1);
      }
    }
    console.log('Updated selected IdControls:', this.selectedIdControls);
  }

  toggleAllTasks(): void {
    if (this.allTasksSelected()) {
      // Deselect all
      this.selectedIdControls = [];
    } else {
      // Select all
      this.selectedIdControls = this.filteredTasks.map(task => task.IdControl);
    }
    console.log('Toggle all - Selected IdControls:', this.selectedIdControls);
  }

  allTasksSelected(): boolean {
    return this.filteredTasks.length > 0 && this.selectedIdControls.length === this.filteredTasks.length;
  }

  getSelectedTasksCount(): number {
    return this.selectedIdControls.length;
  }

  resetTaskPreview(): void {
    this.userTasks = [];
    this.filteredTasks = [];
    this.selectedIdControls = [];
    this.showTasksTable = false;
  }

  getFormattedPeriodoDestino(): string {
    if (!this.selectedPeriodoDestino) return '';
    return this.cloningService.formatPeriodForDisplay(this.selectedPeriodoDestino);
  }

  // Helper method to check if periods are equal in YYYYMM format
  arePeriodsEqual(fecha1: Date, fecha2: Date): boolean {
    if (!fecha1 || !fecha2) return false;
    const periodo1 = this.cloningService.formatPeriodForApi(fecha1);
    const periodo2 = this.cloningService.formatPeriodForApi(fecha2);
    return periodo1 === periodo2;
  }

  // Helper method to add one month to a date
  addOneMonth(date: Date): Date {
    const newDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return newDate;
  }

  // Auto-initialize periodo destino based on periodo origen
  initializePeriodoDestino(): void {
    if (this.selectedPeriodoOrigen) {
      this.selectedPeriodoDestino = this.addOneMonth(this.selectedPeriodoOrigen);
      this.periodoFinControl.setValue(this.selectedPeriodoDestino);
      console.log('Período destino auto-inicializado:', {
        origen: this.selectedPeriodoOrigen,
        destino: this.selectedPeriodoDestino
      });
    }
  }

  // Updated replicar method - now only works with filtered tasks
  replicar(): void {
    if (!this.showTasksTable || this.filteredTasks.length === 0) {
      this.showMessage('Primero busca las tareas que deseas clonar');
      return;
    }

    if (!this.selectedPeriodoDestino) {
      this.showMessage('Por favor selecciona el período destino');
      return;
    }

    // Validate periods using YYYYMM format
    if (this.arePeriodsEqual(this.selectedPeriodoOrigen!, this.selectedPeriodoDestino)) {
      this.showMessage('El período origen no puede ser igual al período destino');
      return;
    }

    // Validate that origin period is not later than destination period
    const periodoOrigen = this.cloningService.formatPeriodForApi(this.selectedPeriodoOrigen!);
    const periodoDestino = this.cloningService.formatPeriodForApi(this.selectedPeriodoDestino);
    if (periodoOrigen > periodoDestino) {
      this.showMessage('El período origen no puede ser posterior al período destino');
      return;
    }

    // Show confirmation dialog before proceeding
    this.showConfirmationDialog();
  }

  showConfirmationDialog(): void {
    if (!this.selectedPeriodoOrigen || !this.selectedPeriodoDestino) {
      this.showMessage('Error: Períodos no válidos');
      return;
    }

    const periodoOrigenDisplay = this.cloningService.formatPeriodForDisplay(this.selectedPeriodoOrigen);
    const periodoDestinoDisplay = this.cloningService.formatPeriodForDisplay(this.selectedPeriodoDestino);
    const selectedObra = this.obraControl.value;
    const selectedUsuario = this.usuarioControl.value;

    if (!selectedObra) {
      this.showMessage('Error: No hay obra seleccionada');
      return;
    }
      

    // Extract display names from the stored full objects
    const obraDisplayName = this.selectedObraObject?.label || 'Obra no seleccionada';
    const usuarioDisplayName = this.selectedUsuarioObject?.label || 'Todos los usuarios';

    console.log('Stored obra object:', this.selectedObraObject);
    console.log('Stored usuario object:', this.selectedUsuarioObject);
    console.log('Obra display name:', obraDisplayName);
    console.log('Usuario display name:', usuarioDisplayName);

    let title: string;
    let message: string;

    // For the new workflow, we only clone the selected tasks
    const selectedTaskCount = this.selectedIdControls.length;
    title = 'Confirmar Clonación de Tareas';

    if(!selectedUsuario){
      message = `¿Estás seguro que deseas clonar las <strong>${selectedTaskCount} tareas seleccionadas</strong> de la obra "<strong>${obraDisplayName}</strong>" del mes de <strong>${periodoOrigenDisplay}</strong> hacia el mes de <strong>${periodoDestinoDisplay}</strong> para <strong>todos los usuarios asociados a la obra</strong>?`;
    }else{
      message = `¿Estás seguro que deseas clonar las <strong>${selectedTaskCount} tareas seleccionadas</strong> del usuario "<strong>${usuarioDisplayName}</strong>" de la obra "<strong>${obraDisplayName}</strong>" del mes de <strong>${periodoOrigenDisplay}</strong> hacia el mes de <strong>${periodoDestinoDisplay}</strong>?`;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title,
        message,
        confirmText: 'Confirmar Clonación',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.executeCloning();
      }
    });
  }

  executeCloning(): void {
    if (!this.selectedPeriodoDestino) {
      this.showMessage('Error: Período destino no válido');
      return;
    }

    if (this.selectedIdControls.length === 0) {
      this.showMessage('Error: No hay tareas seleccionadas');
      return;
    }

    // Additional validation in execute method
    if (this.arePeriodsEqual(this.selectedPeriodoOrigen!, this.selectedPeriodoDestino)) {
      this.showMessage('Error: El período origen y el período destino no pueden ser iguales');
      return;
    }
      

    this.isLoading = true;
    
    // Convert period to YYYYMM format for API
    const periodoDestino = this.cloningService.formatPeriodForApi(this.selectedPeriodoDestino);
    
    // Format controlIds as comma-separated string
    const controlIds = this.selectedIdControls.join(',');
    
    console.log('Sending to cloning API:', {
      caso: 'ClonarControlsId',
      controlIds: controlIds,
      periodoDestino: periodoDestino
    });

    // Call the new cloning API through the service
    const cloningObservable = this.cloningService.cloneSelectedTasks(controlIds, periodoDestino);

    cloningObservable.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Cloning response:', response);
        
        if (response && response.success) {
          const selectedTaskCount = this.selectedIdControls.length;
          const usuarioDisplayName = this.selectedUsuarioObject?.label || 'Usuario';
          const periodoDestinoDisplay = this.cloningService.formatPeriodForDisplay(this.selectedPeriodoDestino!);
          
          this.showMessage(`✅ Clonación completada: Se clonaron ${selectedTaskCount} tareas de ${usuarioDisplayName} hacia ${periodoDestinoDisplay}`);
          
          // Reset the task preview after successful cloning
          this.resetTaskPreview();
        } else {
          this.showMessage(`❌ Error en la clonación: ${response?.message || 'Error desconocido'}`);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Cloning error:', error);
        this.showMessage('❌ Error al realizar la clonación');
      }
    });
  }

  // Clear filters method
  limpiarFiltros(): void {
    this.obraControl.setValue(null);
    this.usuarioControl.setValue(null);
    this.selectedObraObject = null;
    this.selectedUsuarioObject = null;
    
    // Reset periods
    const now = new Date();
    this.selectedPeriodoOrigen = new Date(now.getFullYear(), now.getMonth(), 1);
    this.periodoInicioControl.setValue(this.selectedPeriodoOrigen);
    
    // Clear destination period
    this.selectedPeriodoDestino = null;
    this.periodoFinControl.setValue(null);
    
    // Reset task preview
    this.resetTaskPreview();
    
    console.log('Filters cleared');
  }

  // Add missing method referenced in HTML
  generarReporte(): void {
    console.log('Generar reporte - funcionalidad pendiente');
    this.showMessage('Funcionalidad de reportes pendiente de implementación');
  }

  showMessage(message: string): void {
    this.message = message;
    this.snackbar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}

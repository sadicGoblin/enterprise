import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CustomSelectComponent, ParameterType } from '../../../../shared/controls/custom-select/custom-select.component';
import { ProxyService } from '../../../../core/services/proxy.service';
import { CloningService } from '../../../../core/services/cloning.service';
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
    
    // Set default periods: current month for origen, next month for destino
    const now = new Date();
    this.selectedPeriodoOrigen = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    this.selectedPeriodoDestino = new Date(now.getFullYear(), now.getMonth() + 1, 1); // First day of next month
    
    // Set form control values
    this.periodoInicioControl.setValue(this.selectedPeriodoOrigen);
    this.periodoFinControl.setValue(this.selectedPeriodoDestino);
    
    console.log('Default periods set:', {
      origen: this.selectedPeriodoOrigen,
      destino: this.selectedPeriodoDestino
    });
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
  
  limpiarFiltros(): void {
    this.obraControl.reset();
    this.usuarioControl.reset();
    
    // Reset to default periods
    const now = new Date();
    this.selectedPeriodoOrigen = new Date(now.getFullYear(), now.getMonth(), 1);
    this.selectedPeriodoDestino = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    this.periodoInicioControl.setValue(this.selectedPeriodoOrigen);
    this.periodoFinControl.setValue(this.selectedPeriodoDestino);
    
    // Reset usuario select if exists
    if (this.usuarioSelect) {
      this.usuarioSelect.isDisabled = true;
      this.usuarioSelect.writeValue(null);
    }
    
    // Clear stored objects
    this.selectedObraObject = null;
    this.selectedUsuarioObject = null;
  }

  replicar(): void {
    // Validate all required fields
    if (!this.obraControl.value) {
      this.showMessage('Por favor selecciona una obra');
      return;
    }

    if (!this.selectedPeriodoOrigen || !this.selectedPeriodoDestino) {
      this.showMessage('Por favor selecciona ambos períodos');
      return;
    }

    // Validate that origin period is not later than destination period
    if (this.selectedPeriodoOrigen > this.selectedPeriodoDestino) {
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
    const usuarioDisplayName = this.selectedUsuarioObject?.label || 'Usuario no seleccionado';

    console.log('Stored obra object:', this.selectedObraObject);
    console.log('Stored usuario object:', this.selectedUsuarioObject);
    console.log('Obra display name:', obraDisplayName);
    console.log('Usuario display name:', usuarioDisplayName);

    let title: string;
    let message: string;

    if (!selectedUsuario) {
      // Case: Clone all users from the project
      title = 'Confirmar Clonación de Proyecto';
      message = `¿Estás seguro que deseas clonar <strong>todas las actividades de todos los usuarios</strong> de la obra "<strong>${obraDisplayName}</strong>" del mes de <strong>${periodoOrigenDisplay}</strong> hacia el mes de <strong>${periodoDestinoDisplay}</strong>?`;
    } else {
      // Case: Clone specific user
      title = 'Confirmar Clonación de Usuario';
      message = `¿Estás seguro que deseas clonar las actividades del usuario "<strong>${usuarioDisplayName}</strong>" de la obra "<strong>${obraDisplayName}</strong>" del mes de <strong>${periodoOrigenDisplay}</strong> hacia el mes de <strong>${periodoDestinoDisplay}</strong>?`;
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
    if (!this.selectedPeriodoOrigen || !this.selectedPeriodoDestino) {
      this.showMessage('Error: Períodos no válidos');
      return;
    }

    this.isLoading = true;
    const selectedObra = this.obraControl.value;
    const selectedUsuario = this.usuarioControl.value;
    
    if (!selectedObra) {
      this.isLoading = false;
      this.showMessage('Error: No hay obra seleccionada');
      return;
    }
    
    // Convert periods to YYYYMM format for API
    const periodoOrigen = this.cloningService.formatPeriodForApi(this.selectedPeriodoOrigen);
    const periodoDestino = this.cloningService.formatPeriodForApi(this.selectedPeriodoDestino);
    
    // Format periods for display
    const periodoOrigenDisplay = this.cloningService.formatPeriodForDisplay(this.selectedPeriodoOrigen);
    const periodoDestinoDisplay = this.cloningService.formatPeriodForDisplay(this.selectedPeriodoDestino);

    let cloningObservable;

    if (!selectedUsuario) {
      // Clone all users from the project
      cloningObservable = this.cloningService.cloneProjectActivities(
        selectedObra?.value || selectedObra,
        periodoOrigen,
        periodoDestino
      );
    } else {
      // Clone specific user
      cloningObservable = this.cloningService.cloneUserActivities(
        selectedObra?.value || selectedObra,
        selectedUsuario?.value || selectedUsuario,
        periodoOrigen,
        periodoDestino
      );
    }

    cloningObservable.subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Cloning response:', response);
        
        if (response && response.success !== false) {
          const usuarioDisplayName = this.selectedUsuarioObject?.label || 'Usuario';
          const targetType = selectedUsuario ? `del usuario ${usuarioDisplayName}` : 'de todos los usuarios';
          this.showMessage(`Actividades ${targetType} clonadas exitosamente de ${periodoOrigenDisplay} a ${periodoDestinoDisplay}`);
        } else {
          this.showMessage(response?.message || 'Error al clonar actividades');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error cloning activities:', error);
        this.showMessage('Error al conectar con el servidor. Inténtalo nuevamente.');
      }
    });
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

import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SubParametroService } from '../../../services/sub-parametro.service';
import { PerfilService, PantallaPerfil } from '../../../services/perfil.service';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../shared/controls/custom-select/custom-select.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-check-list-access',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    CustomSelectComponent,
  ],
  templateUrl: './check-list-access.component.html',
  styleUrl: './check-list-access.component.scss',
})
export class CheckListAccessComponent implements OnInit {
  accessTypes: SelectOption[] = [];
  roleControl = new FormControl();
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  parameterType = ParameterType.TIPO_ACCESO; // For the direct API integration
  
  // Screen permissions loading state
  isLoadingScreens: boolean = false;
  screenLoadError: boolean = false;
  screenErrorMessage: string = '';

  displayedColumns: string[] = ['screen', 'access', 'write'];

  // Screen permissions and selected option
  screenPermissions: PantallaPerfil[] = [];
  selectedOption: SelectOption | null = null; // Store the currently selected option

  constructor(
    private subParametroService: SubParametroService,
    private perfilService: PerfilService
  ) {}
  
  ngOnInit(): void {
    // We don't need to call loadTipoAccesos() anymore since the custom-select component
    // will handle the API call directly with the parameterType
    console.log('CheckListAccessComponent initialized, custom-select will load data directly');
  }

  loadTipoAccesos() {
    this.isLoading = true;
    this.hasError = false;
    console.log('Loading tipo accesos from API...');
    
    this.subParametroService.getTipoAccesos().subscribe({
      next: (data) => {
        this.accessTypes = data;
        console.log('Received access types from API:', data);
        
        // Set default selection if we have data
        if (this.accessTypes.length > 0) {
          // Find 'Usuario General' or similar in the options
          const defaultOption = this.accessTypes.find(option => 
            option.label.toLowerCase().includes('usuario general'));
          
          const defaultValue = defaultOption ? defaultOption.value : this.accessTypes[0].value;
          this.roleControl.setValue(defaultValue);
          console.log('Selected default role:', defaultValue);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading access types:', error);
        this.hasError = true;
        this.errorMessage = 'Error al cargar tipos de acceso. Por favor intente nuevamente.';
        this.isLoading = false;
      }
    });
  }
  
  onAccessTypeChange(selection: SelectOption | string): void {
    let selectedOption: SelectOption | undefined;

    // Handle if the event emits a string value or the full object
    if (typeof selection === 'string') {
      selectedOption = this.accessTypes.find(opt => opt.value === selection);
    } else {
      selectedOption = selection;
    }

    console.log('[CheckList] Access type changed. Resolved option:', selectedOption);
    this.selectedOption = selectedOption || null;

    // If no valid option is selected (e.g., placeholder "Seleccionar..."), clear the table
    if (!selectedOption || !selectedOption.value) {
      console.log('[CheckList] Placeholder selected. Clearing screen permissions.');
      this.screenPermissions = [];
      this.screenLoadError = false; // Reset error state
      return;
    }

    const idPerfil = selectedOption.idSubParam;

    // Ensure idPerfil is a valid number before making the API call (0 is a valid ID)
    if (typeof idPerfil !== 'number') {
      console.error('[CheckList] Invalid idPerfil, cannot load permissions:', idPerfil);
      this.screenPermissions = [];
      this.screenLoadError = true;
      this.screenErrorMessage = 'El tipo de acceso seleccionado es inválido.';
      return;
    }

    this.loadScreenPermissions(idPerfil);
  }
  
  /**
   * Handle options loaded event from custom-select
   */
  onOptionsLoaded(options: SelectOption[]): void {
    console.log('Options loaded from custom-select:', options);

    // Create a placeholder option
    const placeholderOption: SelectOption = { value: '', label: 'Seleccionar...', idSubParam: undefined };

    // Add the placeholder to the beginning of the list and store it
    this.accessTypes = [placeholderOption, ...options];
    
    // Set the initial value of the form control to the placeholder
    this.roleControl.setValue(placeholderOption.value);

    console.log('Access types initialized with placeholder:', this.accessTypes);
  }

  /**
   * Load screen permissions for a profile
   * @param idPerfil Profile ID to load permissions for
   */
  loadScreenPermissions(idPerfil: number): void {
    // Show loading spinner
    this.isLoadingScreens = true;
    this.screenLoadError = false;
    
    console.log('[CheckList] Loading screen permissions for profile ID:', idPerfil);
    console.log('[CheckList] Profile ID type:', typeof idPerfil);
    
    if (!idPerfil && idPerfil !== 0) {
      console.error('[CheckList] Invalid profile ID:', idPerfil);
      this.screenLoadError = true;
      this.screenErrorMessage = 'ID de perfil inválido';
      this.isLoadingScreens = false;
      return;
    }
    
    this.perfilService.getScreensForProfile(idPerfil).subscribe({
      next: (permissions: PantallaPerfil[]) => {
        console.log('[CheckList] SUCCESS: Received screen permissions for IdPerfil', idPerfil, ':', permissions);

        if (Array.isArray(permissions)) {
          this.screenPermissions = permissions;
          this.screenLoadError = false;
          this.screenErrorMessage = '';
          console.log(`[CheckList] ✅ Permissions loaded successfully with ${permissions.length} items.`);
        } else {
          // This case should ideally not be reached if the service is correct, but it's good for safety.
          console.error('[CheckList] Error: Expected an array of permissions, but received:', permissions);
          this.screenPermissions = [];
          this.screenLoadError = true;
          this.screenErrorMessage = 'Error: Formato de datos de permisos inesperado.';
        }

        this.isLoadingScreens = false;
      },
      error: (error) => {
        console.error('[CheckList] Error loading screen permissions:', error);
        this.screenLoadError = true;
        this.screenErrorMessage = 'Error al cargar permisos de pantallas';
        this.isLoadingScreens = false;
      }
    });
  }
  
  /**
   * Update a screen permission (access or write)
   */
  updatePermission(screen: PantallaPerfil, type: 'access' | 'write', checked: boolean): void {
    console.log(`Updating ${type} permission for screen ${screen.NombrePantalla} to ${checked}`);
    
    // Set the correct field based on the type
    if (type === 'access') {
      screen.Acceso = checked;
      
      // If access is false, write should also be false
      if (!checked) {
        screen.Grabar = false;
      }
    } else if (type === 'write') {
      screen.Grabar = checked;
      
      // If write is true, access should also be true
      if (checked) {
        screen.Acceso = true;
      }
    }
    
    // Call the API to update the permission
    this.perfilService.updateScreenPermission(
      screen.IdPerfil,
      screen.IdPantalla,
      screen.IdPerfilPantalla,
      screen.Acceso,
      screen.Grabar
    ).subscribe({
      next: (success) => {
        if (success) {
          console.log('Permission update successful');
        } else {
          console.error('Permission update failed');
          // Revert the change if the update failed
          if (type === 'access') {
            screen.Acceso = !checked;
            // Ensure write permission is also adjusted if needed
            if (!screen.Acceso) {
              screen.Grabar = false;
            }
          } else if (type === 'write') {
            screen.Grabar = !checked;
          }
        }
      },
      error: (error) => {
        console.error('Error updating permission:', error);
        // Revert the change on error
        if (type === 'access') {
          screen.Acceso = !checked;
          if (!screen.Acceso) {
            screen.Grabar = false;
          }
        } else if (type === 'write') {
          screen.Grabar = !checked;
        }
      }
    });
  }
  
  /**
   * Get filtered screens based on selected role
   */
  get filteredScreens(): any[] {
    // Simply return the current screen permissions
    // The filtering logic is now handled in onAccessTypeChange
    // and displayed through template conditionals
    return this.screenPermissions;
  }
  
  /**
   * Check if the currently selected role is 'Sin Acceso'
   */
  isSinAccesoSelected(): boolean {
    if (!this.roleControl || !this.roleControl.value || !this.accessTypes) {
      return false;
    }
    
    // Find the current selected option based on the value in roleControl
    const selectedOption = this.accessTypes.find(option => 
      option.value === this.roleControl.value);
    
    // Check if it's 'Sin Acceso'
    return selectedOption ? 
      selectedOption.label.toLowerCase().includes('sin acceso') : false;
  }
  
  /**
   * Retry loading screen permissions using the currently selected option
   */
  retryLoadScreenPermissions(): void {
    if (!this.selectedOption || !this.selectedOption.idSubParam) {
      console.error('Cannot retry - no valid selected option with idSubParam');
      return;
    }
    
    console.log('Retrying loading screen permissions for:', this.selectedOption);
    this.loadScreenPermissions(this.selectedOption.idSubParam);
  }
}

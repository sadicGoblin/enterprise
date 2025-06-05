import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs/operators';

import { ObraService } from '../../services/obra.service';
// We'll use MatSelect instead of CustomSelectComponent for simplicity

@Component({
  selector: 'app-area-maintenance-popup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './area-maintenance-popup.component.html',
  styleUrl: './area-maintenance-popup.component.scss'
})
export class AreaMaintenancePopupComponent implements OnInit {
  // User information
  userId: number;
  userName: string;
  collaborator: string;
  
  // Projects dropdown
  selectedProjectId: number | null = null;
  projectOptions: { value: number; label: string }[] = [];
  
  // Table configuration
  displayedColumns: string[] = ['area', 'responsible'];
  dataSource: any[] = [];
  
  // Loading and error states
  isLoading = false;
  hasError = false;
  errorMessage = '';
  
  // Track if changes have been made
  isDirty = false;

  constructor(
    private dialogRef: MatDialogRef<AreaMaintenancePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: number, userName: string },
    private obraService: ObraService
  ) {
    this.userId = data.userId;
    this.userName = data.userName;
    this.collaborator = data.userName || 'Usuario';
  }

  ngOnInit(): void {
    this.loadProjects();
  }
  
  /**
   * Load projects/obras from the API for the dropdown
   */
  loadProjects(): void {
    if (!this.userId) {
      this.hasError = true;
      this.errorMessage = 'No se pudo cargar los proyectos: ID de usuario no válido';
      return;
    }
    
    this.isLoading = true;
    this.hasError = false;
    
    // Use the logged-in user ID from localStorage for the API call
    const loggedUserId = this.getLoggedUserId();
    
    this.obraService.getObrasByUser(loggedUserId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          console.log('Projects response:', response);
          
          if (response && response.glosa === 'Ok' && response.data && Array.isArray(response.data)) {
            // Transform API response to options format for the dropdown
            this.projectOptions = response.data.map((item: any) => ({
              value: Number(item.IdObra),
              label: item.Obra
            }));
            
            // Select first project by default if available
            if (this.projectOptions.length > 0) {
              this.selectedProjectId = this.projectOptions[0].value;
              this.onProjectChange();
            }
          } else {
            // If no data or invalid format, show empty dropdown
            this.projectOptions = [];
            console.warn('No projects data found or invalid format', response);
          }
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.hasError = true;
          this.errorMessage = 'Error al cargar los proyectos. Por favor intente nuevamente.';
          
          // Fallback to empty data
          this.projectOptions = [];
        }
      });
  }
  
  /**
   * Handle project selection change
   */
  onProjectChange(): void {
    // Here you would load the areas for the selected project
    console.log('Selected project:', this.selectedProjectId);
    
    // For now, just show placeholder data
    this.dataSource = [
      { area: 'Área 1', responsible: 'Responsable 1' },
      { area: 'Área 2', responsible: 'Responsable 2' }
    ];
  }
  
  /**
   * Get logged-in user ID from localStorage
   */
  private getLoggedUserId(): number {
    try {
      // Attempt to get user data from localStorage - adjust key as needed
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.idUsuario || 478; // Fallback to 478 as specified in requirements
      }
    } catch (error) {
      console.error('Error retrieving user ID from localStorage:', error);
    }
    
    // Return default ID as specified in requirements
    return 478;
  }
  
  /**
   * Save changes and close dialog
   */
  save(): void {
    // Here you would implement saving the changes to the API
    // For now, just log the changes and close
    console.log('Saving changes for areas:', this.dataSource);
    this.dialogRef.close(this.dataSource);
  }

  /**
   * Close dialog without saving
   */
  close(): void {
    if (this.isDirty) {
      if (confirm('¿Está seguro que desea salir sin guardar los cambios?')) {
        this.dialogRef.close();
      }
    } else {
      this.dialogRef.close();
    }
  }
}

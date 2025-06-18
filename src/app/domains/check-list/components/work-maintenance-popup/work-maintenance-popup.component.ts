import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-work-maintenance-popup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './work-maintenance-popup.component.html',
  styleUrl: './work-maintenance-popup.component.scss',
})
export class WorkMaintenancePopupComponent implements OnInit {
  // User information
  userId: number;
  userName: string;
  collaborator: string;
  
  // Table configuration
  displayedColumns: string[] = ['work', 'enable', 'validator', 'reviewer'];
  dataSource: any[] = [];
  
  // Loading and error states
  isLoading = false;
  hasError = false;
  errorMessage = '';
  
  // Track if changes have been made
  isDirty = false;

  constructor(
    private dialogRef: MatDialogRef<WorkMaintenancePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: number, userName: string },
    private usuarioService: UsuarioService
  ) {
    this.userId = data.userId;
    this.userName = data.userName;
    this.collaborator = data.userName || 'Usuario';
  }

  ngOnInit(): void {
    this.loadUserWorks();
  }
  
  /**
   * Load user works from the API
   */
  loadUserWorks(): void {
    if (!this.userId) {
      this.hasError = true;
      this.errorMessage = 'No se pudo cargar las obras: ID de usuario no válido';
      return;
    }
    
    this.isLoading = true;
    this.hasError = false;
    
    this.usuarioService.getUserWorks(this.userId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          console.log('User works response:', response);
          
          if (response && response.glosa === 'Ok' && response.data && Array.isArray(response.data)) {
            // Log first item to help debug field names
            if (response.data.length > 0) {
              console.log('Sample work item from API:', response.data[0]);
            }
            
            // Transform API response to table format - using Habilita field (not Habilitado)
            this.dataSource = response.data.map((item: any) => ({
              work: item.Obra,
              enable: item.Habilita === '1',
              validator: item.Validador === '1',
              reviewer: item.Revisor === '1',
              idObra: item.IdObra
            }));
          } else {
            // If no data or invalid format, show empty table
            this.dataSource = [];
            console.warn('No works data found or invalid format', response);
          }
        },
        error: (error) => {
          console.error('Error loading user works:', error);
          this.hasError = true;
          this.errorMessage = 'Error al cargar las obras. Por favor intente nuevamente.';
          
          // Fallback to empty data
          this.dataSource = [];
        }
      });
  }
  
  /**
   * Track changes in checkboxes
   */
  onCheckboxChange(): void {
    this.isDirty = true;
  }
  
  /**
   * Save changes and close dialog
   */
  save(): void {
    // Here you would implement saving the changes to the API
    // For now, just log the changes and close
    console.log('Saving changes for works:', this.dataSource);
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

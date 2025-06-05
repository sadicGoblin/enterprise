import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services and models
import { BibliotecaService } from '../../../services/biblioteca.service';
import { BibliotecaItem } from '../../../models/biblioteca.models';

@Component({
  selector: 'app-library-pp',
  standalone: true,
  templateUrl: './library-pp.component.html',
  styleUrl: './library-pp.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class LibraryPpComponent implements OnInit {
  // Form fields
  title = '';
  year: number | null = null;
  documentType = '';
  types = ['ESTANDAR', 'PROCEDIMIENTOS', 'INSTRUCTIVOS'];

  // Data sources
  documents: any[] = [];
  displayedColumns = ['title', 'year', 'name', 'type', 'actions'];
  
  // States
  isLoading = false;
  
  constructor(
    private bibliotecaService: BibliotecaService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.fetchDocuments();
  }
  
  /**
   * Fetch documents from the API
   */
  fetchDocuments(): void {
    this.isLoading = true;
    this.bibliotecaService.getAllDocuments().subscribe({
      next: (response) => {
        if (response.codigo === 0) {
          // Transform API response to match the table structure
          this.documents = response.data.map(item => ({
            id: item.IdBiblioteca,
            title: item.Titulo,
            year: parseInt(item.Agnio, 10) || new Date().getFullYear(),
            name: item.Nombre,
            type: item.Tipo,
            documento: item.Documento // Keep the base64 document data if needed
          }));
        } else {
          this.showMessage(`Error: ${response.glosa}`);
          // If API fails, use empty array
          this.documents = [];
        }
      },
      error: (error) => {
        console.error('Error fetching documents', error);
        this.showMessage('Error al cargar documentos');
        this.documents = [];
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  
  /**
   * View document
   * @param document Document to view
   */
  viewDocument(document: any): void {
    // Implementation for viewing document
    this.showMessage(`Visualizando documento: ${document.title}`);
  }
  
  /**
   * Delete document
   * @param document Document to delete
   */
  deleteDocument(document: any): void {
    // Implementation for deleting document
    this.showMessage(`Documento eliminado: ${document.title}`);
  }
  
  /**
   * Save document
   */
  saveDocument(): void {
    // Implementation for saving document
    this.showMessage('Documento guardado correctamente');
  }
  
  /**
   * Display a snackbar message
   * @param message Message to display
   */
  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}


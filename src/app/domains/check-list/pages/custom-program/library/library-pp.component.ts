import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Services and models
import { BibliotecaService } from '../../../services/biblioteca.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SubParametroService } from '../../../services/sub-parametro.service';
import { SelectOption } from '../../../../../shared/controls/custom-select/custom-select.component';

// New import for modal-file component
import { ModalFileComponent } from '../../../components/modal-file/modal-file.component';

@Component({
  selector: 'app-library-pp',
  standalone: true,
  templateUrl: './library-pp.component.html',
  styleUrls: ['./library-pp.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
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
  displayedColumns = ['title', 'year', 'name', 'type', 'view', 'delete'];
  
  // States
  isLoading = false;
  loadingDocumentId: number | null = null; // Para rastrear qué documento está siendo cargado
  
  // File upload
  selectedFile: File | null = null;
  selectedFileName: string = '';
  
  constructor(
    private bibliotecaService: BibliotecaService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private formBuilder: FormBuilder
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
        console.log('API response:', response);
        
        // Handle new API response format with success, code, message fields
        if (response.success === true || response.codigo === 0) { // Support both formats
          // Transform API response to match the table structure
          this.documents = response.data.map(item => ({
            id: item.IdBiblioteca,
            title: item.Titulo,
            year: parseInt(item.Agnio, 10) || new Date().getFullYear(),
            name: item.Nombre,
            type: item.Tipo,
            documentUrl: item.Documento // This is now a direct URL to the document
          }));
          console.log('Transformed documents:', this.documents);
        } else {
          // Use message from new format or glosa from old format
          const errorMsg = response.message || response.glosa || 'Error desconocido';
          this.showMessage(`Error: ${errorMsg}`);
          // If API fails, use empty array
          this.documents = [];
        }
      },
      error: (error) => {
        console.error('Error fetching documents', error);
        if (error.error) console.log('Error details:', error.error);
        this.showMessage('Error al cargar documentos');
        this.documents = [];
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  
  /**
   * View a document in a modal
   * @param document Document to view
   */
  viewDocument(document: any): void {
    console.log('=== VIEWING DOCUMENT ===');
    console.log('Document object:', document);
    
    // Establecer el ID del documento que está siendo cargado
    this.loadingDocumentId = document.id;
    
    // Check if we have a direct document URL
    if (document.documentUrl && typeof document.documentUrl === 'string' && document.documentUrl.trim() !== '') {
      console.log('=== DIRECT URL FOUND ===');
      console.log('Document URL:', document.documentUrl);
      
      // Open the modal with the document URL
      const dialogRef = this.dialog.open(ModalFileComponent, {
        width: '90vw',
        height: '90vh',
        maxWidth: '1200px',
        maxHeight: '800px',
        panelClass: 'pdf-dialog',
        autoFocus: true,
        restoreFocus: true,
        disableClose: false,
        hasBackdrop: true,
        data: {
          documentUrl: document.documentUrl,
          filename: document.name || 'documento.pdf'
        }
      });

      // Handle dialog close
      dialogRef.afterClosed().subscribe(result => {
        console.log('Dialog closed');
        // Limpiar el ID del documento cargado
        this.loadingDocumentId = null;
      });
    } else {
      console.error('=== ERROR: NO DOCUMENT URL ===');
      this.showMessage('El documento no contiene una URL válida para mostrar.');
      this.loadingDocumentId = null;
    }
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
   * Handler for file selection
   * @param event File input change event
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExt === 'xls' || fileExt === 'xlsx') {
        this.selectedFile = file;
        this.selectedFileName = file.name;
        console.log('Archivo seleccionado:', file.name);
      } else {
        this.showMessage('Solo se permiten archivos Excel (.xls, .xlsx)');
        // Reset file input
        input.value = '';
        this.selectedFile = null;
        this.selectedFileName = '';
      }
    }
  }

  /**
   * Save document
   */
  saveDocument(): void {
    if (!this.selectedFile) {
      this.showMessage('Por favor, adjunte un archivo Excel');
      return;
    }
    
    if (!this.title.trim()) {
      this.showMessage('Por favor, ingrese un título para el documento');
      return;
    }
    
    // Aquí enviarías el archivo al servidor
    console.log('Enviando archivo:', this.selectedFile.name);
    console.log('Título:', this.title);
    console.log('Año:', this.year);
    console.log('Tipo:', this.documentType);
    
    // Simular guardado exitoso
    this.showMessage('Documento guardado correctamente');
    
    // Reiniciar formulario
    this.resetForm();
  }
  
  /**
   * Reset form fields
   */
  resetForm(): void {
    this.title = '';
    this.year = null;
    this.documentType = '';
    this.selectedFile = null;
    this.selectedFileName = '';
    // Limpiar el input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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

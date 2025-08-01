import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { ProxyService } from '../../../../../../core/services/proxy.service';
import { environment } from '../../../../../../../environments/environment';
import { ImgViewerComponent } from '../../../../../../shared/components/img-viewer/img-viewer.component';

// Interface para la respuesta de la API
interface ARTApiResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    idArtApp: string;
    idControl: string;
    periodo: string;
    dia: string;
    idTrabajador: string;
    evidencia: string;
    fecha: string;
    files: string[];
    descripcion: string;
  };
}

// Interface para los datos del modal
interface ARTModalData {
  activityId?: number;
  projectId?: string;
  idControl?: string;
  day?: number;
  idParam?: string;
  name?: string;
}

@Component({
  selector: 'app-art-view-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    ImgViewerComponent
  ],
  templateUrl: './art-view-modal.component.html',
  styleUrl: './art-view-modal.component.scss'
})
export class ARTViewModalComponent implements OnInit {
  artData: ARTApiResponse['data'] | null = null;
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';

  constructor(
    public dialogRef: MatDialogRef<ARTViewModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ARTModalData,
    private proxyService: ProxyService
  ) {}

  ngOnInit(): void {
    console.log('ARTViewModal: datos recibidos:', this.data);
    this.loadARTData();
  }

  /**
   * Carga los datos de ART desde la API
   */
  loadARTData(): void {
    if (!this.data.idControl || !this.data.day) {
      this.hasError = true;
      this.errorMessage = 'Faltan parámetros requeridos (idControl o day)';
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    const requestBody = {
      caso: 'get',
      idControl: parseInt(this.data.idControl),
      dia: this.data.day
    };

    console.log('ARTViewModal: enviando request:', requestBody);

    this.callARTApi(requestBody).subscribe({
      next: (response) => {
        console.log('ARTViewModal: respuesta de API:', response);
        if (response.success && response.data) {
          this.artData = response.data;
        } else {
          this.hasError = true;
          this.errorMessage = response.message || 'Error al cargar los datos de ART';
        }
      },
      error: (error) => {
        console.error('ARTViewModal: error en API:', error);
        this.hasError = true;
        this.errorMessage = 'Error de conexión al cargar los datos';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Llama a la API de ART
   */
  private callARTApi(requestBody: any): Observable<ARTApiResponse> {
    const url = '/ws/ARTSvcImpl.php';
    
    return this.proxyService.post(environment.apiBaseUrl + url, requestBody)
      .pipe(
        map((response: unknown) => response as ARTApiResponse),
        catchError(error => {
          console.error('Error en llamada a API ART:', error);
          return of({
            success: false,
            code: 500,
            message: 'Error de conexión',
            data: null as any
          } as ARTApiResponse);
        })
      );
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Intenta cargar los datos nuevamente
   */
  retry(): void {
    this.loadARTData();
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.dialogRef.close();
  }
}

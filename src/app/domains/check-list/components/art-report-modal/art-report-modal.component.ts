import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { ImgViewerComponent } from '../../../../shared/components/img-viewer/img-viewer.component';
import { ProxyService } from '../../../../core/services/proxy.service';
import { environment } from '../../../../../environments/environment';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of } from 'rxjs';

// Interfaz para los datos que se reciben como parámetro
type ARTReportModalData = number; // Solo recibimos el ID del reporte

// Interfaz para la respuesta de la API
interface ApiResponse {
  code: number;
  data: any;
  message?: string;
  success?: boolean;
}

// Interfaz para los datos del reporte ART
interface ARTData {
  idArtApp: string;
  idControl: string;
  periodo: string;
  dia: string;
  idTrabajador: string;
  fecha: string;
  descripcion: string;
  photos: string[];
}

@Component({
  selector: 'app-art-report-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    ImgViewerComponent,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './art-report-modal.component.html',
  styleUrls: ['./art-report-modal.component.scss']
})
export class ARTReportModalComponent implements OnInit {
  // Estado de carga
  loading = false;
  error: string | null = null;
  
  // Datos del reporte ART
  artData: ARTData = {
    idArtApp: '',
    idControl: '',
    periodo: '',
    dia: '',
    idTrabajador: '',
    fecha: '',
    descripcion: '',
    photos: []
  };

  constructor(
    private dialogRef: MatDialogRef<ARTReportModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ARTReportModalData,
    private proxyService: ProxyService
  ) {}

  ngOnInit(): void {
    this.loadARTData();
  }

  // Cerrar el dialog
  closeDialog(): void {
    this.dialogRef.close();
  }

  // Cargar datos del reporte ART desde la API
  loadARTData(): void {
    if (!this.data) {
      this.error = 'No se proporcionó un ID válido para consultar';
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    // Obtener la URL base del ambiente
    const baseUrl = environment.apiBaseUrl || 'https://inarco-ssoma.favric.cl';
    
    const url = `${baseUrl}/ws/ARTSvcImpl.php`;
    const body = {
      caso: 'getByID',
      idArtApp: this.data
    };
    
    console.log('Consultando datos del reporte ART:', body);
    
    this.proxyService.post<ApiResponse>(url, body)
      .pipe(
        catchError(err => {
          console.error('Error al consultar datos del reporte ART:', err);
          this.error = 'Error al cargar los datos del reporte ART';
          return of(null as any);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((response: ApiResponse | null) => {
        if (response && response.data) {
          console.log('Datos del reporte ART recibidos:', response.data);
          // Mapear los datos de la respuesta a la estructura artData
          this.mapResponseToARTData(response.data);
        } else {
          console.error('Error en la respuesta:', response);
          this.error = 'No se encontraron datos para el reporte ART solicitado';
        }
      });
  }
  
  mapResponseToARTData(responseData: any): void {
    try {
      // Procesar las imágenes si vienen en la respuesta
      let photos: string[] = [];
      
      // Verificar si hay archivos en el campo files
      if (responseData.files) {
        if (Array.isArray(responseData.files)) {
          photos = responseData.files;
        } else if (typeof responseData.files === 'object') {
          // Si es un objeto, convertir a array
          photos = Object.values(responseData.files);
        } else if (typeof responseData.files === 'string') {
          // Si es un string (URL única)
          photos = [responseData.files];
        }
        console.log('Imágenes encontradas:', photos);
      }
      
      // Formatear la fecha si existe
      const formattedDate = responseData.fecha ? 
        new Date(responseData.fecha).toLocaleDateString('es-CL') : '';

      // Mapear los datos de la respuesta
      this.artData = {
        idArtApp: responseData.idArtApp || '',
        idControl: responseData.idControl || '',
        periodo: responseData.periodo || '',
        dia: responseData.dia || '',
        idTrabajador: responseData.idTrabajador || '',
        fecha: formattedDate,
        descripcion: responseData.descripcion || '',
        photos: photos
      };
    } catch (error) {
      console.error('Error al mapear los datos:', error);
      this.error = 'Error al procesar los datos recibidos';
    }
  }
}

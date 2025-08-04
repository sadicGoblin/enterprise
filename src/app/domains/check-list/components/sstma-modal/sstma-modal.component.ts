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
type SstmaModalData = number; // Solo recibimos el ID de la actividad

// Interfaz para la respuesta de la API
interface ApiResponse {
  code: number;
  data: any;
  message?: string;
}

// Interfaz para los datos de inspección SSTMA
interface SstmaInspection {
  reportDate: string;
  worksite: string;
  worksiteName: string;
  companyName: string;
  professionalResponsible: string;
  workArea: string;
  detectedCondition: string;
  associatedWork: string;
  associatedRisk: string;
  proposedControlMeasure: string;
  communicatedTo: string[];
  photos: string[];
}

@Component({
  selector: 'app-sstma-modal',
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
  templateUrl: './sstma-modal.component.html',
  styleUrls: ['./sstma-modal.component.scss']
})
export class SstmaModalComponent implements OnInit {
  // Datos de inspección SSTMA (mock)
  sstmaData: SstmaInspection = {
    reportDate: '',
    worksite: '',
    worksiteName: '',
    companyName: '',
    professionalResponsible: '',
    workArea: '',
    detectedCondition: '',
    associatedWork: '',
    associatedRisk: '',
    proposedControlMeasure: '',
    communicatedTo: [],
    photos: []
  };

  loading = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<SstmaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SstmaModalData,
    private proxyService: ProxyService
  ) {}

  ngOnInit(): void {
    // Aquí podríamos cargar los datos reales de la API
    this.loadSstmaData();
  }

  loadSstmaData(): void {
    if (!this.data) {
      this.error = 'No se proporcionó un ID válido para consultar';
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    // Obtener la URL base del ambiente
    const baseUrl = environment.apiBaseUrl || 'https://inarco-ssoma.favric.cl';
    
    const url = `${baseUrl}/ws/ActividadSvcImpl.php`;
    const body = {
      caso: 'ConsultaSTTMAApp',
      id: this.data
    };
    
    console.log('Consultando datos SSTMA:', body);
    
    this.proxyService.post<ApiResponse>(url, body)
      .pipe(
        catchError(err => {
          console.error('Error al consultar datos SSTMA:', err);
          this.error = 'Error al cargar los datos de inspección SSTMA';
          return of(null as any);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((response: ApiResponse | null) => {
        if (response && response.data) {
          console.log('Datos SSTMA recibidos:', response.data);
          // Mapear los datos de la respuesta a la estructura sstmaData
          this.mapResponseToSstmaData(response.data);
        } else {
          console.error('Error en la respuesta:', response);
          this.error = 'No se encontraron datos para la inspección solicitada';
        }
      });
  }
  
  mapResponseToSstmaData(responseData: any): void {
    // Aquí se mapean los datos recibidos de la API a la estructura de sstmaData
    
    try {
      // Procesar las imágenes si vienen en la respuesta
      let photos: string[] = this.sstmaData.photos;
      
      // Primero verificar si hay archivos en el campo files
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
      
      // Mapear los datos de la respuesta a la estructura sstmaData
      this.sstmaData = {
        reportDate: responseData.fecha || this.sstmaData.reportDate,
        worksite: responseData.obra || this.sstmaData.worksite,
        worksiteName: responseData.nombreObra || this.sstmaData.worksiteName,
        companyName: responseData.empresa || this.sstmaData.companyName,
        professionalResponsible: responseData.profesionalResponsable || this.sstmaData.professionalResponsible,
        workArea: responseData.areaTrabajo || this.sstmaData.workArea,
        detectedCondition: responseData.condicionDetectada || this.sstmaData.detectedCondition,
        associatedWork: responseData.trabajoAsociado || this.sstmaData.associatedWork,
        associatedRisk: responseData.riesgoAsociado || this.sstmaData.associatedRisk,
        proposedControlMeasure: responseData.medidaControl || this.sstmaData.proposedControlMeasure,
        communicatedTo: responseData.comunicadoA ? 
          (Array.isArray(responseData.comunicadoA) ? responseData.comunicadoA : responseData.comunicadoA.split(',')) : 
          this.sstmaData.communicatedTo,
        photos: photos // Usar las imágenes procesadas
      };
    } catch (error) {
      console.error('Error al mapear los datos:', error);
      this.error = 'Error al procesar los datos recibidos';
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}

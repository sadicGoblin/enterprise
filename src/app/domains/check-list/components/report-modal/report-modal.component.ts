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
type ReportModalData = number; // Solo recibimos el ID del reporte

// Interfaz para la respuesta de la API
interface ApiResponse {
  code: number;
  data: any;
  message?: string;
  success?: boolean;
}

// Interfaz para los datos del reporte de incidente
interface ReportData {
  reportDate: string;
  worksite: string;
  worksiteName: string;
  professionalResponsible: string;
  incidentType: string;
  potentialSeverity: string;
  action: string;
  description: string;
  requires: string;
  reportedBy: string;
  originatedBy: {
    workers?: string;
    fixedEquipment?: string;
    buildings?: string;
    vehicles?: string;
    environmental?: string;
  };
  affectedInterested: string;
  communicatedTo: string[];
  photos: string[];
}

@Component({
  selector: 'app-report-modal',
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
  templateUrl: './report-modal.component.html',
  styleUrls: ['./report-modal.component.scss']
})
export class ReportModalComponent implements OnInit {
  // Estado de carga
  loading = false;
  error: string | null = null;
  
  // Datos del reporte
  reportData: ReportData = {
    reportDate: '',
    worksite: '',
    worksiteName: '',
    professionalResponsible: '',
    incidentType: '',
    potentialSeverity: '',
    action: '',
    description: '',
    requires: '',
    reportedBy: '',
    originatedBy: {},
    affectedInterested: '',
    communicatedTo: [],
    photos: []
  };

  constructor(
    private dialogRef: MatDialogRef<ReportModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReportModalData,
    private proxyService: ProxyService
  ) {}

  ngOnInit(): void {
    this.loadReportData();
  }

  // Cerrar el dialog
  closeDialog(): void {
    this.dialogRef.close();
  }

  // Cargar datos del reporte desde la API
  loadReportData(): void {
    if (!this.data) {
      this.error = 'No se proporcionó un ID válido para consultar';
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    // Obtener la URL base del ambiente
    const baseUrl = environment.apiBaseUrl || 'https://inarco-ssoma.favric.cl';
    
    const url = `${baseUrl}/ws/ReporteIncidenteSvcImpl.php`;
    const body = {
      caso: 'ConsultaRepIncApp',
      id: this.data
    };
    
    console.log('Consultando datos del reporte:', body);
    
    this.proxyService.post<ApiResponse>(url, body)
      .pipe(
        catchError(err => {
          console.error('Error al consultar datos del reporte:', err);
          this.error = 'Error al cargar los datos del reporte de incidente';
          return of(null as any);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((response: ApiResponse | null) => {
        if (response && response.data) {
          console.log('Datos del reporte recibidos:', response.data);
          // Mapear los datos de la respuesta a la estructura reportData
          this.mapResponseToReportData(response.data);
        } else {
          console.error('Error en la respuesta:', response);
          this.error = 'No se encontraron datos para el reporte solicitado';
        }
      });
  }
  
  mapResponseToReportData(responseData: any): void {
    try {
      // Procesar las imágenes si vienen en la respuesta
      let photos: string[] = this.reportData.photos;
      
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
      
      // Extraer los destinatarios del comunicado si existe
      const communicatedTo = responseData.comunicadoA ? 
        (typeof responseData.comunicadoA === 'string' ? 
          responseData.comunicadoA.split(',').map((item: string) => item.trim()) : 
          [responseData.comunicadoA]) : 
        [];

      // Mapear los datos de la respuesta a la estructura del reporte
      this.reportData = {
        reportDate: responseData.fecha || '',
        worksite: responseData.idObra || '',
        worksiteName: responseData.nombreObra || '',
        professionalResponsible: responseData.profesionalResponsable || '',
        incidentType: responseData.tipoIncidente_texto || '',
        potentialSeverity: responseData.potencialGravedad_texto || '',
        action: responseData.accionRealizar_texto || '',
        description: responseData.descripcionAccionRealizar || '',
        requires: responseData.amerita_texto || '',
        reportedBy: responseData.usuario_creador || '',
        originatedBy: {
          workers: responseData.originadoPorTrabajadores || '',
          fixedEquipment: responseData.originadoPorEquiposFijos || '',
          buildings: responseData.originadoPorEdificios || '',
          vehicles: responseData.originadoPorVehiculos || '',
          environmental: responseData.originadoPorAmbientales || ''
        },
        affectedInterested: responseData.interesadosAfectadas || '',
        communicatedTo: communicatedTo,
        photos: photos
      };
    } catch (error) {
      console.error('Error al mapear los datos:', error);
      this.error = 'Error al procesar los datos recibidos';
    }
  }
}

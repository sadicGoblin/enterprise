import { Component, Inject, OnInit, ElementRef, ViewChild } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

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
    MatIconModule,
    MatSnackBarModule,
    HttpClientModule
  ],
  templateUrl: './art-report-modal.component.html',
  styleUrls: ['./art-report-modal.component.scss']
})
export class ARTReportModalComponent implements OnInit {
  @ViewChild('modalContent') modalContent!: ElementRef;
  
  // Estado de carga
  loading = false;
  exporting = false;
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
    private proxyService: ProxyService,
    private http: HttpClient,
    private snackBar: MatSnackBar
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
  
  /**
   * Exporta el contenido del modal a PDF
   */
  exportToPdf(): void {
    if (this.exporting) {
      return;
    }

    this.exporting = true;
    this.snackBar.open('Generando PDF...', '', { duration: 2000 });

    // Obtener el contenido HTML del modal
    const modalContent = document.querySelector('.art-modal-content-container');
    if (!modalContent) {
      this.snackBar.open('Error: No se pudo obtener el contenido del modal', 'Cerrar', { duration: 3000 });
      this.exporting = false;
      return;
    }
    
    // Crear una copia del HTML para manipularlo
    const contentClone = modalContent.cloneNode(true) as HTMLElement;
    
    // Eliminar botones y elementos no necesarios
    const headerActions = contentClone.querySelector('.header-actions');
    if (headerActions && headerActions.parentNode) {
      headerActions.parentNode.removeChild(headerActions);
    }
    
    // Obtener los estilos
    const styles = this.getStyles();
    
    // Crear el HTML completo con estilos
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Actividad</title>
        <style>
          ${styles}
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .art-modal-header {
            background-color: #0c4790;
            color: white;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            border-radius: 5px;
          }
          h2 {
            margin: 0;
            text-align: center;
            width: 100%;
          }
          .info-grid {
            border: 1px solid #eee;
            margin-bottom: 15px;
          }
          .info-row {
            display: flex;
            flex-wrap: wrap;
            border-bottom: 1px solid #eee;
          }
          .info-label {
            font-weight: bold;
            padding: 8px;
            background-color: #f5f5f5;
            flex: 1;
            min-width: 150px;
          }
          .info-value {
            padding: 8px;
            flex: 2;
          }
          .photo-evidence-section h3 {
            color: #0c4790;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          img {
            max-width: 100%;
            height: auto;
            margin-bottom: 10px;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${contentClone.innerHTML}
      </body>
      </html>
    `;
    
    // Crear el objeto para enviar a la API
    const requestBody = {
      html: htmlContent,
      filename: `reporte-actividad-${this.artData.idControl}-${this.artData.dia}.pdf`,
      title: 'Reporte de Actividad',
      sheet_type: 'V'
    };
    
    // Configuración de encabezados para la solicitud HTTP
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Enviar a la API
    this.http.post('/bucket/api/v1/files/html-to-pdf', requestBody, {
      headers: headers,
      responseType: 'blob'
    }).subscribe(
      (response: Blob) => {
        // Crear URL para descargar
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = requestBody.filename;
        link.click();
        
        window.URL.revokeObjectURL(url);
        this.snackBar.open('PDF generado correctamente', '', { duration: 3000 });
        this.exporting = false;
      },
      (error) => {
        console.error('Error al generar PDF:', error);
        this.snackBar.open('Error al generar el PDF', 'Cerrar', { duration: 3000 });
        this.exporting = false;
      }
    );
  }
  
  /**
   * Obtiene los estilos CSS relevantes para el PDF
   */
  private getStyles(): string {
    // Seleccionar los elementos de estilo relevantes
    const styleSheets = document.styleSheets;
    let styles = '';
    
    // Filtrar los estilos relevantes para el modal
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const rules = styleSheets[i].cssRules || styleSheets[i].rules;
        if (!rules) continue;
        
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j];
          if (rule.cssText && (
              rule.cssText.includes('.art-modal-header') ||
              rule.cssText.includes('.art-modal-content') ||
              rule.cssText.includes('.info-container') ||
              rule.cssText.includes('.info-card') ||
              rule.cssText.includes('.info-row') ||
              rule.cssText.includes('.info-label') ||
              rule.cssText.includes('.info-value')
            )) {
            styles += rule.cssText + '\n';
          }
        }
      } catch (e) {
        // Algunos navegadores restringen acceso a ciertos stylesheets
        console.warn('No se pudo acceder a la hoja de estilo', e);
      }
    }
    
    return styles;
  }
}

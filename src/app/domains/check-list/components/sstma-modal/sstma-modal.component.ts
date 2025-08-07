import {
  Component,
  Inject,
  OnInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { ImgViewerComponent } from '../../../../shared/components/img-viewer/img-viewer.component';
import { ProxyService } from '../../../../core/services/proxy.service';
import { environment } from '../../../../../environments/environment';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';

// Interfaz para los datos que se reciben como parámetro
type SstmaModalData = number; // Solo recibimos el ID de la actividad

// Interfaz para la respuesta de la API
interface ApiResponse {
  code: number;
  data: any;
  url?: string;
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
    MatIconModule,
    MatSnackBarModule,
    HttpClientModule,
  ],
  templateUrl: './sstma-modal.component.html',
  styleUrls: ['./sstma-modal.component.scss'],
})
export class SstmaModalComponent implements OnInit {
  @ViewChild('modalContent') modalContent!: ElementRef;

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
    photos: [],
  };

  loading = false;
  exporting = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<SstmaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SstmaModalData,
    private proxyService: ProxyService,
    private http: HttpClient,
    private snackBar: MatSnackBar
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
      id: this.data,
    };

    console.log('Consultando datos SSTMA:', body);

    this.proxyService
      .post<ApiResponse>(url, body)
      .pipe(
        catchError((err) => {
          console.error('Error al consultar datos SSTMA:', err);
          this.error = 'Error al cargar los datos de inspección SSTMA';
          return of(null as any);
        }),
        finalize(() => (this.loading = false))
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
        professionalResponsible:
          responseData.profesionalResponsable ||
          this.sstmaData.professionalResponsible,
        workArea: responseData.areaTrabajo || this.sstmaData.workArea,
        detectedCondition:
          responseData.condicionDetectada || this.sstmaData.detectedCondition,
        associatedWork:
          responseData.trabajoAsociado || this.sstmaData.associatedWork,
        associatedRisk:
          responseData.riesgoAsociado || this.sstmaData.associatedRisk,
        proposedControlMeasure:
          responseData.medidaControl || this.sstmaData.proposedControlMeasure,
        communicatedTo: responseData.comunicadoA
          ? Array.isArray(responseData.comunicadoA)
            ? responseData.comunicadoA
            : responseData.comunicadoA.split(',')
          : this.sstmaData.communicatedTo,
        photos: photos, // Usar las imágenes procesadas
      };
    } catch (error) {
      console.error('Error al mapear los datos:', error);
      this.error = 'Error al procesar los datos recibidos';
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
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
    const modalContent = document.querySelector('.modal-main-content');
    if (!modalContent) {
      this.snackBar.open(
        'Error: No se pudo obtener el contenido del modal',
        'Cerrar',
        { duration: 3000 }
      );
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

    // Convertir las imágenes en enlaces clickeables
    const images = contentClone.querySelectorAll('img');
    images.forEach((img) => {
      const imgSrc = img.getAttribute('src');
      if (imgSrc) {
        // Crear un enlace que envuelva la imagen
        const link = document.createElement('a');
        link.href = imgSrc;
        link.target = '_blank'; // Abrir en nueva pestaña
        link.title = 'Haga clic para ver la imagen original';

        // Reemplazar la imagen con el enlace + imagen
        const parent = img.parentNode;
        if (parent) {
          parent.replaceChild(link, img);
          link.appendChild(img);
        }
      }
    });

    // Obtener los estilos
    const styles = this.getStyles();

    // Crear el HTML completo con estilos
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Inspección SSTMA</title>
        <style>
          ${styles}
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .modal-header {
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
            cursor: pointer;
          }
          a {
            color: inherit;
            text-decoration: none;
            display: inline-block;
            border: 2px solid transparent;
          }
          a:hover img {
            border: 2px solid #0c4790;
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
      filename: `reporte-inspeccion-sstma.pdf`,
      title: 'Reporte de Inspección SSTMA',
      sheet_type: 'V',
    };

    // Call API to change password
    this.proxyService
      .post(
        environment.apiBaseUrl + '/bucket/api/v1/files/html-to-pdf',
        requestBody
      )
      .subscribe({
        next: (response: any) => {
          this.exporting = false;
          if (response) {
            console.log('PDF generado correctamente', response);
            let url = response.url;
            window.open(url, '_blank');
            this.snackBar.open('PDF generado correctamente', '', {
              duration: 3000,
            });
          } else {
            console.log('Error al generar PDF', response);
            this.snackBar.open('Error al generar PDF', '', {
              duration: 3000,
            });
          }
        },
      });
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
          if (
            rule.cssText &&
            (rule.cssText.includes('.modal-header') ||
              rule.cssText.includes('.modal-content') ||
              rule.cssText.includes('.info-grid') ||
              rule.cssText.includes('.info-row') ||
              rule.cssText.includes('.info-label') ||
              rule.cssText.includes('.info-value') ||
              rule.cssText.includes('.photo-evidence-section'))
          ) {
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

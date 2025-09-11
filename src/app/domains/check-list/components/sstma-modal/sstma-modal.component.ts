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
type SstmaModalData = string | number | { idControl: string, day: number }; // ID simple desde reports o objeto desde planification

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
  idControl: string;
  etapaConst: string;
  ambito: string;
  actividad: string;
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
    idControl: '',
    etapaConst: '',
    ambito: '',
    actividad: '',
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
    
    // Determinar si los datos vienen desde reports (string/número) o planification (objeto)
    let body: any;
    if (typeof this.data === 'object' && this.data !== null && 'idControl' in this.data && 'day' in this.data) {
      // Viene desde planification table
      body = {
        caso: 'ConsultaInspeccionSSOMA',
        idControl: this.data.idControl,
        dia: this.data.day
      };
      console.log('Consultando datos SSTMA desde Planification:', body);
    } else {
      // Viene desde reports table (string o number)
      body = {
        caso: 'ConsultaSTTMAApp',
        id: this.data,
      };
      console.log('Consultando datos SSTMA desde Reports:', body);
    }

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
        idControl: responseData.idControl || '',
        etapaConst: responseData.EtapaConst || '',
        ambito: responseData.Ambito || '',
        actividad: responseData.Actividad || '',
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

    // Extraer las imágenes originales del componente app-img-viewer
    const photoSection = contentClone.querySelector('.photo-evidence-section');
    const imgViewerComponents = contentClone.querySelectorAll('app-img-viewer');
    
    // Reemplazar cada app-img-viewer con las imágenes originales directamente
    imgViewerComponents.forEach((component: Element) => {
      if (component.parentNode) {
        // Obtener la lista de URLs de imágenes del componente SSTMA
        const imageUrls = this.sstmaData.photos || [];
        
        if (imageUrls && imageUrls.length > 0) {
          // Crear un nuevo contenedor para las imágenes con layout en cuadrícula
          const imagesContainer = document.createElement('div');
          imagesContainer.className = 'pdf-images-container';
          imagesContainer.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 10px; margin-top: 20px; padding: 10px;';
          
          // Para cada imagen, crear dos versiones - una horizontal y una vertical
          // Procesar cada imagen con tamaño fijo 300x300 para mantener consistencia
          imageUrls.forEach((imgUrl: string, index: number) => {
            // Contenedor principal para la imagen que evita saltos de página
            const imageWrapper = document.createElement('div');
            imageWrapper.style.cssText = 'page-break-inside: avoid; margin-bottom: 30px; text-align: center; display: inline-block; width: 320px; margin-right: 20px;';
            
            // Contenedor con tamaño fijo para la imagen
            const fixedContainer = document.createElement('div');
            fixedContainer.style.cssText = 'width: 300px; height: 300px; margin: 0 auto; border: 2px solid #ddd; border-radius: 8px; overflow: hidden; position: relative; background: #f5f5f5;';
            
            // Crear un enlace contenedor que envuelva la imagen
            const imageLink = document.createElement('a');
            imageLink.href = imgUrl;
            imageLink.target = '_blank';
            imageLink.style.cssText = 'display: block; width: 100%; height: 100%; text-decoration: none;';
            
            // Imagen con tamaño fijo y object-fit: cover para llenar el espacio
            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = `Evidencia fotográfica ${index + 1}`;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;';
            
            // Agregar imagen al enlace y enlace al contenedor
            imageLink.appendChild(img);
            fixedContainer.appendChild(imageLink);
            imageWrapper.appendChild(fixedContainer);
            
            // Agregar texto descriptivo debajo de la imagen
            const imageLabel = document.createElement('div');
            imageLabel.style.cssText = 'margin-top: 8px; font-size: 12px; color: #333; text-align: center; font-weight: bold;';
            imageLabel.textContent = `Imagen ${index + 1}`;
            imageWrapper.appendChild(imageLabel);
            
            // Agregar texto de enlace debajo
            const linkText = document.createElement('a');
            linkText.href = imgUrl;
            linkText.target = '_blank';
            linkText.style.cssText = 'display: block; margin: 5px auto 0; font-size: 11px; color: #0c4790; text-align: center; text-decoration: none;';
            linkText.textContent = 'Ver imagen completa';
            imageWrapper.appendChild(linkText);
            
            // Agregar al contenedor principal
            imagesContainer.appendChild(imageWrapper);
          });
          
          // Reemplazar el componente app-img-viewer con nuestro nuevo contenedor
          component.parentNode.replaceChild(imagesContainer, component);
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
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 16px;
            color: #333;
          }
          .modal-header {
            background-color: #0c4790;
            color: white;
            padding: 16px;
            border-radius: 4px;
            margin-bottom: 16px;
            text-align: center;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
            margin-bottom: 16px;
          }
          .info-row {
            display: flex;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
          }
          .info-label {
            font-weight: bold;
            padding: 8px;
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
          .img-viewer-container {
            display: block !important;
          }
          img {
            max-height: 500px;
            width: auto !important;
            display: block;
            margin: 0 auto;
            image-orientation: from-image;
            object-fit: contain;
          }
          
          /* Contenedor para las imágenes para mantener orientación */
          .photo-evidence-section img {
            max-height: 500px; /* Altura máxima para fotos verticales */
            width: auto !important;
            display: block;
            margin: 0 auto 20px auto;
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
          
          /* Estilos específicos para el contenedor de imágenes PDF */
          .pdf-images-container {
            display: flex !important;
            flex-wrap: wrap !important;
            justify-content: flex-start !important;
            gap: 10px !important;
            margin-top: 20px !important;
            padding: 10px !important;
          }
          
          .pdf-images-container img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            display: block !important;
            transform-origin: center !important;
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
      sheet_type: 'V', // V para vertical (valor correcto para la API)
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

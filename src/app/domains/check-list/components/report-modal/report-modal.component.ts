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
  identCausas: string;
  idControl: string;
  etapaConst: string;
  ambito: string;
  actividad: string;
  empresa: string;
  sector: string;
  riesgo: string;
  personasInvolucradas: string;
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
    MatIconModule,
    MatSnackBarModule,
    HttpClientModule,
  ],
  templateUrl: './report-modal.component.html',
  styleUrls: ['./report-modal.component.scss'],
})
export class ReportModalComponent implements OnInit {
  @ViewChild('modalContent') modalContent!: ElementRef;

  // Estado de carga
  loading = false;
  exporting = false;
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
    identCausas: '',
    idControl: '',
    etapaConst: '',
    ambito: '',
    actividad: '',
    empresa: '',
    sector: '',
    riesgo: '',
    personasInvolucradas: '',
    affectedInterested: '',
    communicatedTo: [],
    photos: [],
  };

  constructor(
    private dialogRef: MatDialogRef<ReportModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReportModalData,
    private proxyService: ProxyService,
    private http: HttpClient,
    private snackBar: MatSnackBar
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
      id: this.data,
    };

    console.log('Consultando datos del reporte:', body);

    this.proxyService
      .post<ApiResponse>(url, body)
      .pipe(
        catchError((err) => {
          console.error('Error al consultar datos del reporte:', err);
          this.error = 'Error al cargar los datos del reporte de incidente';
          return of(null as any);
        }),
        finalize(() => (this.loading = false))
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
      const communicatedTo = responseData.comunicadoA
        ? typeof responseData.comunicadoA === 'string'
          ? responseData.comunicadoA
              .split(',')
              .map((item: string) => item.trim())
          : [responseData.comunicadoA]
        : [];

      // Mapear los datos de la respuesta a la estructura del reporte
      this.reportData = {
        reportDate: responseData.fecha || '',
        worksite: responseData.IdObra || '',
        worksiteName: responseData.Obra || '',
        professionalResponsible: responseData.profesionalResponsable || '',
        incidentType: responseData.tipoIncidente_texto || '',
        potentialSeverity: responseData.potencialGravedad_texto || '',
        action: responseData.accionRealizar_texto || '',
        description: responseData.situacionObservada || '',
        requires: responseData.amerita_texto || '',
        reportedBy: responseData.usuario_creador || '',
        identCausas: responseData.ident_causas || '',
        idControl: responseData.idControl || '',
        etapaConst: responseData.EtapaConst || '',
        ambito: responseData.Ambito || '',
        actividad: responseData.Actividad || '',
        empresa: responseData.empresa || '',
        sector: responseData.sector || '',
        riesgo: responseData.riesgo || '',
        personasInvolucradas: responseData.personas_involucradas || '',
        affectedInterested: responseData.interesadosAfectadas || '',
        communicatedTo: communicatedTo,
        photos: photos,
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
    const modalContent = document.querySelector('.report-modal-content');
    console.log('Elemento encontrado para PDF:', modalContent);

    if (!modalContent) {
      // Intenta de nuevo con un selector más específico
      const alternativeSelector = document.querySelector(
        '.report-modal-container div:not(.loading-container):not(.error-container)'
      );
      console.log('Intentando selector alternativo:', alternativeSelector);

      if (alternativeSelector) {
        console.log('Encontrado selector alternativo, usando este elemento');
        // Continuar con el selector alternativo
        const contentClone = alternativeSelector.cloneNode(true) as HTMLElement;
        this.processPdfExport(contentClone);
        return;
      }

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
    this.processPdfExport(contentClone);
  }

  /**
   * Procesa la exportación a PDF con el contenido clonado
   */
  private processPdfExport(contentClone: HTMLElement): void {
    // Eliminar botones y elementos no necesarios
    const headerActions = contentClone.querySelector('.header-actions');
    if (headerActions && headerActions.parentNode) {
      headerActions.parentNode.removeChild(headerActions);
    }

    // Crear el header para el PDF
    const pdfHeader = document.createElement('div');
    pdfHeader.className = 'modal-header';
    pdfHeader.innerHTML = '<h2>REPORTE DE INCIDENTE</h2>';
    
    // Insertar el header al principio del contenido
    contentClone.insertBefore(pdfHeader, contentClone.firstChild);

    // Reemplazar las imágenes con contenedores de tamaño fijo para mejor presentación en PDF
    const imgViewerComponents = contentClone.querySelectorAll('app-img-viewer');
    
    // Si hay componentes app-img-viewer, reemplazarlos con imágenes directas
    imgViewerComponents.forEach((component: Element) => {
      if (component.parentNode) {
        // Obtener las imágenes desde el componente actual o desde reportData si está disponible
        const existingImages = component.querySelectorAll('img');
        let imageUrls: string[] = [];
        
        // Extraer URLs de las imágenes existentes
        existingImages.forEach(img => {
          const src = img.getAttribute('src');
          if (src) imageUrls.push(src);
        });
        
        // Si tenemos imágenes del reportData, usarlas (asumiendo estructura similar)
        if (this.reportData && this.reportData.photos && this.reportData.photos.length > 0) {
          imageUrls = this.reportData.photos;
        }
        
        if (imageUrls && imageUrls.length > 0) {
          // Crear un nuevo contenedor para las imágenes con layout en cuadrícula
          const imagesContainer = document.createElement('div');
          imagesContainer.className = 'pdf-images-container';
          imagesContainer.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 10px; margin-top: 20px; padding: 10px;';
          
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

    // También procesar las imágenes regulares que no están en app-img-viewer
    const images = contentClone.querySelectorAll('img:not(.pdf-images-container img)');
    console.log('Imágenes encontradas para enlaces:', images.length);

    images.forEach((img) => {
      const imgSrc = img.getAttribute('src');
      if (imgSrc) {
        // Crear un enlace que envuelva la imagen
        const link = document.createElement('a');
        link.href = imgSrc;
        link.target = '_blank';
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
        <title>Reporte de Incidente</title>
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
            padding: 16px;
            border-radius: 4px;
            margin-bottom: 16px;
            text-align: center;
          }
          .report-modal-header {
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
      filename: `reporte-incidente-$.pdf`,
      title: 'Reporte de Incidente',
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
            (rule.cssText.includes('.report-modal-header') ||
              rule.cssText.includes('.report-modal-content') ||
              rule.cssText.includes('.info-container') ||
              rule.cssText.includes('.info-grid') ||
              rule.cssText.includes('.info-row') ||
              rule.cssText.includes('.info-label') ||
              rule.cssText.includes('.info-value'))
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

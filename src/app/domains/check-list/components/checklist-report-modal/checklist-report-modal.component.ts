import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProxyService } from '../../../../core/services/proxy.service';
import { environment } from '../../../../../environments/environment';
import { ImgViewerComponent } from '../../../../shared/components/img-viewer/img-viewer.component';

interface ChecklistItem {
  idElementoInspeccionar: number;
  pregunta: string;
  si: number;
  no: number;
  na: number;
}

interface ChecklistData {
  IdControl: string;
  IdObra: string;
  Obra: string;
  IdUsuario: string;
  Usuario: string;
  Periodo: string;
  IdEtapaConst: string;
  EtapaConst: string;
  IdSubProceso: string;
  SubProceso: string;
  IdAmbito: string;
  Ambito: string;
  IdActividad: string;
  Actividad: string;
  IdPeriocidad: string;
  Periocidad: string;
  revisado_por: string;
  inspeccionado_por: string;
  fecha_revision: string;
  observaciones: string;
  fecha_realizado: string;
  id_actividad_realizada: string;
  items: ChecklistItem[];
  files: string[];
}

interface ChecklistResponse {
  success: boolean;
  code: number;
  message: string;
  data: ChecklistData;
}

@Component({
  selector: 'app-checklist-report-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    ImgViewerComponent
  ],
  templateUrl: './checklist-report-modal.component.html',
  styleUrl: './checklist-report-modal.component.scss'
})
export class ChecklistReportModalComponent implements OnInit {
  checklistData: ChecklistData | null = null;
  isLoading = true;
  error: string | null = null;
  exporting = false;

  constructor(
    private proxyService: ProxyService,
    private dialogRef: MatDialogRef<ChecklistReportModalComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) private idControl: string
  ) {}

  ngOnInit(): void {
    this.loadChecklistData();
  }

  /**
   * Carga los datos del checklist desde la API
   */
  loadChecklistData(): void {
    this.isLoading = true;
    this.error = null;

    const requestBody = {
      caso: 'GetControlChecklist',
      idControl: parseInt(this.idControl)
    };

    console.log('Cargando datos de checklist:', requestBody);

    this.proxyService.post<ChecklistResponse>(
      environment.apiBaseUrl + '/ws/ControlSvcImpl.php',
      requestBody
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Respuesta de checklist:', response);
        
        if (response.success && response.data) {
          this.checklistData = response.data;
        } else {
          this.error = response.message || 'No se encontraron datos para este checklist';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.error = 'Error al cargar los datos del checklist';
        console.error('Error cargando checklist:', error);
      }
    });
  }

  /**
   * Formatea el período de YYYYMM a texto legible
   */
  formatPeriod(period: string | undefined): string {
    if (!period || period.length !== 6) return period || '';

    const year = period.substring(0, 4);
    const month = parseInt(period.substring(4, 6));
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    if (month >= 1 && month <= 12) {
      return `${monthNames[month - 1]} ${year}`;
    }
    
    return period;
  }

  /**
   * Formatea la fecha
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString || dateString === '0001-01-01') return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL');
    } catch {
      return dateString;
    }
  }

  /**
   * Obtiene el estado de un item (Sí, No, N.A.)
   */
  getItemStatus(item: ChecklistItem): string {
    if (item.si === 1) return 'Sí';
    if (item.no === 1) return 'No';
    if (item.na === 1) return 'N.A.';
    return '-';
  }

  /**
   * Obtiene la clase CSS para el estado del item
   */
  getStatusClass(item: ChecklistItem): string {
    if (item.si === 1) return 'status-si';
    if (item.no === 1) return 'status-no';
    if (item.na === 1) return 'status-na';
    return '';
  }

  /**
   * Exporta el checklist a PDF
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

    // Reemplazar íconos de material "check" con símbolos Unicode
    const checkIcons = contentClone.querySelectorAll('mat-icon');
    checkIcons.forEach((icon) => {
      if (icon.textContent?.trim() === 'check') {
        const checkSymbol = document.createElement('span');
        checkSymbol.textContent = '✓';
        checkSymbol.style.cssText = 'color: #4CAF50; font-weight: bold; font-size: 16px;';
        if (icon.parentNode) {
          icon.parentNode.replaceChild(checkSymbol, icon);
        }
      }
    });

    // Extraer las imágenes originales del componente app-img-viewer
    const photoSection = contentClone.querySelector('.photo-evidence-section');
    const imgViewerComponents = contentClone.querySelectorAll('app-img-viewer');
    
    // Reemplazar cada app-img-viewer con las imágenes originales directamente
    imgViewerComponents.forEach((component: Element) => {
      if (component.parentNode) {
        // Obtener la lista de URLs de imágenes del checklist
        const imageUrls = this.checklistData?.files || [];
        
        if (imageUrls && imageUrls.length > 0) {
          // Crear un nuevo contenedor para las imágenes con layout en cuadrícula
          const imagesContainer = document.createElement('div');
          imagesContainer.className = 'pdf-images-container';
          imagesContainer.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 10px; margin-top: 20px; padding: 10px;';
          
          // Para cada imagen, crear contenedor con tamaño fijo 300x300
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
          .modal-header h2 {
            margin: 0;
            color: white;
          }
          .info-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            border: 1px solid #eee;
          }
          .info-row {
            display: table;
            width: 100%;
            border-bottom: 1px solid #eee;
          }
          .info-row:nth-child(odd) {
            background-color: rgba(0, 0, 0, 0.02);
          }
          .info-label {
            display: table-cell;
            font-weight: bold;
            padding: 8px;
            border-right: 1px solid #eee;
            background-color: #f8f9fa;
            width: 20%;
            vertical-align: top;
          }
          .info-value {
            display: table-cell;
            padding: 8px;
            border-right: 1px solid #eee;
            width: 30%;
            vertical-align: top;
          }
          .info-header {
            background-color: #f5f5f5;
            padding: 8px 16px;
            border-bottom: 1px solid #e0e0e0;
            margin-bottom: 16px;
          }
          .checklist-items-section h3,
          .photo-evidence-section h3 {
            color: #0c4790;
            margin: 20px 0 10px 0;
            border-bottom: 2px solid #0c4790;
            padding-bottom: 5px;
          }
          .checklist-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            table-layout: fixed;
          }
          .checklist-table th,
          .checklist-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          .checklist-table th {
            background-color: #0c4790;
            color: white;
            font-weight: bold;
          }
          .checklist-table .question-column {
            width: 60%;
          }
          .checklist-table .status-column {
            width: 13.33%;
            text-align: center;
          }
          .checklist-table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .status-cell {
            text-align: center;
            vertical-align: middle;
          }
          .status-indicator {
            display: inline-block;
            font-size: 16px;
            color: #4CAF50;
            font-weight: bold;
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
      filename: `reporte-checklist-${this.idControl}.pdf`,
      title: 'Reporte de Checklist',
      sheet_type: 'V', // V para vertical
    };

    // Llamar a la API para generar el PDF
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
        error: (error) => {
          this.exporting = false;
          console.error('Error al generar PDF:', error);
          this.snackBar.open('Error al generar PDF', 'Cerrar', {
            duration: 3000,
          });
        }
      });
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.dialogRef.close();
  }
}

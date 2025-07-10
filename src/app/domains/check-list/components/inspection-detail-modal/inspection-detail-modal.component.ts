import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InspeccionSSTMA } from '../../models/actividad.models';
import { InspectionTableComponent } from '../inspection-table/inspection-table.component';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-inspection-detail-modal',
  templateUrl: './inspection-detail-modal.component.html',
  styleUrls: ['./inspection-detail-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    InspectionTableComponent
  ]
})
export class InspectionDetailModalComponent implements OnInit {
  // Datos de la inspección
  inspeccion: InspeccionSSTMA | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  // Detalles formateados para mostrar en la vista
  fechaFormateada: string = '';
  
  constructor(
    public dialogRef: MatDialogRef<InspectionDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.loadInspectionData();
  }

  /**
   * Carga los datos de inspección desde los datos del diálogo
   */
  loadInspectionData(): void {
    this.isLoading = true;
    
    try {
      if (this.data && this.data.inspectionData) {
        // Asignar la información de inspección
        this.inspeccion = this.data.inspectionData;
        
        // Formatear la fecha para la vista
        if (this.inspeccion && this.inspeccion.fecha) {
          this.fechaFormateada = this.formatDate(this.inspeccion.fecha);
        }
      } else {
        this.errorMessage = 'No se recibieron datos de inspección';
      }
    } catch (error) {
      console.error('Error al procesar los datos de inspección:', error);
      this.errorMessage = 'Error al procesar los datos de inspección';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Formatea una fecha al formato DD-MM-YYYY
   * @param date Fecha a formatear
   * @returns Fecha formateada como string
   */
  private formatDate(date: string | Date): string {
    try {
      return formatDate(date, 'dd-MM-yyyy', 'es-CL');
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  /**
   * Genera y exporta un PDF con los datos de inspección
   */
  exportToPDF(): void {
    if (!this.inspeccion) return;

    // Abrir una ventana de impresión con los datos formateados para PDF
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor permita las ventanas emergentes para imprimir.');
      return;
    }

    // Obtener datos para la impresión
    const titulo = 'Inspección SSTMA';
    const fecha = this.fechaFormateada;
    const obra = this.inspeccion.Obra || 'N/A';
    const areaTrabajo = this.inspeccion.areaTrabajo || 'N/A';
    const riesgoAsociado = this.inspeccion.riesgoAsociado || 'N/A';
    const potencialGravedad = this.inspeccion.potencialGravedad || 'N/A';
    const ambitoInvolucrado = this.inspeccion.ambitoInvolucrado || 'N/A';
    const medidaControl = this.inspeccion.medidaControl || 'N/A';
    const profesionalResponsable = this.inspeccion.profesionalResponsable || 'N/A';
    const usuario = this.inspeccion.usuarioCreacion || 'N/A';

    // Crear el HTML para la impresión
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>${titulo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
              font-size: 12px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #ccc;
            }
            .title {
              font-size: 20px;
              font-weight: bold;
              color: #1976d2;
              margin: 0;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .info-table td {
              padding: 5px 10px;
              border: 1px solid #ddd;
            }
            .label {
              font-weight: bold;
              background-color: #f5f5f5;
              width: 30%;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .data-table th {
              background-color: #f5f5f5;
              font-weight: bold;
              text-align: left;
              padding: 8px;
              border: 1px solid #ddd;
            }
            .data-table td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            .footer {
              margin-top: 30px;
              text-align: right;
              font-style: italic;
            }
            .no-print {
              margin-top: 20px;
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                margin: 0;
                padding: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${titulo}</h1>
            <div>Fecha: ${fecha}</div>
          </div>
          
          <table class="info-table">
            <tr>
              <td class="label">Obra</td>
              <td>${obra}</td>
              <td class="label">Área de Trabajo</td>
              <td>${areaTrabajo}</td>
            </tr>
            <tr>
              <td class="label">Riesgo Asociado</td>
              <td>${riesgoAsociado}</td>
              <td class="label">Potencial Gravedad</td>
              <td>${potencialGravedad}</td>
            </tr>
            <tr>
              <td class="label">Ámbito Involucrado</td>
              <td>${ambitoInvolucrado}</td>
              <td class="label">Medida Control</td>
              <td>${medidaControl}</td>
            </tr>
            <tr>
              <td class="label">Profesional Responsable</td>
              <td>${profesionalResponsable}</td>
              <td class="label">Usuario</td>
              <td>${usuario}</td>
            </tr>
          </table>
          
          <div class="footer">
            <p>Documento generado el ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="no-print">
            <button onclick="window.print(); setTimeout(() => window.close(), 500);">Imprimir PDF</button>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Esperar a que se cargue el contenido y luego dar el foco
    setTimeout(() => {
      printWindow.focus();
    }, 500);
  }

  /**
   * Cierra el diálogo
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}

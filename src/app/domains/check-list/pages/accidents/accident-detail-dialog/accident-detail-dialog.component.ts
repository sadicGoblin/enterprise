import { Component, Inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AccidenteApiResponse } from '../models/accident.model';

@Component({
  selector: 'app-accident-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './accident-detail-dialog.component.html',
  styleUrl: './accident-detail-dialog.component.scss'
})
export class AccidentDetailDialogComponent {
  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef;
  isExporting = false;

  constructor(
    public dialogRef: MatDialogRef<AccidentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccidenteApiResponse
  ) {}

  get estadoLabel(): string {
    const labels: Record<string, string> = {
      'Reportado': 'Reportado',
      'En_Investigacion': 'En Investigación',
      'Cerrado': 'Cerrado',
      'Anulado': 'Anulado'
    };
    return labels[this.data.Estado] || this.data.Estado;
  }

  get estadoClass(): string {
    const classes: Record<string, string> = {
      'Reportado': 'estado-reportado',
      'En_Investigacion': 'estado-investigacion',
      'Cerrado': 'estado-cerrado',
      'Anulado': 'estado-anulado'
    };
    return classes[this.data.Estado] || '';
  }

  get gravedadClass(): string {
    const ps = this.data.CalificacionPS;
    if (!ps) return '';
    const classes: Record<string, string> = {
      'Leve': 'gravedad-leve',
      'Menor': 'gravedad-menor',
      'Importante': 'gravedad-importante',
      'Grave': 'gravedad-grave',
      'Fatal': 'gravedad-fatal'
    };
    return classes[ps] || '';
  }

  get controlesAplicados(): string[] {
    const controles: string[] = [];
    if (this.data.CtrlE === '1') controles.push('Eliminación');
    if (this.data.CtrlS === '1') controles.push('Sustitución');
    if (this.data.CtrlI === '1') controles.push('Ingeniería de Control');
    if (this.data.CtrlA === '1') controles.push('Administración');
    if (this.data.CtrlEPP === '1') controles.push('EPP');
    return controles;
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    const d = new Date(date + 'T00:00:00');
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatTime(time: string | null): string {
    if (!time) return '-';
    return time.substring(0, 5);
  }

  async exportToPdf(): Promise<void> {
    if (!this.pdfContent?.nativeElement) return;
    this.isExporting = true;

    try {
      const element = this.pdfContent.nativeElement as HTMLElement;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 190; // A4 width minus margins (mm)
      const pageHeight = 277; // A4 height minus margins (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 10; // top margin

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const numero = this.data.NumeroAccidente || 'accidente';
      const fecha = new Date().toISOString().split('T')[0];
      pdf.save(`Accidente_${numero}_${fecha}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    } finally {
      this.isExporting = false;
    }
  }
}

import { Component, Inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef<HTMLElement>;
  isExporting = false;

  /** Fijado al abrir el diálogo (texto estable en pie de página). */
  readonly generatedAtLabel = new Date().toLocaleString('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  private readonly pdfMarginMm = 8;
  private readonly pdfPageHeightMm = 297;
  private readonly pdfImgWidthMm = 194;
  private readonly blockGapMm = 4;

  constructor(
    public dialogRef: MatDialogRef<AccidentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccidenteApiResponse
  ) {}

  get estadoLabel(): string {
    const labels: Record<string, string> = {
      'Reportado': 'Reportado',
      'En_Investigacion': 'En Investigación',
      'Cerrado': 'Cerrado',
      'anulado': 'Anulado',
      'Anulado': 'Anulado'
    };
    return labels[this.data.Estado] || this.data.Estado;
  }

  get estadoClass(): string {
    const classes: Record<string, string> = {
      'Reportado': 'estado-reportado',
      'En_Investigacion': 'estado-investigacion',
      'Cerrado': 'estado-cerrado',
      'anulado': 'estado-anulado',
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
    if (this.data.CtrlI === '1') controles.push('Ingeniería de control');
    if (this.data.CtrlA === '1') controles.push('Administración');
    if (this.data.CtrlEPP === '1') controles.push('EPP');
    return controles;
  }

  /**
   * Día de la semana: usa el valor del backend si viene; si no, lo calcula desde FechaAccidente.
   */
  get diaSemanaDisplay(): string {
    const raw = this.data.DiaSemana;
    if (raw != null && String(raw).trim() !== '') {
      return String(raw).trim();
    }
    const fecha = this.data.FechaAccidente;
    if (!fecha) return '—';
    const d = new Date(fecha + 'T00:00:00');
    if (isNaN(d.getTime())) return '—';
    const long = d.toLocaleDateString('es-CL', { weekday: 'long' });
    return long ? long.charAt(0).toUpperCase() + long.slice(1) : '—';
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    const d = new Date(date + 'T00:00:00');
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatTime(time: string | null): string {
    if (!time) return '—';
    return time.substring(0, 5);
  }

  async exportToPdf(): Promise<void> {
    const root = this.pdfContent?.nativeElement;
    if (!root) return;
    this.isExporting = true;

    try {
      const blocks = Array.from(root.querySelectorAll<HTMLElement>('.pdf-block'));
      const targets = blocks.length > 0 ? blocks : [root];

      const pdf = new jsPDF('p', 'mm', 'a4');
      let yMm = this.pdfMarginMm;

      for (let i = 0; i < targets.length; i++) {
        if (i > 0) {
          yMm += this.blockGapMm;
          if (yMm > this.contentBottomMm - 8) {
            pdf.addPage();
            yMm = this.pdfMarginMm;
          }
        }

        const canvas = await html2canvas(targets[i], {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0
        });

        yMm = this.appendCanvasPaginated(pdf, canvas, yMm);
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

  private get contentBottomMm(): number {
    return this.pdfPageHeightMm - this.pdfMarginMm;
  }

  /**
   * Inserta el canvas en el PDF, cortando por franjas que caben en la página
   * (evita el “corte ciego” a mitad de secciones cuando cada bloque es una sección).
   */
  private appendCanvasPaginated(pdf: jsPDF, canvas: HTMLCanvasElement, startYMm: number): number {
    const imgW = this.pdfImgWidthMm;
    const totalHmm = (canvas.height / canvas.width) * imgW;
    const pxPerMm = canvas.height / totalHmm;

    let srcY = 0;
    let yMm = startYMm;

    while (srcY < canvas.height) {
      let spaceMm = this.contentBottomMm - yMm;
      if (spaceMm < 6) {
        pdf.addPage();
        yMm = this.pdfMarginMm;
        spaceMm = this.contentBottomMm - yMm;
      }

      const remainingPx = canvas.height - srcY;
      const remainingMm = remainingPx / pxPerMm;
      const sliceMm = Math.min(spaceMm, remainingMm);
      let slicePx = Math.round(sliceMm * pxPerMm);
      if (slicePx < 1) slicePx = 1;
      if (slicePx > remainingPx) slicePx = remainingPx;

      slicePx = this.refineSliceAtLightRow(canvas, srcY, slicePx, remainingPx);

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = slicePx;
      const ctx = sliceCanvas.getContext('2d');
      if (!ctx) break;
      ctx.drawImage(canvas, 0, srcY, canvas.width, slicePx, 0, 0, canvas.width, slicePx);

      const drawnHmm = (slicePx / canvas.height) * totalHmm;
      pdf.addImage(sliceCanvas.toDataURL('image/png', 1.0), 'PNG', this.pdfMarginMm, yMm, imgW, drawnHmm);

      srcY += slicePx;
      yMm += drawnHmm;
    }

    return yMm;
  }

  /**
   * Acerca el corte a una franja clara (entre líneas / margen) en el borde inferior del trozo.
   */
  private refineSliceAtLightRow(
    canvas: HTMLCanvasElement,
    srcY: number,
    slicePx: number,
    remainingPx: number
  ): number {
    const search = Math.min(56, slicePx - 6);
    if (search < 14) return slicePx;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return slicePx;

    const w = canvas.width;
    const yEnd = srcY + slicePx;

    for (let y = yEnd - 1; y > yEnd - search; y--) {
      if (y < srcY) break;
      const row = ctx.getImageData(0, y, w, 1).data;
      let sum = 0;
      for (let i = 0; i < row.length; i += 4) {
        sum += row[i] + row[i + 1] + row[i + 2];
      }
      const avg = sum / (w * 3);
      if (avg > 244) {
        const candidate = y - srcY + 1;
        if (candidate >= 36) {
          return Math.min(candidate, remainingPx);
        }
      }
    }
    return slicePx;
  }
}


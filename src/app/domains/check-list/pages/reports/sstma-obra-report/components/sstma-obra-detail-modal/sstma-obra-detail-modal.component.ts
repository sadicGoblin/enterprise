import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SstmaObraReport } from '../../sstma-obra-report.component';

@Component({
  selector: 'app-sstma-obra-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="modal-container">
      <!-- Header -->
      <div class="report-header">
        <h2>REPORTE SSTMA OBRA</h2>
        <div class="header-actions">
          <button mat-icon-button (click)="close()" class="close-btn">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- Info section -->
        <div class="info-section">
          <div class="info-row">
            <span class="label">Fecha reporte:</span>
            <span class="value">{{ formatDate(data.reportData?.fecha_reporte || '') }}</span>
          </div>
        </div>

        <!-- Details grid -->
        <div class="details-grid">
          <div class="detail-item">
            <span class="label">Obra</span>
            <span class="value">{{ data.reportData?.obra_text || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Empresa</span>
            <span class="value">{{ data.reportData?.empresa_text || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Ámbito</span>
            <span class="value">{{ data.reportData?.ambito_text || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Riesgo</span>
            <span class="value">{{ data.reportData?.riesgo_text || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Potencial Gravedad</span>
            <span class="value severity" [class]="getSeverityClass()">
              {{ data.reportData?.potencial_gravedad_text || '-' }}
            </span>
          </div>
          <div class="detail-item">
            <span class="label">Reportado Por</span>
            <span class="value">{{ data.reportData?.reportadoPor || '-' }}</span>
          </div>
        </div>

        <!-- Full width items -->
        <div class="full-width-section">
          <div class="detail-item full-width">
            <span class="label">Área de Trabajo</span>
            <span class="value">{{ data.reportData?.area_trabajo || '-' }}</span>
          </div>
          <div class="detail-item full-width">
            <span class="label">Condición Detectada</span>
            <span class="value">{{ data.reportData?.condicion_detectada || '-' }}</span>
          </div>
        </div>

        <!-- Evidence section -->
        <div class="evidence-section" *ngIf="data.reportData?.evidencia && data.reportData.evidencia.length > 0">
          <h3 class="section-title">Evidencia fotográfica</h3>
          <div class="evidence-gallery">
            <div class="evidence-item" *ngFor="let img of data.reportData.evidencia">
              <img [src]="img" alt="Evidencia" (click)="openImage(img)" />
            </div>
          </div>
        </div>

        <!-- Created date -->
        <div class="created-section">
          <span class="label">Fecha de creación:</span>
          <span class="value">{{ data.created }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .report-header {
      background: linear-gradient(135deg, #0c4790 0%, #1565c0 100%);
      color: white;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0px;
      border: none;

      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
      }

      .close-btn {
        color: white;
      }
    }

    .modal-content {
      padding: 24px;
      overflow-y: auto;
      max-height: calc(90vh - 80px);
    }

    .info-section {
      background: #f5f5f5;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 20px;

      .info-row {
        display: flex;
        gap: 8px;

        .label {
          font-weight: 500;
          color: #555;
        }

        .value {
          color: #333;
        }
      }
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      background: #fafafa;
      border-radius: 4px;
      border-left: 3px solid #0c4790;

      .label {
        font-size: 0.75rem;
        color: #666;
        text-transform: uppercase;
        font-weight: 500;
      }

      .value {
        font-size: 0.9rem;
        color: #333;
        font-weight: 500;
      }

      .severity {
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
        width: fit-content;

        &.high {
          background: #ffebee;
          color: #c62828;
        }

        &.medium {
          background: #fff3e0;
          color: #ef6c00;
        }

        &.low {
          background: #e8f5e9;
          color: #2e7d32;
        }
      }

      &.full-width {
        grid-column: span 2;
      }
    }

    .full-width-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }

    .evidence-section {
      margin-top: 24px;

      .section-title {
        color: #0c4790;
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #0c4790;
      }
    }

    .evidence-gallery {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .evidence-item {
      flex: 0 0 calc(50% - 8px);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.02);
      }

      img {
        width: 100%;
        height: 200px;
        object-fit: cover;
      }
    }

    .created-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
      font-size: 0.85rem;
      color: #666;

      .label {
        font-weight: 500;
      }
    }

    @media (max-width: 600px) {
      .details-grid {
        grid-template-columns: 1fr;
      }

      .detail-item.full-width {
        grid-column: span 1;
      }

      .evidence-item {
        flex: 0 0 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SstmaObraDetailModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SstmaObraReport,
    private dialogRef: MatDialogRef<SstmaObraDetailModalComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  getSeverityClass(): string {
    const severity = this.data.reportData?.potencial_gravedad_text?.toLowerCase() || '';
    if (severity.includes('alto')) return 'high';
    if (severity.includes('medio')) return 'medium';
    if (severity.includes('bajo')) return 'low';
    return '';
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }
}

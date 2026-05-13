import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { SstmaObraReport } from '../../sstma-obra-report.component';
import { BtnComponent, PillComponent, PillVariant } from '../../../../../../../shared/ui';

@Component({
  selector: 'app-sstma-obra-detail-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, BtnComponent, PillComponent],
  template: `
    <div class="modal-container">
      <!-- Header -->
      <header class="modal-header">
        <div class="modal-header__text">
          <span class="eyebrow">DETALLE</span>
          <h2 class="modal-title">Reporte SSTMA Obra</h2>
        </div>
        <button type="button" class="modal-close" (click)="close()" aria-label="Cerrar">
          <span class="ms-r" aria-hidden="true">close</span>
        </button>
      </header>

      <!-- Content -->
      <div class="modal-body">
        <div class="modal-meta">
          <span class="modal-meta__label">Fecha reporte</span>
          <span class="modal-meta__value mono">{{ formatDate(data.reportData.fecha_reporte) }}</span>
        </div>

        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-item__label">Obra</span>
            <span class="detail-item__value">{{ data.reportData.obra_text || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Empresa</span>
            <app-pill
              *ngIf="data.reportData.empresa_text; else dashEmpresa"
              [variant]="empresaVariant(data.reportData.empresa_text)"
              [icon]="empresaVariant(data.reportData.empresa_text) === 'brand' ? 'verified' : 'business'"
            >
              {{ data.reportData.empresa_text }}
            </app-pill>
            <ng-template #dashEmpresa><span class="detail-item__value">—</span></ng-template>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Ámbito</span>
            <app-pill *ngIf="data.reportData.ambito_text; else dashAmbito" variant="info" icon="category">
              {{ data.reportData.ambito_text }}
            </app-pill>
            <ng-template #dashAmbito><span class="detail-item__value">—</span></ng-template>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Riesgo</span>
            <app-pill
              *ngIf="data.reportData.riesgo_text; else dashRiesgo"
              [variant]="riesgoVariant(data.reportData.riesgo_text)"
              [icon]="riesgoIcon(data.reportData.riesgo_text)"
            >
              {{ data.reportData.riesgo_text }}
            </app-pill>
            <ng-template #dashRiesgo><span class="detail-item__value">—</span></ng-template>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Potencial gravedad</span>
            <app-pill
              *ngIf="data.reportData.potencial_gravedad_text; else dashGrav"
              [variant]="severityVariant()"
              [icon]="severityIcon()"
            >
              {{ data.reportData.potencial_gravedad_text }}
            </app-pill>
            <ng-template #dashGrav><span class="detail-item__value">—</span></ng-template>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Reportado por</span>
            <span class="detail-item__value">{{ data.reportData.reportadoPor || '—' }}</span>
          </div>
        </div>

        <div class="full-width-section">
          <div class="detail-item detail-item--full">
            <span class="detail-item__label">Área de trabajo</span>
            <span class="detail-item__value">{{ data.reportData.area_trabajo || '—' }}</span>
          </div>
          <div class="detail-item detail-item--full">
            <span class="detail-item__label">Condición detectada</span>
            <span class="detail-item__value">{{ data.reportData.condicion_detectada || '—' }}</span>
          </div>
        </div>

        <div class="evidence-section" *ngIf="data.reportData.evidencia && data.reportData.evidencia.length > 0">
          <h3 class="section-title">Evidencia fotográfica</h3>
          <div class="evidence-gallery">
            <div class="evidence-item" *ngFor="let img of data.reportData.evidencia">
              <img [src]="img" alt="Evidencia" (click)="openImage(img)" />
            </div>
          </div>
        </div>

        <div class="created-section">
          <span class="created-section__label">Fecha de creación</span>
          <span class="mono">{{ data.created }}</span>
        </div>
      </div>

      <footer class="modal-footer">
        <app-btn variant="primary" size="md" icon="close" (click)="close()">Cerrar</app-btn>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-text);
      color: var(--slate-900);
    }

    .modal-container {
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      background: #fff;
    }

    // Header
    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 24px;
      border-bottom: 1px solid var(--slate-100);
    }

    .modal-header__text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .eyebrow {
      font-family: var(--font-text);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--slate-500);
    }

    .modal-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--slate-900);
    }

    .modal-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-sm);
      background: #fff;
      color: var(--slate-500);
      cursor: pointer;
      transition: border-color 120ms ease, color 120ms ease, background 120ms ease;

      .ms-r { font-size: 18px; }

      &:hover {
        border-color: var(--ink);
        color: var(--ink);
        background: var(--slate-50);
      }
    }

    // Body
    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .modal-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--slate-50);
      border: 1px solid var(--slate-100);
      border-radius: var(--radius-md);
      margin-bottom: 20px;
    }

    .modal-meta__label {
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.10em;
      color: var(--slate-500);
    }

    .modal-meta__value {
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--slate-900);
    }

    .mono {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 14px;
      background: #fff;
      border: 1px solid var(--slate-100);
      border-left: 3px solid var(--ink);
      border-radius: var(--radius-md);

      &--full {
        grid-column: span 2;
      }
    }

    .detail-item__label {
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.10em;
      color: var(--slate-500);
    }

    .detail-item__value {
      font-size: var(--text-base);
      font-weight: 500;
      color: var(--slate-900);
    }

    .full-width-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .evidence-section {
      margin-top: 24px;
    }

    .section-title {
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      font-family: var(--font-display);
      font-size: var(--text-md);
      font-weight: 600;
      color: var(--ink);
      border-bottom: 1px solid var(--slate-100);
    }

    .evidence-gallery {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .evidence-item {
      flex: 0 0 calc(50% - 6px);
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--slate-100);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;

      &:hover {
        transform: scale(1.01);
        box-shadow: var(--shadow-md);
      }

      img {
        display: block;
        width: 100%;
        height: 200px;
        object-fit: cover;
      }
    }

    .created-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--slate-100);
      font-size: var(--text-sm);
      color: var(--slate-500);
    }

    .created-section__label {
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.10em;
    }

    // Footer
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
      border-top: 1px solid var(--slate-100);
      background: var(--slate-50);
    }

    @media (max-width: 600px) {
      .details-grid {
        grid-template-columns: 1fr;
      }

      .detail-item--full {
        grid-column: span 1;
      }

      .evidence-item {
        flex: 0 0 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SstmaObraDetailModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SstmaObraReport,
    private dialogRef: MatDialogRef<SstmaObraDetailModalComponent>,
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  severityVariant(): PillVariant {
    const v = (this.data.reportData.potencial_gravedad_text || '').toLowerCase();
    if (/(alto|crítico|critico|fatal|alta)/.test(v)) return 'danger';
    if (/(medio|moderado|media)/.test(v)) return 'warn';
    if (/(bajo|leve|baja)/.test(v)) return 'success';
    return 'neutral';
  }

  severityIcon(): string {
    switch (this.severityVariant()) {
      case 'danger': return 'warning';
      case 'warn': return 'error';
      case 'success': return 'check_circle';
      default: return 'circle';
    }
  }

  riesgoVariant(value: string | undefined | null): PillVariant {
    if (!value) return 'neutral';
    const v = value.toLowerCase();
    if (/(alto|crítico|critico|fatal|alta)/.test(v)) return 'danger';
    if (/(medio|moderado|media)/.test(v)) return 'warn';
    if (/(bajo|leve|baja)/.test(v)) return 'success';
    return 'neutral';
  }

  riesgoIcon(value: string | undefined | null): string {
    switch (this.riesgoVariant(value)) {
      case 'danger': return 'warning';
      case 'warn': return 'error';
      case 'success': return 'check_circle';
      default: return 'circle';
    }
  }

  empresaVariant(value: string | undefined | null): PillVariant {
    if (!value) return 'neutral';
    return /inarco/i.test(value) ? 'brand' : 'neutral';
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }
}

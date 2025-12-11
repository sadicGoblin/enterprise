import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CalendarDialogComponent, CalendarDialogData } from './calendar-dialog.component';

@Component({
  selector: 'app-calendar-select',
  template: `
    <div class="calendar-select-container">
      <button mat-icon-button 
              (click)="openCalendarDialog()" 
              [matTooltip]="loading ? 'Cargando datos...' : tooltip"
              [disabled]="disabled || loading"
              class="calendar-select-button"
              [class.loading]="loading">
        <mat-icon *ngIf="!loading">{{ icon }}</mat-icon>
        <mat-icon *ngIf="loading" class="spinning">sync</mat-icon>
      </button>
      <span class="calendar-badge" *ngIf="selectedDates.length && !loading">{{ selectedDates.length }}</span>
    </div>
  `,
  styles: [`
    .calendar-select-container {
      position: relative;
      display: inline-block;
    }
    
    .calendar-select-button {
      color: #3f51b5;
    }
    
    .calendar-select-button.loading {
      color: #999;
    }
    
    .calendar-select-button:disabled {
      opacity: 0.6;
    }
    
    .spinning {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .calendar-badge {
      position: absolute;
      top: 6px;
      right: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      font-size: 10px;
      font-weight: 600;
      color: white;
      background-color:#34c358;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ]
})
export class CalendarSelectComponent {
  @Input() selectedDates: Date[] = [];
  @Input() defaultDays: number[] = [];
  @Input() rowData: any = null;
  @Input() controlId: number = 0;
  @Input() icon: string = 'calendar_month';
  @Input() tooltip: string = 'Seleccionar fechas';
  @Input() selectedPeriod: Date | null = null;
  @Input() lockedDays: number[] = []; // Días que no pueden ser deseleccionados (ej: actividades cumplidas)
  @Input() loading: boolean = false; // Indica si se están cargando los datos de planificación
  @Input() disabled: boolean = false; // Deshabilita el botón del calendario

  @Output() datesSelected = new EventEmitter<Date[]>();

  constructor(private dialog: MatDialog) {}

  /**
   * Abre el diálogo de calendario
   */
  openCalendarDialog(): void {
    const dialogData: CalendarDialogData = {
      selectedDates: this.selectedDates,
      defaultDays: this.defaultDays,
      rowData: this.rowData,
      controlId: this.controlId,
      selectedPeriod: this.selectedPeriod,
      lockedDays: this.lockedDays
    };

    const dialogRef = this.dialog.open(CalendarDialogComponent, {
      width: '480px',
      height: '370px',
      data: dialogData,
      panelClass: 'calendar-dialog-no-padding'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedDates = result;
        this.datesSelected.emit(result);
      }
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, DateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Interfaz para representar un día en el calendario
 */
export interface CalendarDay {
  date: Date;
  selected: boolean;
  today: boolean;
  disabled: boolean;
  isCurrentMonth: boolean;
}

/**
 * Componente de calendario que permite selección múltiple de días
 * Soporta selección individual y por arrastre
 */
@Component({
  selector: 'app-multi-date-calendar',
  template: `
<div class="calendar-layout">
  <div class="calendar-container">
    <!-- Navegación del mes -->
    <div class="calendar-header">
      <button mat-icon-button (click)="prevMonth()" class="nav-button">
        <mat-icon>chevron_left</mat-icon>
      </button>
      <span class="month-year">
        {{ monthNames[currentMonth] }} {{ currentYear }}
      </span>
      <button mat-icon-button (click)="nextMonth()" class="nav-button">
        <mat-icon>chevron_right</mat-icon>
      </button>
    </div>

    <!-- Días de la semana -->
    <div class="calendar-weekdays">
      <div class="day-name" *ngFor="let day of weekDays">{{ day }}</div>
    </div>

    <div class="calendar-body">
      <div class="calendar-week" *ngFor="let week of calendar">
        <div
          *ngFor="let day of week"
          class="calendar-day"
          [class.disabled]="day.disabled"
          [class.selected]="day.selected"
          [class.today]="day.today"
          [class.outside-month]="!day.isCurrentMonth"
          (click)="onDayClick(day, $event)"
        >
          {{ day.date | date:'d' }}
        </div>
      </div>
    </div>
    
    <!-- Instrucciones de uso -->
    <div class="calendar-instructions">
      <small>
        <strong>Cómo usar:</strong><br>
        • Click para seleccionar/deseleccionar<br>
        • Shift+Click para seleccionar rangos
      </small>
    </div>
  </div>
  
  <!-- Lista vertical de fechas seleccionadas -->
  <div class="dates-list-vertical" *ngIf="selectedDates.length > 0">
    <div class="dates-list-header">
      <span><mat-icon class="small-icon">event_note</mat-icon> Días ({{ selectedDates.length }}):</span>
      <button
        mat-icon-button
        color="warn"
        class="clear-button"
        (click)="clearSelection()"
      >
        <mat-icon class="small-icon">delete_sweep</mat-icon>
      </button>
    </div>
    <div class="dates-list-items-vertical">
      <div *ngFor="let date of sortedDates" class="date-chip-vertical">
        {{ date | date:'dd/MM' }}
        <span class="remove-date" (click)="removeDate(date)">
          &times;
        </span>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
.calendar-layout {
  display: flex;
  flex-direction: row;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  user-select: none;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
  max-width: 400px;
  overflow: hidden;
  height: 100%;
}

.calendar-container {
  display: flex;
  flex-direction: column;
  padding: 10px;
  width: 270px;
  border-right: 1px solid #eaeaea;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f5f5f5;
}

.month-year {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.day-name {
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  padding: 8px 0;
}

.day-name:first-child,
.day-name:last-child {
  color: #f44336; /* Fin de semana en rojo */
}

.calendar-body {
  display: flex;
  flex-direction: column;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  height: 30px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 2px;
  border-radius: 50%;
  font-size: 14px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.calendar-day:hover:not(.disabled) {
  background-color: #f0f4f8;
}

.calendar-day.outside-month {
  color: #bdbdbd;
}

.calendar-day.today {
  border: 2px solid #1976d2;
}

.calendar-day.selected {
  background-color: #2196f3;
  color: white;
}

.calendar-day.selected:hover {
  background-color: #1976d2;
}

.calendar-day.disabled {
  color: #d0d0d0;
  cursor: not-allowed;
}

.calendar-instructions {
  margin-top: 16px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.calendar-instructions small {
  font-size: 11px;
  color: #666;
  line-height: 1.4;
}

.dates-list-vertical {
  width: 90px;
  display: flex;
  flex-direction: column;
  padding: 8px 6px;
  background-color: #fafafa;
  height: 100%;
  flex: 1;
}

.dates-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 5px;
  margin-bottom: 5px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 11px;
  color: #555;
  white-space: nowrap;
}

.small-icon {
  font-size: 14px;
  width: 14px;
  height: 14px;
  line-height: 14px;
}

.dates-list-items-vertical {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  flex: 1;
  padding-right: 2px;
}

.date-chip-vertical {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2px 0;
  border: 1px solid #bbdefb;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #bbdefb;
  }
}

.remove-date {
  font-size: 12px;
  height: 12px;
  width: 12px;
  line-height: 12px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s ease;
  
  &:hover {
    color: #f44336;
    transform: scale(1.1);
  }
}

.remove-date:hover {
  color: #f44336;
}

.calendar-instructions {
  margin-top: 16px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.calendar-instructions small {
  font-size: 11px;
  color: #666;
  line-height: 1.4;
}

/* Estilos para la vista de selección por arrastre */
.calendar-day.drag-selection {
  background-color: rgba(33, 150, 243, 0.5);
  color: white;
}

/* Animaciones */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
  }
  70% {
    box-shadow: 0 0 0 5px rgba(33, 150, 243, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
  }
}

.calendar-day.today {
  animation: pulse 2s infinite;
}
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  encapsulation: ViewEncapsulation.None
})
export class MultiDateCalendarComponent implements OnInit {
  @Input() selectedDates: Date[] = [];
  @Input() minDate?: Date;
  @Input() maxDate?: Date;
  @Input() defaultDates: number[] = []; // Días predeterminados (1-31)
  @Output() datesChange = new EventEmitter<Date[]>();

  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth();
  
  calendar: CalendarDay[][] = [];
  
  weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  lastClickedDate: Date | null = null;

  // Fechas seleccionadas ordenadas para visualización
  get sortedDates(): Date[] {
    return [...this.selectedDates].sort((a, b) => a.getTime() - b.getTime());
  }

  constructor(private dateAdapter: DateAdapter<Date>) {
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
  }

  ngOnInit(): void {
    // Inicializar nombres de los días de la semana
    this.weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    
    // Inicializar el calendario
    this.generateCalendar();
    
    // Si no hay fechas seleccionadas pero hay días predeterminados,
    // crear las fechas basadas en los días predeterminados
    if ((!this.selectedDates || this.selectedDates.length === 0) && this.defaultDates.length > 0) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      this.selectedDates = this.defaultDates.map(day => {
        // Asegurar que el día esté en el rango válido (1-31)
        const validDay = Math.max(1, Math.min(31, day));
        return new Date(year, month, validDay);
      });
    } else if (!this.selectedDates) {
      this.selectedDates = [];
    }
    
    // Regenerar el calendario para mostrar las fechas seleccionadas
    this.generateCalendar();
  }

  /**
   * Genera el calendario para el mes y año actual
   */
  generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    
    this.calendar = [];
    let week: CalendarDay[] = [];
    
    // Agregar días del mes anterior
    const prevMonth = new Date(this.currentYear, this.currentMonth, 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(this.currentYear, this.currentMonth - 1, day);
      week.push(this.createCalendarDay(date, false));
    }
    
    // Agregar días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      week.push(this.createCalendarDay(date, true));
      
      if (week.length === 7) {
        this.calendar.push(week);
        week = [];
      }
    }
    
    // Agregar días del mes siguiente
    if (week.length > 0) {
      const daysToAdd = 7 - week.length;
      for (let day = 1; day <= daysToAdd; day++) {
        const date = new Date(this.currentYear, this.currentMonth + 1, day);
        week.push(this.createCalendarDay(date, false));
      }
      this.calendar.push(week);
    }
  }

  /**
   * Crea un objeto CalendarDay para una fecha específica
   */
  createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const today = new Date();
    const isToday = this.isSameDay(date, today);
    const isSelected = this.isDateSelected(date);
    const isDisabled = this.isDateDisabled(date);
    
    return {
      date: date,
      selected: isSelected,
      today: isToday,
      disabled: isDisabled,
      isCurrentMonth
    };
  }

  /**
   * Avanza al mes siguiente
   */
  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }

  /**
   * Retrocede al mes anterior
   */
  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  /**
   * Verifica si dos fechas son el mismo día
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  }

  /**
   * Verifica si una fecha está seleccionada
   */
  isDateSelected(date: Date): boolean {
    return this.selectedDates.some(selectedDate => this.isSameDay(selectedDate, date));
  }

  /**
   * Verifica si una fecha está deshabilitada
   */
  isDateDisabled(date: Date): boolean {
    if (this.minDate && date < this.minDate) {
      return true;
    }
    if (this.maxDate && date > this.maxDate) {
      return true;
    }
    return false;
  }

  /**
   * Maneja el click en un día
   */
  onDayClick(day: CalendarDay, event: MouseEvent): void {
    if (day.disabled) return;
    
    // Seleccionar rango con Shift+Click
    if (event.shiftKey && this.lastClickedDate) {
      this.selectDateRange(this.lastClickedDate, day.date);
      this.lastClickedDate = new Date(day.date);
    }
    // Click simple - togglear selección (añadir/quitar)
    else {
      this.toggleDateSelection(day.date);
      this.lastClickedDate = new Date(day.date);
    }
    
    this.emitChanges();
  }

  /**
   * Alterna la selección de una fecha
   */
  toggleDateSelection(date: Date): void {
    const index = this.selectedDates.findIndex(d => this.isSameDay(d, date));
    
    if (index > -1) {
      this.selectedDates.splice(index, 1);
    } else {
      this.selectedDates.push(new Date(date));
    }
    
    this.generateCalendar();
  }

  /**
   * Selecciona un rango de fechas
   */
  /**
   * Obtener el rango de fechas entre dos fechas (sin modificar la selección actual)
   */
  getDateRange(startDate: Date, endDate: Date): Date[] {
    if (!startDate || !endDate) return [];
    
    // Asegurar que startDate sea anterior a endDate
    let start = new Date(startDate);
    let end = new Date(endDate);
    
    if (startDate > endDate) {
      start = new Date(endDate);
      end = new Date(startDate);
    }
    
    // Crear un array con todas las fechas en el rango
    const dateArray: Date[] = [];
    const currentDate = new Date(start);
    
    // Limitar a 31 días como máximo para evitar selecciones excesivas
    const maxDaysToSelect = 31;
    let daysCount = 0;
    
    while (currentDate <= end && daysCount < maxDaysToSelect) {
      if (!this.isDateDisabled(currentDate)) {
        dateArray.push(new Date(currentDate));
        daysCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateArray;
  }
  
  /**
   * Selecciona un rango de fechas (modifica la selección actual)
   */
  selectDateRange(startDate: Date, endDate: Date): void {
    if (!startDate || !endDate) return;
    
    // Obtener el rango de fechas
    const dateArray = this.getDateRange(startDate, endDate);
    
    // Si se presiona Ctrl/Cmd, mantener selecciones anteriores fuera del rango
    if (this.selectedDates.length > 0) {
      const start = new Date(Math.min(startDate.getTime(), endDate.getTime()));
      const end = new Date(Math.max(startDate.getTime(), endDate.getTime()));
      
      this.selectedDates = [
        ...this.selectedDates.filter(d => 
          d.getTime() < start.getTime() || d.getTime() > end.getTime()
        ),
        ...dateArray
      ];
    } else {
      this.selectedDates = dateArray;
    }
  }

  /**
   * Limpia la selección de fechas
   */
  clearSelection(): void {
    this.selectedDates = [];
    this.generateCalendar();
    this.emitChanges();
  }
  
  /**
   * Elimina una fecha específica de la selección
   */
  removeDate(date: Date): void {
    const index = this.selectedDates.findIndex(d => this.isSameDay(d, date));
    if (index > -1) {
      this.selectedDates.splice(index, 1);
      this.generateCalendar();
      this.emitChanges();
    }
  }

  /**
   * Emite el evento con las fechas seleccionadas
   */
  emitChanges(): void {
    this.datesChange.emit([...this.selectedDates]);
    this.generateCalendar();
  }

  /**
   * Devuelve la fecha en formato legible
   */
  getFormattedDate(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  /**
   * Devuelve el nombre del mes y año actual
   */
  get currentMonthName(): string {
    return `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
  }
}

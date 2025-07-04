import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
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
  templateUrl: './multi-date-calendar.component.html',
  styleUrls: ['./multi-date-calendar.component.scss'],
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
  
  // Variables para controlar la selección por arrastre
  isDragging = false;
  dragStart: CalendarDay | null = null;

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
      // Forzar actualización inmediata del calendario tras seleccionar el rango
      this.generateCalendar();
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
   * Emite el evento de cambio de fechas seleccionadas
   */
  emitChanges(): void {
    this.datesChange.emit([...this.selectedDates]);
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

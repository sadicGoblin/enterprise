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
  @Input() initialPeriod: Date | null = null; // Período inicial para mostrar en el calendario
  @Input() lockedDays: number[] = []; // Días que no pueden ser deseleccionados (ej: actividades cumplidas)
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
    
    // Log del estado de la regla de días hábiles
    const today = new Date();
    const businessDays = this.countBusinessDays(today);
    const canEditPrev = this.canEditPreviousMonth();
    console.log(`[Calendario] Días hábiles transcurridos en ${this.monthNames[today.getMonth()]}: ${businessDays}. Mes anterior editable: ${canEditPrev ? 'SÍ' : 'NO'}`);
    
    // Si se proporciona un período inicial, usarlo para establecer el mes y año del calendario
    if (this.initialPeriod) {
      this.currentMonth = this.initialPeriod.getMonth();
      this.currentYear = this.initialPeriod.getFullYear();
    }
    
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
    // Verificar límites de fecha mínima y máxima
    if (this.minDate && date < this.minDate) {
      return true;
    }
    if (this.maxDate && date > this.maxDate) {
      return true;
    }
    
    // Verificar si la fecha está fuera del mes actual visualizado
    if (date.getMonth() !== this.currentMonth || date.getFullYear() !== this.currentYear) {
      return true;
    }
    
    return false;
  }

  /**
   * Verifica si un día está bloqueado (no puede ser deseleccionado)
   * Por ejemplo, días con actividades ya cumplidas
   * Solo aplica al mes del período seleccionado (initialPeriod)
   */
  isDateLocked(date: Date): boolean {
    // Solo bloquear días en el mes del período seleccionado
    if (!this.initialPeriod) return false;
    
    const isSameMonth = date.getMonth() === this.initialPeriod.getMonth() &&
                        date.getFullYear() === this.initialPeriod.getFullYear();
    
    if (!isSameMonth) return false;
    
    const day = date.getDate();
    return this.lockedDays.includes(day);
  }

  /**
   * Cuenta los días hábiles transcurridos desde el inicio del mes hasta una fecha específica
   * Días hábiles = lunes a viernes (excluye sábados y domingos)
   * @param untilDate La fecha hasta la cual contar (inclusive)
   * @returns Número de días hábiles transcurridos
   */
  countBusinessDays(untilDate: Date): number {
    const year = untilDate.getFullYear();
    const month = untilDate.getMonth();
    const day = untilDate.getDate();
    
    let businessDays = 0;
    
    // Contar desde el día 1 del mes hasta el día actual
    for (let d = 1; d <= day; d++) {
      const currentDate = new Date(year, month, d);
      const dayOfWeek = currentDate.getDay();
      
      // 0 = domingo, 6 = sábado - excluir fines de semana
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }
    
    return businessDays;
  }

  /**
   * Verifica si el período del mes anterior aún puede ser editado
   * La regla es: se puede editar hasta el 5to día hábil del mes actual
   * A partir del 6to día hábil, el mes anterior se bloquea
   * @returns true si el mes anterior aún puede ser editado
   */
  canEditPreviousMonth(): boolean {
    const today = new Date();
    const businessDaysElapsed = this.countBusinessDays(today);
    
    // Se puede editar hasta el 5to día hábil (inclusive)
    // El 6to día hábil ya no se puede editar
    return businessDaysElapsed <= 5;
  }

  /**
   * Verifica si una fecha está bloqueada para edición según las reglas de negocio:
   * 1. Actividades ya realizadas (lockedDays) → siempre bloqueadas
   * 2. Mes actual → siempre editable (solo actividades no realizadas)
   * 3. Mes anterior → editable solo hasta el 5to día hábil del mes actual
   * 4. Meses más antiguos → siempre bloqueados
   */
  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    const dateMonth = checkDate.getMonth();
    const dateYear = checkDate.getFullYear();
    
    // Caso 1: Es el mes actual → siempre editable
    if (dateMonth === todayMonth && dateYear === todayYear) {
      return false;
    }
    
    // Calcular el mes anterior al actual
    let prevMonth = todayMonth - 1;
    let prevYear = todayYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = todayYear - 1;
    }
    
    // Caso 2: Es el mes anterior → verificar regla de 5 días hábiles
    if (dateMonth === prevMonth && dateYear === prevYear) {
      // Si estamos dentro de los primeros 5 días hábiles del mes actual,
      // el mes anterior es editable
      return !this.canEditPreviousMonth();
    }
    
    // Caso 3: Es un mes más antiguo → siempre bloqueado
    return true;
  }

  /**
   * Maneja el click en un día
   */
  onDayClick(day: CalendarDay, event: MouseEvent): void {
    // Ignorar días deshabilitados o fuera del mes actual
    if (day.disabled || !day.isCurrentMonth) return;
    
    // Ignorar fechas pasadas (no se pueden editar)
    if (this.isPastDate(day.date)) return;
    
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
      // Si el día está bloqueado, no permitir deselección
      if (this.isDateLocked(date)) {
        console.log('No se puede deseleccionar el día', date.getDate(), '- actividad cumplida');
        return;
      }
      // Si es período cerrado, no permitir deselección
      if (this.isPastDate(date)) {
        console.log('No se puede deseleccionar el día', date.getDate(), '- período cerrado');
        return;
      }
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
   * Limpia la selección de fechas (excepto días bloqueados y fechas pasadas)
   */
  clearSelection(): void {
    // Mantener los días bloqueados y las fechas pasadas
    this.selectedDates = this.selectedDates.filter(date => 
      this.isDateLocked(date) || this.isPastDate(date)
    );
    this.generateCalendar();
    this.emitChanges();
  }
  
  /**
   * Elimina una fecha específica de la selección
   */
  removeDate(date: Date): void {
    // Si el día está bloqueado, no permitir eliminación
    if (this.isDateLocked(date)) {
      console.log('No se puede eliminar el día', date.getDate(), '- actividad cumplida');
      return;
    }
    
    // Si es período cerrado, no permitir eliminación
    if (this.isPastDate(date)) {
      console.log('No se puede eliminar el día', date.getDate(), '- período cerrado');
      return;
    }
    
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
  
  /**
   * Selecciona todos los días del mes que coincidan con el día de la semana indicado
   * @param dayIndex ídice del día de la semana (0-6, donde 0 es domingo)
   */
  selectAllDaysOfWeek(dayIndex: number): void {
    // Crear un array para almacenar los días a seleccionar
    const daysToSelect: Date[] = [];
    
    // Recorrer el calendario actual y encontrar todos los días que coincidan con el día de la semana
    for (const week of this.calendar) {
      for (const day of week) {
        // Solo considerar días del mes actual y no deshabilitados
        if (day.isCurrentMonth && !day.disabled && day.date.getDay() === dayIndex) {
          daysToSelect.push(new Date(day.date));
        }
      }
    }
    
    // Añadir los días seleccionados al array de días seleccionados, sin duplicados
    for (const date of daysToSelect) {
      if (!this.isDateSelected(date)) {
        this.selectedDates.push(new Date(date));
      }
    }
    
    // Actualizar el calendario y emitir el evento de cambio
    this.generateCalendar();
    this.emitChanges();
  }
}

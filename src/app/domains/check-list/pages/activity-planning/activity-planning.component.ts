import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';

// Activity interface definition
export interface Activity {
  id: number;
  name: string;
  periodicity: 'SEMANAL' | 'MENSUAL' | 'QUINCENAL'; // Weekly, Monthly, Bi-weekly
  assigned: number;
  realized: number;
  compliance: number; // Percentage
  scheduledDays: number[]; // An array of the days in the month, e.g., [4, 5, 11, 15]
  dailyChecks?: boolean[]; // For backward compatibility
}
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl } from '@angular/forms';
import { CustomSelectComponent, ParameterType, SelectOption } from '../../../../shared/controls/custom-select/custom-select.component';
import { ProxyService } from '../../../../core/services/proxy.service';

@Component({
  selector: 'app-activity-planning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CustomSelectComponent,
  ],
  templateUrl: './activity-planning.component.html',
  styleUrls: ['./activity-planning.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ActivityPlanningComponent implements OnInit, AfterViewInit {
  // Toast notification properties
  showToast = false;
  toastMessage = '';

  @ViewChild('collaboratorSelect') collaboratorSelect!: CustomSelectComponent;
  constructor(private proxyService: ProxyService) {
    // Initialize with current date
    this.selectedPeriod = new Date();
  }
  
  ngOnInit(): void {
    this.formatPeriodString(this.selectedPeriod);
    console.log('Current period:', this.formattedPeriod);
    
    // Generate the calendar grid for the current month
    if (this.selectedPeriod) {
      this.generateCalendarGrid(this.selectedPeriod);
    }
    
    // Mock data initialization
    this.initMockData();
    
    // Get user ID from localStorage
    const userId = localStorage.getItem('userId');
    
    // Set up project API request body
    this.projectApiRequestBody = {
      "caso": "Consulta",
      "idObra": 0,
      "idUsuario": userId || ''
    };
  }
  
  /**
   * Format date as Spanish month and year (e.g., "junio 2025")
   * @param date The date to format
   */
  formatPeriodString(date: Date | null): void {
    if (!date) {
      this.formattedPeriod = '';
      return;
    }
    
    const month = date.getMonth();
    const year = date.getFullYear();
    
    this.formattedPeriod = `${this.spanishMonths[month]} ${year}`;
  }
  
  /**
   * Handle date change from the datepicker
   * @param event The MatDatepickerInputEvent
   */
  onPeriodChange(event: any): void {
    this.formatPeriodString(event.value);
  }
  
  /**
   * Set month and year when selected from datepicker
   * @param date The selected date
   * @param datepicker The datepicker instance
   */
  setMonthAndYear(date: Date, datepicker: any): void {
    const normalizedDate = new Date(date);
    normalizedDate.setDate(1);
    this.selectedPeriod = normalizedDate;
    this.formatPeriodString(normalizedDate);
    this.generateCalendarGrid(normalizedDate);
    datepicker.close();
  }
  
  /**
   * Initialize mock data for activities
   */
  initMockData(): void {
    // This replaces the loadActivityData function that didn't exist
    // Activities mock data should already be initialized in the component
    console.log('Mock data initialized');
  }

  /**
   * Generates a calendar grid for the selected month
   * This arranges days in weeks, with proper weekday alignment
   */
  generateCalendarGrid(date: Date): void {
    this.calendarWeeks = [];
    
    // Create a new date object for the first day of the month
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    
    // Get the number of days in the month (0 gives last day of previous month)
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Convert to Monday-based indexing (0 = Monday, ..., 6 = Sunday)
    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex < 0) firstDayIndex = 6; // Sunday becomes index 6
    
    // Initialize the first week with empty slots for days from previous month
    const firstWeek: (number | null)[] = Array(firstDayIndex).fill(null);
    
    // Fill the first week with actual days
    for (let i = 1; i <= 7 - firstDayIndex; i++) {
      firstWeek.push(i);
    }
    
    this.calendarWeeks.push(firstWeek);
    
    // Fill subsequent weeks
    let dayCounter = 7 - firstDayIndex + 1;
    
    while (dayCounter <= daysInMonth) {
      const week: (number | null)[] = [];
      
      for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
        week.push(dayCounter++);
      }
      
      // Fill the rest of the last week with null
      while (week.length < 7) {
        week.push(null);
      }
      
      this.calendarWeeks.push(week);
    }
    
    console.log('Calendar grid generated:', this.calendarWeeks);
  }
  
  /**
   * Handle project selection change
   * @param selectedProject The selected project option
   */
  ngAfterViewInit(): void {
    // Any initialization that requires ViewChild references
  }
  
  onProjectSelectionChange(selectedProject: SelectOption | null): void {
    if (selectedProject) {
      console.log('Project selected:', selectedProject);
      this.selectedProject = selectedProject.value;
      
      // Update collaborator API request body with selected project ID
      this.collaboratorApiRequestBody = {
        caso: 'ConsultaUsuariosObra',
        idObra: parseInt(selectedProject.value) || 0,
        idUsuario: 0
      };
      
      // Reset collaborator selection when project changes
      this.collaboratorControl.setValue(null);
      
      // Reload collaborator options with the new project ID
      // Use a short timeout to ensure the UI updates before reloading
      setTimeout(() => {
        if (this.collaboratorSelect) {
          console.log('Reloading collaborator options with new project ID:', this.selectedProject);
          this.collaboratorSelect.reloadOptions();
        } else {
          console.warn('Collaborator select component reference not available');
        }
      }, 100);
    }
  }
  
  onCollaboratorSelectionChange(selectedCollaborator: SelectOption | null): void {
    if (selectedCollaborator) {
      console.log('Collaborator selected:', selectedCollaborator);
      this.selectedUser = selectedCollaborator.value.toString();
      this.selectedUserName = selectedCollaborator.label;
      // Additional logic when collaborator changes can go here
    }
  }
  
  /**
   * Check if a day is a weekend day
   * In our calendar structure, the 5th and 6th columns (index 5 and 6) are weekends
   */
  isWeekend(day: number): boolean {
    // Find the day in our calendar grid
    for (let week of this.calendarWeeks) {
      const dayIndex = week.indexOf(day);
      if (dayIndex !== -1) {
        // Check if it's in the weekend columns (5 = Saturday, 6 = Sunday)
        return dayIndex === 5 || dayIndex === 6;
      }
    }
    return false;
  }
  
  /**
   * Gets the abbreviated day of week in Spanish (Lun, Mar, Mié, etc.) for a given day of month
   * @param day The day of the month (1-31)
   * @returns Abbreviated day name in Spanish (first 3 letters)
   */
  getDayOfWeekAbbr(day: number): string {
    if (!this.selectedPeriod) return '';
    
    // Create a date object for this day in the selected month/year
    const date = new Date(this.selectedPeriod.getFullYear(), this.selectedPeriod.getMonth(), day);
    
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = date.getDay();
    
    // Spanish day abbreviations
    const dayAbbreviations = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    return dayAbbreviations[dayOfWeek];
  }
  
  // Project selection using custom select component
  projectControl = new FormControl();
  projectParameterType = ParameterType.OBRA;
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectApiRequestBody: { [key: string]: string | number } = {
    idUsuario: localStorage.getItem('userId') || ''
  };
  projectOptionValue = 'IdObra';
  projectOptionLabel = 'Obra';

  // Collaborator selection using custom select component
  collaboratorControl = new FormControl();
  collaboratorParameterType = ParameterType.CUSTOM_API;
  collaboratorApiEndpoint = '/ws/UsuarioSvcImpl.php';
  collaboratorApiRequestBody: { [key: string]: string | number } = {
    caso: 'ConsultaUsuariosObra',
    idObra: 0,
    idUsuario: 0
  };
  collaboratorOptionValue = 'IdUsuario';
  collaboratorOptionLabel = 'nombre';
  selectedProject: string = '';
  selectedUser: string = '';
  selectedUserName: string = '';
  selectedPeriod: Date | null = null;
  formattedPeriod: string = '';
  
  // Spanish month names for formatting
  spanishMonths = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  // We'll use the custom select component instead of this static array
  // projects = ['Proyecto 1', 'Proyecto 2'];
  collaborators = ['Felipe Gallardo', 'Germán Medina', 'Patricio Baeza'];

  /**
   * Array of days 1-31
   */
  days: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  
  /**
   * Calendar days arranged in weeks
   */
  calendarWeeks: (number | null)[][] = [];
  
  /**
   * Day names for the calendar header
   */
  dayNames: string[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  
  // Columns for the master view
  displayedColumns = [
    'expand',
    'name',
    'periodicity',
    'assigned',
    'realized',
    'compliance'
  ];
  
  // Columns for the stats table
  statsColumns = [
    'name',
    'periodicity',
    'assigned',
    'realized',
    'compliance'
  ];
  
  // All columns including detail view
  allColumns = [
    'expand',
    'name',
    'periodicity',
    'assigned',
    'realized',
    'compliance'
  ];
  
  // Define Activity interface
  activities: Activity[] = [
    {
      id: 1,
      name: 'Check List Seguridad',
      periodicity: 'SEMANAL',
      assigned: 1,
      realized: 0,
      compliance: 0,
      scheduledDays: [1, 8, 15, 22, 29], // Weekly on Mondays
      dailyChecks: Array(31).fill(false)
    },
    {
      id: 2,
      name: 'Inspección SSTMA',
      periodicity: 'QUINCENAL',
      assigned: 1,
      realized: 1,
      compliance: 100,
      scheduledDays: [1, 15], // Bi-weekly
      dailyChecks: Array(31).fill(false)
    },
    {
      id: 3,
      name: 'Charla de Seguridad',
      periodicity: 'MENSUAL',
      assigned: 1,
      realized: 0,
      compliance: 0,
      scheduledDays: [5], // Monthly
      dailyChecks: Array(31).fill(false)
    }
  ];
  
  /**
   * Track expanded activities
   */
  expandedRows: Activity[] = [];
  
  /**
   * Check if a row is expanded
   */
  isExpanded(row: Activity): boolean {
    return this.expandedRows.includes(row);
  }
  
  /**
   * Predicate function that determines if a row is an expansion detail row
   */
  isExpansionDetailRow = (_: number, row: any): boolean => row.element === undefined;
  
  /**
   * Predicate function that determines if a row is an expanded row
   */
  isExpandedRow = (_: number, row: any): boolean => row.element !== undefined;
  
  /**
   * Toggle row expansion
   */
  toggleRow(element: Activity, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const index = this.expandedRows.indexOf(element);
    if (index === -1) {
      this.expandedRows.push(element);
    } else {
      this.expandedRows.splice(index, 1);
    }
    console.log('Toggled row:', element.name, 'Expanded:', this.expandedRows.includes(element));
  }
  
  /**
   * Toggles a scheduled day for an activity
   */
  toggleScheduledDay(activity: Activity, day: number, checked: boolean): void {
    if (checked) {
      // Add the day if it's not already in the array
      if (!activity.scheduledDays.includes(day)) {
        activity.scheduledDays.push(day);
        // Sort the array to keep days in order
        activity.scheduledDays.sort((a, b) => a - b);
      }
    } else {
      // Remove the day from the array
      const index = activity.scheduledDays.indexOf(day);
      if (index !== -1) {
        activity.scheduledDays.splice(index, 1);
      }
    }
    
    // Update dailyChecks for backward compatibility
    if (activity.dailyChecks) {
      activity.dailyChecks[day - 1] = checked;
    }
    
    console.log(`Activity ${activity.name} day ${day} set to ${checked}`, activity.scheduledDays);
  }
  
  /**
   * Save changes to the activity scheduling
   * @param activity The activity to save changes for
   */
  saveActivityChanges(activity: Activity): void {
    // In a real app, this would save to backend
    console.log('Saved changes for activity:', activity);
    
    // Update compliance metrics
    this.updateCompliance(activity);
    
    // Toast notification
    this.toastMessage = 'Cambios guardados correctamente';
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
  
  /**
   * Save changes for all activities
   */
  saveAllChanges(): void {
    // In a real app, this would batch save all activities to backend
    console.log('Saving all activities');
    
    // Update compliance for all activities
    this.activities.forEach(activity => {
      this.updateCompliance(activity);
    });
    
    // Toast notification
    this.toastMessage = 'Todos los cambios guardados correctamente';
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
  
  /**
   * Update compliance metrics for an activity
   * @param activity The activity to update compliance for
   */
  updateCompliance(activity: Activity): void {
    const totalScheduled = activity.scheduledDays.length;
    const realized = Math.floor(Math.random() * (totalScheduled + 1)); // Random number between 0 and totalScheduled
    activity.realized = realized;
    
    // Calculate compliance percentage
    activity.compliance = totalScheduled > 0 ? Math.round((realized / totalScheduled) * 100) : 0;
  }
}

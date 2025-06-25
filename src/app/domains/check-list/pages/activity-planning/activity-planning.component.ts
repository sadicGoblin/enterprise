import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
})
export class ActivityPlanningComponent implements OnInit, AfterViewInit {
  @ViewChild('collaboratorSelect') collaboratorSelect!: CustomSelectComponent;
  constructor(private proxyService: ProxyService) {
    // Initialize with current date
    this.selectedPeriod = new Date();
    this.formatPeriodString(this.selectedPeriod);
  }
  
  ngOnInit(): void {
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
    // Always set the day to 1 to ensure we're just using month/year
    const normalizedDate = new Date(date);
    normalizedDate.setDate(1);
    
    this.selectedPeriod = normalizedDate;
    this.formatPeriodString(normalizedDate);
    datepicker.close();
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
   * Check if a day is a weekend (Saturday or Sunday)
   * @param day The day of the month (1-31)
   * @returns True if the day falls on a weekend for the current month
   */
  isWeekend(day: number): boolean {
    // Create a date for the current month and the specified day
    const date = new Date();
    if (this.selectedPeriod) {
      date.setTime(this.selectedPeriod.getTime());
    }
    date.setDate(day);
    
    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();
    
    // Return true if Saturday or Sunday
    return dayOfWeek === 0 || dayOfWeek === 6;
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

  days = Array.from({ length: 31 }, (_, i) => i + 1);
  
  displayedColumns = [
    'activity',
    'periodicity',
    ...this.days.map(d => 'day' + d),
    'assign',
    'realized',
    'compliance'
  ];
  
  activities = [
    {
      activity: 'Check List Seguridad',
      periodicity: 'Semanal',
      dailyChecks: Array(31).fill(false),
      assign: 1,
      realized: 0,
      compliance: 0,
    },
    {
      activity: 'Inspección SSTMA',
      periodicity: 'Quincenal',
      dailyChecks: Array(31).fill(false),
      assign: 1,
      realized: 1,
      compliance: 100,
    },
  ];
}

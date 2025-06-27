import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../shared/controls/custom-select/custom-select.component';
import { ProxyService } from '../../../../../core/services/proxy.service';

@Component({
  selector: 'app-add-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    CustomSelectComponent
  ],
  templateUrl: './add-reports.component.html',
  styleUrl: './add-reports.component.scss'
})

export class AddReportsComponent implements OnInit {
  isLoading: boolean = false;
  period: Date | null = null;
  isFormVisible: boolean = false; // Controla la visibilidad del formulario
  
  // Configuración para dropdown de Proyecto
  projectControl = new FormControl(null);
  projectParameterType = ParameterType.OBRA;
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectApiCaso = "Consulta";
  projectApiRequestBody: { caso: string; idObra: number; idUsuario: number } = {
    caso: this.projectApiCaso,
    idObra: 0, // For fetching all projects
    idUsuario: 0 // Valor por defecto, se actualizará en ngOnInit
  };
  projectOptionValue = "IdObra";
  projectOptionLabel = "Obra";
  selectedProjectId: string | null = null;
  
  // Configuración para dropdown de Tipo
  typeControl = new FormControl(null);
  typeParameterType = ParameterType.CUSTOM_API;
  types = ['ART', 'INSPECCIÓN SSTMA', 'REPORTE INCIDENTES'];
  typesOptions: SelectOption[] = [];
  
  displayedColumns = ['project', 'name', 'period'];

  tableData1 = [
    { project: 'Proyecto A', name: 'Juan Pérez', period: '2024-12' },
  ];
  tableData2 = [
    { project: 'Proyecto B', name: 'Ana Torres', period: '2025-01' },
  ];
  tableData3 = [
    { project: 'Proyecto C', name: 'Luis Vega', period: '2025-02' },
  ];

  constructor(private proxyService: ProxyService) {
    // Inicializar las opciones del tipo como SelectOption
    this.typesOptions = this.types.map(type => ({
      value: type,
      label: type
    }));
  }

  ngOnInit(): void {
    // Obtener el userId de localStorage
    let userId = 0; // ID de usuario por defecto
    if (typeof localStorage !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        const parsedUserId = parseInt(storedUserId, 10);
        if (!isNaN(parsedUserId)) {
          userId = parsedUserId;
        }
      }
    }
    
    // Para propósitos de prueba/desarrollo, si no hay userId en localStorage
    if (userId === 0) {
      console.log('No se encontró userId en localStorage, usando valor de prueba');
      userId = 478; // Valor de ejemplo proporcionado por el usuario
    }
    
    // Actualizar el request body con el userId obtenido
    this.projectApiRequestBody = {
      caso: this.projectApiCaso,
      idObra: 0, 
      idUsuario: userId
    };
    
    console.log('Using userId:', userId);
  }

  onProjectSelectionChange(selectedOption: SelectOption | null): void {
    if (selectedOption && selectedOption.value) {
      this.selectedProjectId = String(selectedOption.value);
      console.log('Project selected:', this.selectedProjectId);
    } else {
      this.selectedProjectId = null;
      console.log('Project selection cleared');
    }
  }

  onTypeSelectionChange(selectedOption: SelectOption | null): void {
    if (selectedOption && selectedOption.value) {
      console.log('Type selected:', selectedOption.value);
    }
  }
  
  crearNuevoReporte(): void {
    // Mostrar el formulario de creación de reportes
    this.toggleFormVisibility();
    this.limpiarForm();
    console.log('Formulario de creación de reporte mostrado/ocultado');
  }
  
  toggleFormVisibility(): void {
    this.isFormVisible = !this.isFormVisible;
    console.log('Visibilidad del formulario:', this.isFormVisible);
  }
  
  limpiarForm(): void {
    this.projectControl.reset();
    this.typeControl.reset();
    this.period = null;
    this.selectedProjectId = null;
    console.log('Formulario limpiado');
  }
  
  buscarReportes(): void {
    console.log('Buscando reportes con los siguientes criterios:');
    console.log('Proyecto:', this.selectedProjectId);
    console.log('Tipo:', this.typeControl.value);
    console.log('Periodo:', this.period);
    // Aquí irá la lógica para buscar reportes con los filtros seleccionados
  }
}

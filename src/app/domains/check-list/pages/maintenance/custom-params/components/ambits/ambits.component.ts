import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DataTableComponent } from '../../../../../../../shared/components/data-table/data-table.component';
import { ProxyService } from '../../../../../../../core/services/proxy.service';

// Interfaz para los ámbitos
interface AmbitItem {
  id: string | number;
  code: string;
  name: string;
}

// Interfaces para la tabla (mismas que en el componente padre)
interface TableColumn {
  name: string;
  label: string;
  cssClass?: string;
}

interface ActionButton {
  icon: string;
  color: string;
  tooltip: string;
  action: string;
}

@Component({
  selector: 'app-ambits',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTableComponent,
  ],
  templateUrl: './ambits.component.html',
  styleUrls: ['./ambits.component.scss']
})
export class AmbitsComponent implements OnInit {
  // Estado de carga
  isLoading: boolean = false;
  
  // Propiedades para el formulario
  newAmbitoCode: string = '';
  newAmbitoName: string = '';
  editingAmbito: boolean = false;
  editingAmbitoId: string | number | null = null;
  
  // Búsqueda
  searchValue: string = '';
  
  // Datos de ámbitos
  ambitosData: AmbitItem[] = [];
  filteredData: AmbitItem[] = [];
  
  // Configuración de tabla
  tableColumns: TableColumn[] = [
    { name: 'code', label: 'Código' },
    { name: 'name', label: 'Nombre' },
  ];
  
  actionButtons: ActionButton[] = [
    { icon: 'edit', color: 'primary', tooltip: 'Editar', action: 'edit' },
    { icon: 'delete', color: 'warn', tooltip: 'Eliminar', action: 'delete' },
  ];
  
  tablePageSize: number = 10;
  tablePageSizeOptions: number[] = [5, 10, 25, 50];
  
  constructor(private proxyService: ProxyService) {}
  
  ngOnInit(): void {
    this.loadAmbitos();
  }
  
  /**
   * Carga los ámbitos desde la API o fuente de datos
   */
  loadAmbitos(): void {
    this.isLoading = true;
    
    // Simulación de carga API - reemplazar con proxyService real cuando esté listo
    setTimeout(() => {
      this.ambitosData = [
        { id: '1', code: 'AMB001', name: 'Ámbito de Prueba 1' },
        { id: '2', code: 'AMB002', name: 'Ámbito de Prueba 2' },
        { id: '3', code: 'AMB003', name: 'Ámbito Operacional' },
      ];
      
      this.filteredData = [...this.ambitosData];
      this.isLoading = false;
    }, 1000);
    
    // Implementación real usando ProxyService
    /* 
    this.proxyService.post('/ws/AmbitosSvcImpl.php', {
      caso: 'ConsultaAmbitos',
      // otros parámetros necesarios
    }).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.ambitosData = response.data.map((item: any) => ({
            id: item.IdAmbito,
            code: item.codigo,
            name: item.nombre
          }));
          this.filteredData = [...this.ambitosData];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar ámbitos:', err);
        this.isLoading = false;
      }
    });
    */
  }
  
  /**
   * Maneja la búsqueda en la tabla de ámbitos
   */
  onSearch(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchValue = inputValue;
    
    if (!inputValue) {
      this.filteredData = [...this.ambitosData];
      return;
    }
    
    this.filteredData = this.ambitosData.filter(ambito => 
      ambito.name.toLowerCase().includes(inputValue) ||
      ambito.code.toLowerCase().includes(inputValue)
    );
  }
  
  /**
   * Agrega o actualiza un ámbito
   */
  addAmbito(): void {
    if (!this.newAmbitoCode || !this.newAmbitoName) return;
    
    if (this.editingAmbito && this.editingAmbitoId !== null) {
      // Actualizar ámbito existente
      const index = this.ambitosData.findIndex(a => a.id === this.editingAmbitoId);
      if (index !== -1) {
        this.ambitosData[index] = {
          ...this.ambitosData[index],
          code: this.newAmbitoCode,
          name: this.newAmbitoName
        };
        
        // Actualizar lista filtrada
        this.filteredData = this.searchValue ? 
          this.applyFilter(this.ambitosData, this.searchValue) : 
          [...this.ambitosData];
        
        this.cancelEditAmbito();
      }
    } else {
      // Agregar nuevo ámbito
      const newId = Date.now().toString(); // ID temporal, reemplazar con ID real de API
      const newAmbito: AmbitItem = {
        id: newId,
        code: this.newAmbitoCode,
        name: this.newAmbitoName
      };
      
      this.ambitosData.push(newAmbito);
      
      // Actualizar lista filtrada
      this.filteredData = this.searchValue ? 
        this.applyFilter(this.ambitosData, this.searchValue) : 
        [...this.ambitosData];
      
      this.resetForm();
    }
    
    // En producción, enviar a la API
    /* 
    const payload = {
      caso: this.editingAmbito ? 'ActualizarAmbito' : 'CrearAmbito',
      id: this.editingAmbito ? this.editingAmbitoId : undefined,
      codigo: this.newAmbitoCode,
      nombre: this.newAmbitoName,
    };
    
    this.isLoading = true;
    this.proxyService.post('/ws/AmbitosSvcImpl.php', payload).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.loadAmbitos(); // Recargar datos
        }
        this.isLoading = false;
        this.resetForm();
      },
      error: (err) => {
        console.error('Error al guardar ámbito:', err);
        this.isLoading = false;
      }
    });
    */
  }
  
  /**
   * Prepara un ámbito para edición
   */
  editAmbito(id: string | number): void {
    const ambito = this.ambitosData.find(a => a.id === id);
    if (ambito) {
      this.editingAmbito = true;
      this.editingAmbitoId = id;
      this.newAmbitoCode = ambito.code;
      this.newAmbitoName = ambito.name;
    }
  }
  
  /**
   * Elimina un ámbito
   */
  deleteAmbito(id: string | number): void {
    // En producción, primero mostrar confirmación
    this.ambitosData = this.ambitosData.filter(a => a.id !== id);
    this.filteredData = this.searchValue ? 
      this.applyFilter(this.ambitosData, this.searchValue) : 
      [...this.ambitosData];
    
    // En producción, enviar a la API
    /*
    this.isLoading = true;
    this.proxyService.post('/ws/AmbitosSvcImpl.php', {
      caso: 'EliminarAmbito',
      id: id
    }).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.loadAmbitos(); // Recargar datos
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al eliminar ámbito:', err);
        this.isLoading = false;
      }
    });
    */
  }
  
  /**
   * Maneja las acciones de la tabla
   */
  handleTableAction(event: any): void {
    if (event.action === 'edit') {
      this.editAmbito(event.row.id);
    } else if (event.action === 'delete') {
      this.deleteAmbito(event.row.id);
    }
  }
  
  /**
   * Cancela la edición de un ámbito
   */
  cancelEditAmbito(): void {
    this.editingAmbito = false;
    this.editingAmbitoId = null;
    this.resetForm();
  }
  
  /**
   * Limpia el formulario
   */
  resetForm(): void {
    this.newAmbitoCode = '';
    this.newAmbitoName = '';
  }
  
  /**
   * Filtra los ámbitos según el texto de búsqueda
   */
  private applyFilter(items: AmbitItem[], filter: string): AmbitItem[] {
    const filterLower = filter.toLowerCase().trim();
    return items.filter(ambito => 
      ambito.name.toLowerCase().includes(filterLower) ||
      ambito.code.toLowerCase().includes(filterLower)
    );
  }
}

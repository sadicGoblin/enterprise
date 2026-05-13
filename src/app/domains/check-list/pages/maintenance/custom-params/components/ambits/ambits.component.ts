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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { SharedDataService } from '../../../../../services/shared-data.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '../../../../../../../../environments/environment';
import { BtnComponent } from '../../../../../../../shared/ui';

// Interfaz para los ámbitos
interface AmbitItem {
  id: string | number;
  code: string;
  name: string;
}

// Interfaz para la respuesta de la API
interface ApiResponse {
  success: boolean;
  code: number;
  message: string;
  data: any[];
  glosa?: string;
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
    MatSnackBarModule,
    DataTableComponent,
    MatDialogModule,
    BtnComponent,
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
  
  constructor(
    private proxyService: ProxyService,
    private snackBar: MatSnackBar,
    private sharedDataService: SharedDataService,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.loadAmbitos();
  }
  
  /**
   * Carga los ámbitos desde la API o fuente de datos
   */
  loadAmbitos(): void {
    this.isLoading = true;
    console.log('📤 Consultando ámbitos desde API');
    
    // Implementación real usando ProxyService
    const requestBody = {
      caso: 'ConsultaAmbitos',
      idAmbito: 0,
      nombre: null,
      codigo: 0
    };
    
    this.proxyService.post<ApiResponse>(environment.apiBaseUrl + '/ws/AmbitosSvcImpl.php', requestBody).subscribe({
      next: (response: ApiResponse) => {
        console.log('📥 Respuesta de API de ámbitos:', response);
        
        if (response && response.success) {
          // Mapear datos de la API al formato que espera el componente
          this.ambitosData = response.data.map((item: any) => ({
            id: item.IdAmbito,
            code: item.codigo,
            name: item.nombre
          }));
          
          this.filteredData = [...this.ambitosData];
          console.log('✅ Ámbitos cargados correctamente:', this.ambitosData.length);
        } else {
          console.error('❌ Error en respuesta de API:', response?.message || 'Error desconocido');
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar ámbitos:', err);
        this.isLoading = false;
      }
    });
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
    if (!this.newAmbitoCode || !this.newAmbitoName) {
      this.snackBar.open('Debe completar todos los campos', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }
    
    this.isLoading = true;
    
    if (this.editingAmbito && this.editingAmbitoId !== null) {
      // Actualizar ámbito existente
      const payload = {
        caso: 'ActualizaAmbito',
        idAmbito: this.editingAmbitoId,
        codigo: this.newAmbitoCode,
        nombre: this.newAmbitoName
      };
      
      console.log('📤 ENVIANDO DATOS PARA ACTUALIZACIÓN DE ÁMBITO:', payload);
      
      this.proxyService.post<ApiResponse>(environment.apiBaseUrl + '/ws/AmbitosSvcImpl.php', payload).subscribe({
        next: (response: ApiResponse) => {
          console.log('📥 RESPUESTA DE ACTUALIZACIÓN DE ÁMBITO:', response);
          
          if (response && response.success) {
            this.snackBar.open(`Ámbito "${this.newAmbitoName}" actualizado correctamente`, 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Recargar datos para asegurar que tenemos la versión más actualizada
            this.loadAmbitos();
            this.cancelEditAmbito();
            
            // Notificar a otros componentes sobre la actualización
            this.sharedDataService.notifyAmbitosUpdate();
          } else {
            console.error('❌ Error en respuesta de API al actualizar ámbito:', response?.message || 'Error desconocido');
            this.snackBar.open(`Error al actualizar ámbito: ${response?.message || 'Error desconocido'}`, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
          
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error al actualizar ámbito:', err);
          this.snackBar.open(`Error al actualizar ámbito: ${err.message || 'Error de comunicación con el servidor'}`, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
      
    } else {
      // Agregar nuevo ámbito
      const payload = {
        caso: 'CreaAmbito',
        idAmbito: 0,
        codigo: parseInt(this.newAmbitoCode, 10) || 0, // Convertir a número
        nombre: this.newAmbitoName
      };
      
      console.log('📤 ENVIANDO DATOS PARA CREACIÓN DE ÁMBITO:', payload);
      
      this.proxyService.post<ApiResponse>(environment.apiBaseUrl + '/ws/AmbitosSvcImpl.php', payload).subscribe({
        next: (response: ApiResponse) => {
          console.log('📥 RESPUESTA DE CREACIÓN DE ÁMBITO:', response);
          
          if (response && response.success) {
            this.snackBar.open(`Ámbito "${this.newAmbitoName}" creado correctamente`, 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Recargar datos para obtener el nuevo ámbito con su ID asignado
            this.loadAmbitos();
            this.resetForm();
            
            // Notificar a otros componentes sobre la actualización
            this.sharedDataService.notifyAmbitosUpdate();
          } else {
            console.error('❌ Error en respuesta de API al crear ámbito:', response?.message || 'Error desconocido');
            this.snackBar.open(`Error al crear ámbito: ${response?.message || 'Error desconocido'}`, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
          
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error al crear ámbito:', err);
          this.snackBar.open(`Error al crear ámbito: ${err.message || 'Error de comunicación con el servidor'}`, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
    }
  }
  
  /**
   * Prepara un ámbito para edición
   */
  editAmbito(id: string | number): void {
    console.log('✏️ Preparando edición de ámbito. Buscando ID:', id);
    console.log('📄 Datos disponibles:', this.ambitosData);
    
    // Intentamos encontrar el ámbito por su ID, primero como está, luego intentando conversiones
    let ambito = this.ambitosData.find(a => a.id === id);
    
    // Si no encontramos el ámbito, probamos otras estrategias
    if (!ambito) {
      // Intentar comparar como strings
      ambito = this.ambitosData.find(a => String(a.id) === String(id));
      
      // Si aún no hay coincidencia, mostrar error
      if (!ambito) {
        console.error('❌ No se encontró el ámbito con ID:', id);
        this.snackBar.open(`No se pudo editar. Ámbito con ID ${id} no encontrado.`, 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
    }
    
    console.log('✅ Ámbito encontrado para edición:', ambito);
    
    // Preparar el formulario para edición
    this.editingAmbito = true;
    this.editingAmbitoId = id;
    this.newAmbitoCode = ambito.code;
    this.newAmbitoName = ambito.name;
  }
  
  /**
   * Elimina un ámbito de la lista
   */
  deleteAmbito(id: string | number): void {
    // Buscar el ámbito a eliminar para mostrar su nombre en el diálogo
    const ambitoToDelete = this.ambitosData.find(a => {
      return String(a.id) === String(id);
    });
    
    const dialogData: ConfirmDialogData = {
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar el ámbito "${ambitoToDelete?.name || ''}" (Código: ${ambitoToDelete?.code || ''})?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    };
    
    // Abrir el diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });
    
    // Suscribirse al resultado del diálogo
    dialogRef.afterClosed().subscribe(result => {
      // Si el usuario cancela, no hacer nada
      if (!result) {
        console.log('✖️ Eliminación cancelada por el usuario');
        return;
      }
      
      // Si el usuario confirma, proceder con la eliminación
      this.isLoading = true;
      console.log('📊 Eliminando ámbito con ID:', id);
      
      const requestBody = {
        caso: 'EliminaAmbito',
        idAmbito: id
      };
      
      console.log('🚀 ENVIANDO DATOS PARA ELIMINACIÓN DE ÁMBITO:', requestBody);
      
      this.proxyService.post<any>(environment.apiBaseUrl + '/ws/AmbitosSvcImpl.php', requestBody)
        .pipe(
          catchError(err => {
            console.error('❌ Error al eliminar ámbito:', err);
            this.snackBar.open(
              `Error al eliminar ámbito: ${err.message || 'Error de conexión'}`,
              'Cerrar',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
            this.isLoading = false;
            return of({ success: false, message: err.message });
          })
        )
        .subscribe(response => {
          console.log('📥 RESPUESTA DE ELIMINACIÓN DE ÁMBITO:', response);
          this.isLoading = false;
          
          if (response && response.success) {
            this.snackBar.open(
              'Ámbito eliminado correctamente',
              'Cerrar',
              { duration: 3000 }
            );
            
            // Recargar datos para actualizar la lista
            this.loadAmbitos();
            
            // Notificar a otros componentes sobre la actualización
            this.sharedDataService.notifyAmbitosUpdate();
          } else {
            console.error('❌ Error en respuesta de API al eliminar ámbito:', response?.message || 'Error desconocido');
            this.snackBar.open(
              `Error al eliminar ámbito: ${response?.message || 'Error desconocido'}`,
              'Cerrar',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
          }
        });
    });
  }
  
  /**
   * Maneja las acciones de la tabla
   */
  handleTableAction(event: any): void {
    console.log('🚨 Evento de tabla recibido:', event);
    
    // La estructura del evento puede tener item o row dependiendo del componente
    const dataItem = event.item || event.row;
    
    if (!event || !dataItem) {
      console.error('❌ Error: evento de tabla no tiene la estructura esperada', event);
      this.snackBar.open('Error al procesar la acción. Datos incompletos.', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    // Verificamos si tenemos un ID en el evento
    const itemId = dataItem.id || dataItem.IdAmbito;
    
    if (!itemId) {
      console.error('❌ Error: No se pudo obtener el ID del ámbito', dataItem);
      this.snackBar.open('Error al procesar la acción. ID no encontrado.', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    if (event.action === 'edit') {
      console.log('✏️ Editando ámbito con ID:', itemId);
      this.editAmbito(itemId);
    } else if (event.action === 'delete') {
      console.log('🚫 Eliminando ámbito con ID:', itemId);
      this.deleteAmbito(itemId);
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

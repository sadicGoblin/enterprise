import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-work-maintenance-popup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './work-maintenance-popup.component.html',
  styleUrls: ['./work-maintenance-popup.component.scss'],
})
export class WorkMaintenancePopupComponent implements OnInit {
  // User information
  userId: number;
  userName: string;
  collaborator: string;
  
  // Table configuration
  displayedColumns: string[] = ['work', 'enable', 'validator', 'reviewer'];
  dataSource: any[] = [];
  originalApiData: any[] = []; // Guardar los datos originales de la API
  
  // Loading and error states
  isLoading = false;
  hasError = false;
  errorMessage: string = '';
  
  // Track if changes have been made
  isDirty = false;

  // Seguimiento de cambios
  changesTracking: {
    idObra: string;
    work: string;
    field: string;
    oldValue: boolean;
    newValue: boolean;
    timestamp: Date;
  }[] = [];

  constructor(
    private dialogRef: MatDialogRef<WorkMaintenancePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: number, userName: string },
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {
    this.userId = data.userId;
    this.userName = data.userName;
    this.collaborator = data.userName || 'Usuario';
  }

  ngOnInit(): void {
    // Cargar datos reales
    this.loadUserWorks();
  }
  

  
  /**
   * Load user works from the API
   */
  loadUserWorks(): void {
    if (!this.userId) {
      this.hasError = true;
      this.errorMessage = 'No se pudo cargar las obras: ID de usuario no válido';
      return;
    }
    
    this.isLoading = true;
    this.hasError = false;
    
    this.usuarioService.getUserWorks(this.userId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          console.log('User works response:', response);
          
          // Mostrar respuesta completa para depuración
          console.log('Respuesta completa de la API:', response);
          
          // Corregir la lógica de procesamiento para extraer datos correctamente
          // Verificar si la respuesta es un array directamente o está dentro de un objeto
          let worksData = null;
          
          if (response && Array.isArray(response)) {
            // La respuesta es directamente un array
            worksData = response;
            console.log('La respuesta es directamente un array de obras');
          } else if (response && response.data && Array.isArray(response.data)) {
            // La respuesta tiene un campo data que es un array
            worksData = response.data;
            console.log('La respuesta contiene un campo data con array de obras');
          } else if (response && typeof response === 'object') {
            // Buscar cualquier propiedad que pueda contener un array de datos
            for (const key in response) {
              if (Array.isArray(response[key]) && response[key].length > 0) {
                // Verificar que tiene la estructura esperada (al menos el primer elemento)
                const firstItem = response[key][0];
                if (firstItem && (firstItem.Obra || firstItem.obra)) {
                  worksData = response[key];
                  console.log(`Encontrado array de datos en la propiedad ${key}`);
                  break;
                }
              }
            }
          }
          
          // Si se encontraron datos válidos
          if (worksData && Array.isArray(worksData) && worksData.length > 0) {
            // Guardar los datos originales
            this.originalApiData = JSON.parse(JSON.stringify(worksData));
            console.log('Datos originales de la API guardados:', this.originalApiData);
            
            // Normalizar nombres de propiedades (manejar mayúsculas/minúsculas)
            const normalizedData = worksData.map((item: any) => {
              // Crear un objeto normalizado que funcione independientemente de mayúsculas/minúsculas
              const normItem = {
                IdUsuarioObra: item.IdUsuarioObra || item.idusuarioobra || item.idUsuarioObra || '0',
                IdUsuario: item.IdUsuario || item.idusuario || item.idUsuario || '1',
                Habilita: item.Habilita || item.habilita || '0',
                IdObra: item.IdObra || item.idobra || item.idObra || '0',
                Obra: item.Obra || item.obra || 'Sin nombre',
                Validador: item.Validador || item.validador || '0',
                Revisor: item.Revisor || item.revisor || '0'
              };
              return normItem;
            });
            
            console.log('Datos normalizados:', normalizedData);
            
            // Convertir a formato de tabla con conversiones de tipo apropiadas
            const mappedData = normalizedData.map((item) => {
              const enable = item.Habilita === '1' || item.Habilita === 1 || item.Habilita === true;
              const validator = item.Validador === '1' || item.Validador === 1 || item.Validador === true;
              const reviewer = item.Revisor === '1' || item.Revisor === 1 || item.Revisor === true;
              
              const rowData = {
                work: item.Obra,
                enable: enable,
                validator: validator,
                reviewer: reviewer,
                idObra: item.IdObra,
                idUsuarioObra: item.IdUsuarioObra
              };
              
              console.log(`Fila procesada: ${item.Obra} -> enable:${enable}, validator:${validator}, reviewer:${reviewer}`);
              return rowData;
            });
            
            // Limpiar y asignar datos
            this.dataSource = [];
            
            // Usar setTimeout para forzar un nuevo ciclo de renderizado
            setTimeout(() => {
              console.log('Asignando datos finales al dataSource:', mappedData);
              this.dataSource = mappedData;
              this.cdr.detectChanges();
            }, 0);
          } else {
            // Si no se encontraron datos válidos
            console.warn('No se encontraron datos de obras válidos en la respuesta:', response);
            
            // Mostrar tabla vacía
            this.dataSource = [];
            console.log('No hay datos para mostrar en la tabla');
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error loading user works:', error);
          this.hasError = true;
          this.errorMessage = 'Error al cargar las obras. Por favor intente nuevamente.';
          
          // Fallback to empty data
          this.dataSource = [];
        }
      });
  }
  
  /**
   * Tracks checkbox changes
   * @param row The row that was changed
   * @param field The field that was changed (enable, validator, or reviewer)
   * @param newValue The new value of the checkbox
   */
  onCheckboxChange(row: any, field: string): void {
    this.isDirty = true;
    
    // Encontrar el valor original en los datos de la API
    const originalRow = this.originalApiData.find((item) => item.IdObra === row.idObra);
    
    if (originalRow) {
      // Determinar el valor original según el campo
      let originalFieldValue: boolean;
      
      switch(field) {
        case 'enable':
          originalFieldValue = originalRow.Habilita === '1' || originalRow.Habilita === 1;
          break;
        case 'validator':
          originalFieldValue = originalRow.Validador === '1' || originalRow.Validador === 1;
          break;
        case 'reviewer':
          originalFieldValue = originalRow.Revisor === '1' || originalRow.Revisor === 1;
          break;
        default:
          originalFieldValue = false;
      }
      
      // Solo registrar si el valor ha cambiado realmente
      if (originalFieldValue !== row[field]) {
        // Registrar el cambio
        this.changesTracking.push({
          idObra: row.idObra,
          work: row.work,
          field: field,
          oldValue: originalFieldValue,
          newValue: row[field],
          timestamp: new Date()
        });
        
        console.log(`Cambio registrado en ${row.work} - ${field}: ${originalFieldValue} -> ${row[field]}`);
      }
    }
  }
  
  /**
   * Save changes and close dialog
   */
  save(): void {
    // Activar indicador de carga
    this.isLoading = true;
    
    // Obtener obras únicas que hayan sido modificadas
    const modifiedWorks = new Set<string>();
    this.changesTracking.forEach(change => {
      modifiedWorks.add(change.idObra);
    });
    
    // Generar la estructura de datos para la API
    const dataItems: any[] = [];
    
    // Solo procesar las obras modificadas
    modifiedWorks.forEach(idObra => {
      // Encontrar la obra actual en el dataSource
      const obra = this.dataSource.find(item => item.idObra === idObra);
      
      if (obra) {
        // Agregar el item al array de data con el formato requerido
        dataItems.push({
          idObra: parseInt(obra.idObra, 10),  // Convertir a número
          Habilita: obra.enable ? 1 : 0,      // Usar número en lugar de string
          Validador: obra.validator ? 1 : 0,   // Usar número en lugar de string
          Revisador: obra.reviewer ? 1 : 0     // Nota: aquí se usa "Revisador" en lugar de "Revisor"
        });
      }
    });
    
    // Construir el objeto final para enviar a la API
    const requestBody = {
      caso: "ActualizaUserObraAll",
      idUsuario: this.userId,
      data: dataItems
    };
    
    // Mostrar el objeto final en consola
    console.log('Datos a enviar a la API:');
    console.log(JSON.stringify(requestBody, null, 2));
    
    if (dataItems.length === 0) {
      console.log('No hay cambios para guardar');
      this.isLoading = false;
      this.close();
      return;
    }
    
    console.log(`Se guardarán ${dataItems.length} obras modificadas`);
    
    // Realizar la llamada a la API para guardar los cambios
    this.usuarioService.saveUserWorks(requestBody).subscribe({
      next: (response) => {
        console.log('Respuesta de la API tras guardar:', response);
        this.isLoading = false;
        
        // Verificar si la respuesta indica éxito
        if (response && response.success) {
          console.log('Cambios guardados exitosamente');
          // Cerrar el diálogo con resultado exitoso
          this.dialogRef.close({ success: true, affectedWorks: dataItems.length });
        } else {
          // Mostrar error si la respuesta no es exitosa
          this.errorMessage = 'Error al guardar cambios: ' + (response.message || 'Error desconocido');
          this.hasError = true;
          console.error('Error al guardar cambios:', response);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error de conexión al guardar los cambios';
        this.hasError = true;
        console.error('Error al llamar a la API:', err);
      }
    });
  }

  /**
   * Close dialog without saving
   */
  close(): void {
    this.dialogRef.close();
    // if (this.isDirty) {
    //   if (confirm('¿Está seguro que desea salir sin guardar los cambios?')) {
    //     this.dialogRef.close();
    //   }
    // } else {
    //   this.dialogRef.close();
    // }
  }
}

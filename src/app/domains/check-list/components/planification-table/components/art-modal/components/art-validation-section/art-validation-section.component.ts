import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { catchError, finalize, of } from 'rxjs';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario.model';

interface Person {
  id: string;
  name: string;
  position?: string;
  positionId?: string;
}

interface Position {
  id: string;
  name: string;
}

@Component({
  selector: 'app-art-validation-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './art-validation-section.component.html',
  styleUrl: './art-validation-section.component.scss'
})
export class ArtValidationSectionComponent implements OnInit {
  // Form controls para los selects y inputs
  reviewerNameControl = new FormControl<string>('', Validators.required);
  reviewerPositionControl = new FormControl<string>({value: '', disabled: false}, Validators.required);
  reviewerDateControl = new FormControl<Date | null>(new Date(), Validators.required);
  
  validatorNameControl = new FormControl<string>('', Validators.required);
  validatorPositionControl = new FormControl<string>({value: '', disabled: false}, Validators.required);
  validatorDateControl = new FormControl<Date | null>(new Date(), Validators.required);
  
  ssomaObservationsControl = new FormControl<string>('');
  generalObservationsControl = new FormControl<string>('');
  
  // Archivos adjuntos
  ssomaAttachmentName: string = '';
  generalAttachmentName: string = '';
  ssomaAttachmentFile: File | null = null;
  generalAttachmentFile: File | null = null;
  
  // Listas para los selects
  reviewersList: Person[] = [];
  validatorsList: Person[] = [];
  positionsList: Position[] = [];
  
  // Estado de carga
  isLoading = false;
  hasError = false;
  
  // Mapeo de usuarios por ID para acceso rápido
  private usuariosMap: Map<string, Usuario> = new Map();
  
  constructor(private usuarioService: UsuarioService) {}
  
  ngOnInit(): void {
    // Cargar usuarios desde la API
    this.loadUsuarios();
    
    // Escuchar cambios en los controles para actualizar cargos
    this.reviewerNameControl.valueChanges.subscribe(userId => {
      if (userId) {
        const usuario = this.usuariosMap.get(userId);
        if (usuario) {
          // Deshabilitar el control de cargo y establecer el valor
          this.reviewerPositionControl.disable();
          this.reviewerPositionControl.setValue(usuario.IdCargo);
        } else {
          // Si no hay usuario seleccionado, habilitar el control
          this.reviewerPositionControl.enable();
          this.reviewerPositionControl.setValue('');
        }
      } else {
        // Si no hay usuario seleccionado, habilitar el control
        this.reviewerPositionControl.enable();
        this.reviewerPositionControl.setValue('');
      }
    });
    
    this.validatorNameControl.valueChanges.subscribe(userId => {
      if (userId) {
        const usuario = this.usuariosMap.get(userId);
        if (usuario) {
          // Deshabilitar el control de cargo y establecer el valor
          this.validatorPositionControl.disable();
          this.validatorPositionControl.setValue(usuario.IdCargo);
        } else {
          // Si no hay usuario seleccionado, habilitar el control
          this.validatorPositionControl.enable();
          this.validatorPositionControl.setValue('');
        }
      } else {
        // Si no hay usuario seleccionado, habilitar el control
        this.validatorPositionControl.enable();
        this.validatorPositionControl.setValue('');
      }
    });
  }
  
  /**
   * Carga los usuarios desde la API
   */
  loadUsuarios(): void {
    this.isLoading = true;
    this.hasError = false;
    
    this.usuarioService.getUsuarios()
      .pipe(
        catchError(error => {
          console.error('Error al cargar usuarios:', error);
          this.hasError = true;
          return of({ success: false, code: -1, message: 'Error', data: [] });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        if (response.success && response.data && response.data.length > 0) {
          // Mapear los usuarios a la estructura Person
          const usuarios = response.data.map(usuario => ({
            id: usuario.IdUsuario,
            name: usuario.Nombre,
            positionId: usuario.IdCargo,
            position: usuario.Cargo
          }));
          
          // Actualizar las listas
          this.reviewersList = [...usuarios];
          this.validatorsList = [...usuarios];
          
          // Crear un mapa de usuarios por ID para acceso rápido
          response.data.forEach(usuario => {
            this.usuariosMap.set(usuario.IdUsuario, usuario);
          });
          
          // Extraer cargos únicos para la lista de posiciones
          const uniquePositions = new Map<string, Position>();
          response.data.forEach(usuario => {
            if (!uniquePositions.has(usuario.IdCargo)) {
              uniquePositions.set(usuario.IdCargo, {
                id: usuario.IdCargo,
                name: usuario.Cargo
              });
            }
          });
          
          this.positionsList = Array.from(uniquePositions.values());
        }
      });
  }
  
  /**
   * Método para recargar los usuarios desde la API
   */
  reloadUsuarios(): void {
    this.loadUsuarios();
  }
  
  /**
   * Maneja la selección de archivo para observaciones generales
   * @param event Evento del input file
   */
  onGeneralFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.generalAttachmentFile = input.files[0];
      this.generalAttachmentName = this.generalAttachmentFile.name;
    }
  }

  /**
   * Elimina el archivo adjunto general
   */
  removeGeneralAttachment(): void {
    this.generalAttachmentFile = null;
    this.generalAttachmentName = '';
  }
  
  /**
   * Valida el formulario de validación y marca los campos como tocados para mostrar errores
   * @returns true si el formulario es válido, false en caso contrario
   */
  validateForm(): boolean {
    // Verificar si los controles requeridos son válidos
    // Para controles deshabilitados, considerarlos válidos si tienen un valor
    const reviewerNameValid = this.reviewerNameControl.valid;
    const reviewerPositionValid = this.reviewerPositionControl.disabled ? 
      !!this.reviewerPositionControl.value : this.reviewerPositionControl.valid;
    
    const validatorNameValid = this.validatorNameControl.valid;
    const validatorPositionValid = this.validatorPositionControl.disabled ? 
      !!this.validatorPositionControl.value : this.validatorPositionControl.valid;
    
    const reviewerValid = reviewerNameValid && reviewerPositionValid;
    const validatorValid = validatorNameValid && validatorPositionValid;
    
    console.log('reviewerNameValid', reviewerNameValid);
    console.log('reviewerPositionValid', reviewerPositionValid);
    console.log('validatorNameValid', validatorNameValid);
    console.log('validatorPositionValid', validatorPositionValid);
    console.log('reviewerValid', reviewerValid);
    console.log('validatorValid', validatorValid);
    
    // Si no son válidos, marcar como tocados para mostrar errores
    if (!reviewerValid) {
      this.reviewerNameControl.markAsTouched();
      if (!this.reviewerPositionControl.disabled) {
        this.reviewerPositionControl.markAsTouched();
      }
    }
    
    if (!validatorValid) {
      this.validatorNameControl.markAsTouched();
      if (!this.validatorPositionControl.disabled) {
        this.validatorPositionControl.markAsTouched();
      }
    }
    
    return reviewerValid && validatorValid;
  }
  
  /**
   * Método para guardar los datos de validación
   */
  saveValidation(): void {
    if (this.validateForm()) {
      const validationData = {
        reviewer: {
          id: this.reviewerNameControl.value,
          position: this.reviewerPositionControl.value,
          date: this.reviewerDateControl.value
        },
        validator: {
          id: this.validatorNameControl.value,
          position: this.validatorPositionControl.value,
          date: this.validatorDateControl.value
        },
        observations: {
          ssoma: {
            text: this.ssomaObservationsControl.value,
            attachment: this.ssomaAttachmentFile ? this.ssomaAttachmentFile.name : null
          },
          general: {
            text: this.generalObservationsControl.value,
            attachment: this.generalAttachmentFile ? this.generalAttachmentFile.name : null
          }
        }
      };
      
      console.log('Datos de validación:', validationData);
      // Aquí se implementaría la llamada a la API para guardar los datos
    }
  }
}

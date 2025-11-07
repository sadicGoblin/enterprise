import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProxyService } from '../../core/services/proxy.service';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-recover-password',
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
  ],
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss'],
})
export class RecoverPasswordComponent implements OnInit {
  password: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  hash: string = '';

  // Toggle para mostrar/ocultar contraseñas
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;

  // Validación de hash
  isHashValid: boolean = false;
  isValidatingHash: boolean = true;
  hashErrorMessage: string = '';

  // Estado de cambio de contraseña exitoso
  passwordChangedSuccessfully: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private proxyService: ProxyService
  ) {}

  ngOnInit(): void {
    // Capturar el hash de los query params
    this.route.queryParams.subscribe((params) => {
      this.hash = params['hash'] || '';

      if (!this.hash) {
        this.isValidatingHash = false;
        this.hashErrorMessage =
          'No se encontró el código de recuperación. Por favor solicita un nuevo enlace.';
        this.showErrorMessage(this.hashErrorMessage);
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      } else {
        // Si hay hash, validarlo
        this.validateHash();
      }
    });
  }

  /**
   * Valida que el hash sea válido y no haya expirado
   */
  validateHash(): void {
    this.isValidatingHash = true;

    const requestBody = {
      caso: 'checkHash',
      hash: this.hash,
    };

    console.log('Validando hash:', requestBody);

    this.proxyService
      .post<any>(environment.apiBaseUrl + '/ws/UsuarioSvcImpl.php', requestBody)
      .pipe(finalize(() => (this.isValidatingHash = false)))
      .subscribe({
        next: (response) => {
          console.log('Respuesta validación hash:', response);

          // Verificar si el hash es válido
          if (response.success === true && response.code === 200) {
            // Hash válido, permitir cambio de contraseña
            this.isHashValid = true;
            this.hashErrorMessage = '';
          } else {
            // Otro error
            this.isHashValid = false;
            this.hashErrorMessage =
              response.message || 'Error al validar la solicitud';
            this.showErrorMessage(this.hashErrorMessage);
          }
        },
        error: (error) => {
          // Hash expirado o inválido
          this.isHashValid = false;
          this.hashErrorMessage = 'Solicitud vencida';
          this.showErrorMessage(this.hashErrorMessage, 10000); // Mostrar por 10 segundos
        },
      });
  }

  /**
   * Valida que la contraseña cumpla con los requisitos mínimos
   */
  validatePassword(value: string): boolean {
    if (!value || value.length < 4) {
      return false;
    }

    const letters = value.match(/[a-zA-Z]/g);
    const numbers = value.match(/[0-9]/g);

    return (letters?.length || 0) >= 2 && (numbers?.length || 0) >= 2;
  }

  /**
   * Valida que ambas contraseñas coincidan
   */
  validatePasswordsMatch(): boolean {
    return this.password === this.confirmPassword && this.password.length > 0;
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit() {
    // Validar que exista el hash
    if (!this.hash) {
      this.showErrorMessage('No se encontró el código de recuperación');
      return;
    }

    // Validar contraseña
    if (!this.validatePassword(this.password)) {
      this.showErrorMessage(
        'La contraseña debe contener al menos 4 caracteres (2 letras y 2 números)'
      );
      return;
    }

    // Validar que las contraseñas coincidan
    if (!this.validatePasswordsMatch()) {
      this.showErrorMessage('Las contraseñas no coinciden');
      return;
    }

    this.isLoading = true;

    // Preparar el request body
    const requestBody = {
      caso: 'newPassword',
      hash: this.hash,
      password: this.password,
    };

    console.log('Enviando solicitud de cambio de contraseña:', requestBody);

    // Llamar al servicio
    this.proxyService
      .post<any>(environment.apiBaseUrl + '/ws/UsuarioSvcImpl.php', requestBody)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);

          // Verificar respuesta exitosa (soporta ambos formatos de respuesta)
          if (
            response.success === true ||
            response.code === 200 ||
            response.codigo === 200
          ) {
            // Marcar como exitoso y mostrar mensaje
            this.passwordChangedSuccessfully = true;
          } else {
            // Mostrar mensaje de error del servidor
            const errorMsg =
              response.message ||
              response.glosa ||
              'Error al actualizar la contraseña';
            this.showErrorMessage(errorMsg);
          }
        },
        error: (error) => {
          console.error('Error al cambiar contraseña:', error);
          this.showErrorMessage(
            'Error al conectar con el servidor. Por favor intenta nuevamente.'
          );
        },
      });
  }

  /**
   * Mostrar mensaje de error
   */
  private showErrorMessage(message: string, duration: number = 4000) {
    this.snackBar.open(message, 'Cerrar', {
      duration: duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-error'],
    });
  }

  /**
   * Mostrar mensaje de éxito
   */
  private showSuccessMessage(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-success'],
    });
  }
}

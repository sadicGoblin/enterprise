import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ProxyService } from '../../../../../core/services/proxy.service';

@Component({
  selector: 'app-change-passwords',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './change-passwords.component.html',
  styleUrls: ['./change-passwords.component.scss']
})
export class ChangePasswordsComponent {
  // User credentials
  username: string = 'usuario_actual'; // Default value - would be replaced with actual username
  oldPassword: string = '';
  newPassword: string = '';
  repeatPassword: string = '';
  userId: number = 0;  
  // Loading state for button
  loading: boolean = false;
  
  constructor(
    private proxyService: ProxyService,
    private snackBar: MatSnackBar
  ) {
    try {
      this.username = localStorage.getItem('userName') || 'user';
    } catch (error) {
      console.error('Error al obtener el nombre de usuario:', error);
      this.username = 'usuario_sistema';
    }
  }
  

  /**
   * Converts a string to Base64 encoding
   */
  convertToBase64(text: string): string {
    // For proper Base64 encoding in production, use a proper library
    // This is a simple implementation for demonstration purposes
    return btoa(text);
  }

  /**
   * Validates the form fields before submission
   */
  validateForm(): boolean {
    if (!this.username || !this.oldPassword || !this.newPassword || !this.repeatPassword) {
      this.showMessage('Por favor complete todos los campos');
      return false;
    }
    
    if (this.newPassword !== this.repeatPassword) {
      this.showMessage('Las nuevas claves no coinciden');
      return false;
    }
    
    return true;
  }
  
  /**
   * Shows a message to the user using snackbar
   */
  showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Handles the password change operation
   */
  changePassword(): void {
    this.loading = true;
    if (!this.validateForm()) {
      this.loading = false;
      return;
    }
    if(this.newPassword != this.repeatPassword){
      this.showMessage('Las nuevas claves no coinciden');
      this.loading = false;
      return;
    }

    try {
      this.userId = parseInt(localStorage.getItem('userId') || '0');
    } catch (error) {
      console.error('Error al obtener el ID de usuario:', error);
      this.loading = false;
      return;
    }
    // Prepare request body according to API requirements
    const requestBody = {
      "caso": "ModificaClave",
      "idUsuario": this.userId,
      "clave": this.convertToBase64(this.oldPassword),
    };
    
    // Call API to change password
    this.proxyService.post('/ws/UsuarioSvcImpl.php', requestBody).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response) {
          this.showMessage('Contraseña cambiada exitosamente');
          this.resetForm();
        } else {
          this.showMessage(response?.mensaje || 'Error al cambiar contraseña');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error changing password:', error);
        this.showMessage('Error al comunicarse con el servidor');
      }
    });
  }
  
  /**
   * Resets the form after successful submission
   */
  resetForm(): void {
    this.oldPassword = '';
    this.newPassword = '';
    this.repeatPassword = '';
  }
}
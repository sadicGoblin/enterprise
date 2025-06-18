import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { finalize } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    HttpClientModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements AfterViewInit {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router, 
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}


  ngAfterViewInit(): void {
    particlesJS.load('particles-js', 'assets/particles.json', () => {
      console.log('particles.js config loaded');
    });
  }

  onLogin() {
    if (!this.email) {
      this.showErrorMessage('Por favor ingrese su usuario');
      return;
    }
    
    this.isLoading = true;
    
    // Call login service with only username, no password needed as per the API requirements
    this.authService.login(this.email)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          console.log('[LoginComponent] Login response:', response);
          
          // Check for successful response (supporting both new and legacy formats)
          const isSuccess = (response.success === true) || (response.glosa === 'Ok');
          
          if (isSuccess) {
            console.log('[LoginComponent] Login successful');
            
            // No need to load user profile separately since all data comes in the login response
            // Navigate to main dashboard
            this.router.navigate(['/check-list']);
          } else {
            // Use either new or legacy error message
            const errorMsg = response.message || response.glosa || 'Error de autenticación';
            this.showErrorMessage(errorMsg);
          }
        },
        error: (error) => {
          console.error('[LoginComponent] Login error:', error);
          this.showErrorMessage('Error al conectar con el servidor');
        }
      });
  }
  
  /**
   * Load user profile after successful login
   */
  private loadUserProfile() {
    console.log('Loading user profile...');
    this.authService.getUserProfile()
      .subscribe({
        next: (profileResponse) => {
          console.log('Profile response:', profileResponse);
          if (profileResponse.glosa !== 'Ok') {
            console.warn('Profile load warning:', profileResponse.glosa);
          } else if (profileResponse.data && profileResponse.data.length > 0) {
            console.log('Profile data loaded successfully:', profileResponse.data[0]);
            // You can store or process additional profile data here if needed
          }
        },
        error: (error) => {
          console.error('Profile load error:', error);
        }
      });
  }
  
  /**
   * Display error message in snackbar
   */
  private showErrorMessage(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-error']
    });
  }
    
}

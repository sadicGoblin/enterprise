import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements AfterViewInit {
  email: string = '';
  password: string = '';

  constructor(private router: Router, private snackBar: MatSnackBar) {}


  ngAfterViewInit(): void {
    particlesJS.load('particles-js', 'assets/particles.json', () => {
      console.log('particles.js config loaded');
    });
  }

  onLogin() {
    if (this.email === 'admin' && this.password === 'admin') {
      // Aquí redirigimos al dominio check-list, por ejemplo a su dashboard
      this.router.navigate(['/check-list']);
    } else {
      this.snackBar.open('Credenciales inválidas', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['snackbar-error']
      });
      
    }
  }
    
}

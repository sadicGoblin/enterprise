import { Component, EventEmitter, Output } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatMenuModule, MatIconModule, MatButtonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {

  userName: string; // Declare userName, will be set in constructor

  constructor(
    private route: Router,
    private authService: AuthService
  ) {
    this.userName = localStorage.getItem('userFullName') || 'Usuario'; // Fetch from localStorage or fallback
  }

  @Output() sidebarToggle = new EventEmitter<void>();


  isCollapsed = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit();
  }

  logout() {
    console.log('Cerrando sesión y limpiando datos...');
    
    // Usar el método logout del AuthService que limpia todo el localStorage
    this.authService.logout();
    
    // Redirigir al login
    this.route.navigate(['']);
  }
}

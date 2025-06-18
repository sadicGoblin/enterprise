import { Component, EventEmitter, Output } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatMenuModule, MatIconModule, MatButtonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {

  userName: string; // Declare userName, will be set in constructor

  constructor(private route: Router) {
    this.userName = localStorage.getItem('userFullName') || 'Usuario'; // Fetch from localStorage or fallback
  }

  @Output() sidebarToggle = new EventEmitter<void>();


  isCollapsed = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit();
  }

  logout() {
    console.log('Sesión cerrada');
    this.route.navigate(['']);
  }
}

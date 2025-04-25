import { Component } from '@angular/core';
import { SidebarComponent } from "../../../../layout/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "../../../../layout/navbar/navbar.component";

@Component({
  selector: 'app-check-list-layout',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet, NavbarComponent],
  templateUrl: './check-list-layout.component.html',
  styleUrl: './check-list-layout.component.scss'
})

export class CheckListLayoutComponent {

  userRole = '';
  isSidebarCollapsed = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}

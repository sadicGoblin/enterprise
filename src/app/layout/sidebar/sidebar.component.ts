import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  expanded: boolean;
  items: NavItem[];
}

interface NavItem {
  label: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() userRole: string = '';
  @Input() isCollapsed = false;

  /** Ítem directo (sin grupo) — Plan Personalizado. */
  readonly directItem: NavItem = {
    label: 'Plan Personalizado',
    icon: 'event_available',
    link: 'planning',
  };

  /** Grupos de navegación. */
  groups: NavGroup[] = [
    {
      id: 'reports',
      label: 'Reportes',
      icon: 'bar_chart',
      expanded: true,
      items: [
        { label: 'Reporte Actividades', icon: 'edit_note',  link: 'reports/add' },
        { label: 'Reporte Histórico',   icon: 'history',    link: 'reports/history' },
        { label: 'Reporte SSTMA Obra',  icon: 'business',   link: 'reports/sstma-obra' },
      ],
    },
    {
      id: 'accidents',
      label: 'Accidentes',
      icon: 'report',
      expanded: true,
      items: [
        { label: 'Ingreso',       icon: 'add_circle', link: 'accidents/register' },
        { label: 'Listado',       icon: 'list_alt',   link: 'accidents/list' },
        { label: 'Estadísticas',  icon: 'analytics',  link: 'accidents/statistics' },
        { label: 'Masa Laboral',  icon: 'groups',     link: 'accidents/masa-laboral' },
        { label: 'Trabajadores',  icon: 'badge',      link: 'accidents/workers' },
      ],
    },
    {
      id: 'custom-program',
      label: 'Programa Personalizado',
      icon: 'menu_book',
      expanded: true,
      items: [
        { label: 'Carga Actividades', icon: 'playlist_add',   link: 'custom-program/activities' },
        { label: 'Replicar PP',       icon: 'content_copy',   link: 'custom-program/replicate' },
        { label: 'Biblioteca',        icon: 'library_books',  link: 'custom-program/library' },
      ],
    },
    {
      id: 'maintenance',
      label: 'Mantenedor',
      icon: 'build',
      expanded: false,
      items: [
        { label: 'Obras',                     icon: 'home_work', link: 'maintenance/work' },
        { label: 'Param. Plan Personalizado', icon: 'tune',      link: 'maintenance/custom-params' },
        { label: 'Parámetros',                icon: 'settings',  link: 'maintenance/params' },
      ],
    },
    {
      id: 'administration',
      label: 'Administración',
      icon: 'admin_panel_settings',
      expanded: false,
      items: [
        { label: 'Mapa Organizacional', icon: 'account_tree', link: 'administration/organizational-map' },
        { label: 'Cambio Clave',        icon: 'vpn_key',      link: 'administration/password-change' },
        { label: 'Accesos',             icon: 'people',       link: 'administration/accesses' },
      ],
    },
  ];

  toggleGroup(g: NavGroup): void {
    g.expanded = !g.expanded;
  }
}

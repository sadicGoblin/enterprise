import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserContextService } from '../../core/services/user-context.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { ObraService } from '../../domains/check-list/services/obra.service';
import { ProjectSelectionService } from '../../domains/check-list/services/project-selection.service';
import { ObraSimple } from '../../domains/check-list/models/obra.models';

interface Crumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() sidebarToggle = new EventEmitter<void>();

  userName: string;
  obras: ObraSimple[] = [];
  selectedObraId: string | null = null;
  crumbs: Crumb[] = [];

  private routerSub?: Subscription;

  /** Mapa segmento → etiqueta legible para breadcrumbs. */
  private readonly segmentLabels: Record<string, string> = {
    'check-list': 'Check List',
    'reports': 'Reportes',
    'add': 'Reporte Actividades',
    'history': 'Histórico',
    'sstma-obra': 'SSTMA Obra',
    'accidents': 'Accidentes',
    'register': 'Ingreso',
    'edit': 'Editar',
    'list': 'Listado',
    'statistics': 'Estadísticas',
    'masa-laboral': 'Masa Laboral',
    'workers': 'Trabajadores',
    'new': 'Nuevo',
    'custom-program': 'Programa Personalizado',
    'activities': 'Carga Actividades',
    'replicate': 'Replicar PP',
    'library': 'Biblioteca',
    'maintenance': 'Mantenedor',
    'work': 'Obras',
    'custom-params': 'Param. Plan',
    'params': 'Parámetros',
    'administration': 'Administración',
    'organizational-map': 'Mapa Organizacional',
    'password-change': 'Cambio Clave',
    'accesses': 'Accesos',
    'planning': 'Plan Personalizado',
    'dashboard': 'Dashboard',
  };

  themeMode: ThemeMode = 'light';
  private themeSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userContext: UserContextService,
    private themeService: ThemeService,
    private obraService: ObraService,
    private projectSelection: ProjectSelectionService,
  ) {
    this.userName = localStorage.getItem('userFullName') || 'Usuario';
  }

  ngOnInit(): void {
    this.computeCrumbs(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.computeCrumbs(e.urlAfterRedirects));

    this.loadObras();

    // Hidratar selección persistida (si existe).
    const current = this.projectSelection.getCurrentProjectId();
    if (current) this.selectedObraId = current;

    // Tema activo (light/dark) para el toggle del menú.
    this.themeMode = this.themeService.current;
    this.themeSub = this.themeService.mode$.subscribe((m) => (this.themeMode = m));
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.themeSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  goToProfile(): void {
    // Sin pantalla dedicada todavía: redirige al cambio de clave como acceso rápido.
    this.router.navigate(['/check-list/administration/password-change']);
  }

  goToPasswordChange(): void {
    this.router.navigate(['/check-list/administration/password-change']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['']);
  }

  onObraChange(value: string): void {
    this.selectedObraId = value || null;
    this.projectSelection.setSelectedProjectId(this.selectedObraId);
    if (this.selectedObraId) {
      this.router.navigate(['/check-list/obras', this.selectedObraId]);
    }
  }

  get userInitials(): string {
    const n = (this.userName || '').trim();
    if (!n) return '—';
    const parts = n.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  get selectedObraLabel(): string {
    if (!this.selectedObraId) return 'Selecciona obra';
    const o = this.obras.find((x) => x.IdObra === this.selectedObraId);
    return o ? o.Obra : 'Obra activa';
  }

  private loadObras(): void {
    const userId = this.userContext.getUserId();
    const obs = userId
      ? this.obraService.getObrasByUser(Number(userId))
      : this.obraService.getObras();

    obs.subscribe({
      next: (resp) => {
        if (resp.success && Array.isArray(resp.data)) {
          this.obras = (resp.data as any[]).map((d) => ({
            IdObra: String(d.IdObra),
            Obra: String(d.Obra),
          }));
        }
      },
      error: (err) => {
        // Silencioso: el navbar sigue navegable sin selector
        console.warn('[Navbar] No se pudieron cargar obras:', err);
      },
    });
  }

  private computeCrumbs(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    const crumbs: Crumb[] = [];
    let acc = '';
    for (const seg of segments) {
      acc += '/' + seg;
      // Saltar segmentos numéricos (probablemente ids)
      if (/^\d+$/.test(seg)) continue;
      const label = this.segmentLabels[seg] ?? this.titleCase(seg);
      crumbs.push({ label, link: acc });
    }
    this.crumbs = crumbs;
  }

  private titleCase(s: string): string {
    return s
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

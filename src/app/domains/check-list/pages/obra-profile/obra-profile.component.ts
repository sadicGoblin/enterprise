import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ObraService } from '../../services/obra.service';
import { AccidenteService, ListarTrabajadoresResponseItem } from '../../services/accidente.service';
import { Obra } from '../../models/obra.models';
import { AccidenteApiResponse, CalificacionPotencialSeveridad } from '../accidents/models/accident.model';
import { BtnComponent, KpiTileComponent, PillComponent, PillVariant } from '../../../../shared/ui';
import { ProjectSelectionService } from '../../services/project-selection.service';

interface BodyPartBucket {
  label: string;
  count: number;
  percent: number;
}

interface MonthBucket {
  label: string;
  count: number;
}

@Component({
  selector: 'app-obra-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatProgressSpinnerModule,
    BtnComponent,
    PillComponent,
    KpiTileComponent,
  ],
  templateUrl: './obra-profile.component.html',
  styleUrls: ['./obra-profile.component.scss'],
})
export class ObraProfileComponent implements OnInit, OnDestroy {
  isLoading = true;
  hasError = false;
  errorMessage = '';

  obraId: string | null = null;
  obra: Obra | null = null;

  accidents: AccidenteApiResponse[] = [];
  workers: ListarTrabajadoresResponseItem[] = [];

  // KPIs derivados
  totalAccidentes = 0;
  totalTrabajadores = 0;
  diasSinAccidente: number | null = null;
  diasPerdidosAcumulados = 0;
  reportesUltMes = 0;

  // Charts (datos)
  bodyParts: BodyPartBucket[] = [];
  accidentsByMonth: MonthBucket[] = [];

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private obraService: ObraService,
    private accidenteService: AccidenteService,
    private projectSelection: ProjectSelectionService,
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.obraId = id;
      if (id) {
        this.projectSelection.setSelectedProjectId(id);
        this.load(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  reload(): void {
    if (this.obraId) this.load(this.obraId);
  }

  goToAccidents(): void {
    this.router.navigate(['/check-list/accidents/list']);
  }

  goToReports(): void {
    this.router.navigate(['/check-list/reports/sstma-obra']);
  }

  goToPlanning(): void {
    this.router.navigate(['/check-list/planning']);
  }

  // ---------------------------------------------------------------------------
  // Carga de datos
  // ---------------------------------------------------------------------------
  private load(id: string): void {
    this.isLoading = true;
    this.hasError = false;

    const obras$ = this.obraService.getObras().pipe(
      map((resp) => {
        if (resp.success && Array.isArray(resp.data)) {
          return resp.data.find((o) => String(o.IdObra) === String(id)) ?? null;
        }
        return null;
      }),
      catchError(() => of(null)),
    );

    // listarAccidentes acepta filters; pedimos todo y filtramos por obra en cliente.
    const accidents$ = this.accidenteService.listarAccidentes({ limit: 1000, offset: 0 }).pipe(
      map((resp: any) => (resp?.success && Array.isArray(resp.data)) ? resp.data : []),
      catchError(() => of([] as AccidenteApiResponse[])),
    );

    const workers$ = this.accidenteService.listarTrabajadores({ limit: 500, offset: 0, include_inactive: false }).pipe(
      map((resp: any) => (resp?.success && Array.isArray(resp.data)) ? resp.data : []),
      catchError(() => of([] as ListarTrabajadoresResponseItem[])),
    );

    forkJoin({ obra: obras$, accidents: accidents$, workers: workers$ }).subscribe({
      next: ({ obra, accidents, workers }) => {
        this.obra = obra;
        // Filtramos accidentes por obra (heurística por NombreObra cuando IdObra no viene).
        const obraName = obra?.Obra;
        this.accidents = (accidents as AccidenteApiResponse[]).filter((a) => {
          if ((a as any).IdObra) return String((a as any).IdObra) === String(id);
          if (obraName && a.NombreObra) return a.NombreObra === obraName;
          return false;
        });
        this.workers = workers;
        this.computeMetrics();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[ObraProfile] Error:', err);
        this.hasError = true;
        this.errorMessage = 'No fue posible cargar el perfil de la obra.';
        this.isLoading = false;
      },
    });
  }

  private computeMetrics(): void {
    this.totalAccidentes = this.accidents.length;
    this.totalTrabajadores = this.workers.length;

    // Días sin accidente: hoy - max(FechaAccidente)
    let maxMs = 0;
    let lostDays = 0;
    for (const a of this.accidents) {
      const raw = a.FechaAccidente;
      if (raw) {
        const t = new Date(typeof raw === 'string' && !raw.includes('T') ? raw + 'T00:00:00' : raw).getTime();
        if (!isNaN(t) && t > maxMs) maxMs = t;
      }
      const dpf = parseInt(a.DiasPerdidosFinal || '0', 10);
      if (!isNaN(dpf)) lostDays += dpf;
    }
    if (maxMs > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      this.diasSinAccidente = Math.max(0, Math.floor((today.getTime() - maxMs) / 86_400_000));
    } else {
      this.diasSinAccidente = null;
    }
    this.diasPerdidosAcumulados = lostDays;

    // Reportes último mes (basado en created_at)
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    this.reportesUltMes = this.accidents.filter((a) => {
      const c = (a as any).created_at;
      if (!c) return false;
      const t = new Date(c.includes('T') ? c : c.replace(' ', 'T')).getTime();
      return !isNaN(t) && t >= monthAgo.getTime();
    }).length;

    // Parte del cuerpo (top 6)
    const bpMap = new Map<string, number>();
    for (const a of this.accidents) {
      const k = ((a as any).ParteCuerpo || (a as any).TipoLesion || 'Sin clasificar').toString().trim();
      bpMap.set(k, (bpMap.get(k) ?? 0) + 1);
    }
    const total = this.totalAccidentes || 1;
    this.bodyParts = Array.from(bpMap.entries())
      .map(([label, count]) => ({ label, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Por mes (últimos 6 meses)
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: monthLabels[d.getMonth()],
      });
    }
    const byMonth = new Map<string, number>();
    for (const a of this.accidents) {
      const raw = a.FechaAccidente;
      if (!raw) continue;
      const d = new Date(typeof raw === 'string' && !raw.includes('T') ? raw + 'T00:00:00' : raw);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    }
    this.accidentsByMonth = months.map((m) => ({ label: m.label, count: byMonth.get(m.key) ?? 0 }));
  }

  // ---------------------------------------------------------------------------
  // Helpers para pills/avatars
  // ---------------------------------------------------------------------------
  severityVariant(gravedad: string | null | undefined): PillVariant {
    const v = (gravedad || '').toLowerCase();
    if (v === 'fatal' || v === 'grave') return 'danger';
    if (v === 'importante') return 'warn';
    if (v === 'menor') return 'info';
    if (v === 'leve') return 'success';
    return 'neutral';
  }

  initials(nombre: string | null | undefined): string {
    if (!nombre) return '—';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    const dt = new Date(d.includes('T') ? d : d + 'T00:00:00');
    return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('es-CL');
  }

  /** Pico máximo entre los buckets mensuales para escalar las barras. */
  get maxMonthCount(): number {
    return Math.max(1, ...this.accidentsByMonth.map((m) => m.count));
  }

  /** Accidentes recientes (top 5). */
  get recentAccidents(): AccidenteApiResponse[] {
    return [...this.accidents]
      .sort((a, b) => {
        const ta = new Date(a.FechaAccidente || 0).getTime();
        const tb = new Date(b.FechaAccidente || 0).getTime();
        return tb - ta;
      })
      .slice(0, 5);
  }

  /** Trabajadores top 5 (activos primero, por nombre). */
  get topWorkers(): ListarTrabajadoresResponseItem[] {
    return [...this.workers]
      .filter((w) => {
        const v = (w as any).is_active;
        const n = typeof v === 'string' ? parseInt(v, 10) : v;
        return n === 1;
      })
      .slice(0, 5);
  }
}

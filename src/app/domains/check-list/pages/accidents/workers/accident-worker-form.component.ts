import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccidenteService, TrabajadorDto } from '../../../services/accidente.service';

@Component({
  selector: 'app-accident-worker-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './accident-worker-form.component.html',
  styleUrl: './accident-worker-form.component.scss'
})
export class AccidentWorkerFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  isLoading = false;
  workerId: number | null = null;
  nombreReadonly: string | null = null;
  rutReadonly: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private accidenteService: AccidenteService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      Nombre: ['', [Validators.required, Validators.minLength(3)]],
      RUT: [''],
      FechaNacimiento: [''],
      Telefono: [''],
      Email: ['', [Validators.email]],
      is_active: [true]
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.workerId = parseInt(idParam, 10);
      this.loadWorker(this.workerId);
    }
  }

  private loadWorker(id: number): void {
    this.isLoading = true;
    this.accidenteService.getTrabajador(id).subscribe({
      next: (resp) => {
        this.isLoading = false;
        if (resp.success && resp.data) {
          const d = resp.data as TrabajadorDto;
          this.nombreReadonly = d.Nombre ?? null;
          this.rutReadonly = d.RUT ?? null;

          this.form.patchValue({
            Nombre: d.Nombre ?? '',
            RUT: d.RUT ?? '',
            FechaNacimiento: d.FechaNacimiento ?? '',
            Telefono: d.Telefono ?? '',
            Email: d.Email ?? '',
            is_active: (String(d.is_active ?? '').trim() === '1')
          });

          // Nombre/RUT no se actualizan por API (backend lo indica)
          this.form.get('Nombre')?.disable({ emitEvent: false });
          this.form.get('RUT')?.disable({ emitEvent: false });
        } else {
          this.show('No se encontró el trabajador', 'error');
          this.goBack();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[WorkerForm] Error loading:', err);
        this.show('Error al cargar trabajador', 'error');
        this.goBack();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.show('Complete los campos requeridos', 'error');
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      Nombre: (raw.Nombre || '').trim(),
      RUT: (raw.RUT || '').trim() || null,
      FechaNacimiento: raw.FechaNacimiento ? String(raw.FechaNacimiento).trim() : null,
      Telefono: raw.Telefono ? String(raw.Telefono).trim() : null,
      Email: raw.Email ? String(raw.Email).trim() : null,
      is_active: raw.is_active ? 1 : 0
    };

    this.isLoading = true;

    if (!this.isEditMode) {
      this.accidenteService.crearTrabajador(payload).subscribe({
        next: (resp) => {
          this.isLoading = false;
          if (resp.success && resp.data) {
            const id = (resp.data as any).id;
            this.show('Trabajador creado', 'success');
            if (id) {
              this.router.navigate(['/check-list/accidents/workers/edit', id]);
            } else {
              this.goBack();
            }
          } else {
            this.show(resp.message || 'Error al crear trabajador', 'error');
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('[WorkerForm] Error create:', err);
          this.show('Error de conexión al crear', 'error');
        }
      });
      return;
    }

    const id = this.workerId!;
    this.accidenteService.actualizarTrabajador(id, {
      FechaNacimiento: payload.FechaNacimiento,
      Telefono: payload.Telefono,
      Email: payload.Email,
      is_active: payload.is_active
    }).subscribe({
      next: (resp) => {
        this.isLoading = false;
        if (resp.success) {
          this.show('Trabajador actualizado', 'success');
          this.goBack();
        } else {
          this.show(resp.message || 'Error al actualizar', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[WorkerForm] Error update:', err);
        this.show('Error de conexión al actualizar', 'error');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/check-list/accidents/workers']);
  }

  private show(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3500,
      panelClass: type === 'success' ? ['snackbar-success'] : ['snackbar-error']
    });
  }
}


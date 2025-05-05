import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-check-list-access',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatCheckboxModule,
    FormsModule,
  ],
  templateUrl: './check-list-access.component.html',
  styleUrl: './check-list-access.component.scss',
})
export class CheckListAccessComponent {
  roles = ['Sin Acceso', 'Usuario General', 'Super Usuario'];
  selectedRole = 'Usuario General';

  displayedColumns: string[] = ['screen', 'access', 'write'];

  screenPermissions = [
    { name: 'Planificación', access: true, write: false },
    { name: 'Ingreso Reportes', access: true, write: true },
    { name: 'DashBoard', access: true, write: false },
    { name: 'Carga Actividades', access: false, write: false },
    { name: 'Obras', access: true, write: true },
    { name: 'Param. Plan Personalizado', access: true, write: true },
    { name: 'Accesos', access: true, write: false },
    { name: 'Biblioteca', access: false, write: true },
    { name: 'Cambio Clave', access: false, write: false },
    { name: 'Mapa Organizacional', access: true, write: false },
    { name: 'Parametros', access: true, write: true },
    { name: 'Replicar PP', access: false, write: false },
  ];

  get filteredScreens() {
    if (this.selectedRole === 'Sin Acceso') return [];
    return this.screenPermissions;
  }
}

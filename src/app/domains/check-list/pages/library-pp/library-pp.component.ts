import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-library-pp',
  standalone: true,
  templateUrl: './library-pp.component.html',
  styleUrls: ['./library-pp.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule
  ]
})
export class LibraryPpComponent {
  title = '';
  year: number | null = null;
  documentType = '';
  types = ['ESTANDAR', 'PROCEDIMIENTOS', 'INSTRUCTIVOS'];

  documents = [
    { title: 'EPDR 002 INDUCCION HOMBRE NUEVO', year: 2022, name: 'E-PDR-002 Induccion hombre nuevo (REV 1).pdf', type: 'ESTANDAR' },
    { title: 'EPDR 003 SALUD OCUPACIONAL', year: 2022, name: 'E-PDR-003 Salud Ocupacional (REV1).pdf', type: 'ESTANDAR' },
    { title: 'EPDR 004 CHARLA DIARIA', year: 2022, name: 'E-PDR-004 Charla Diaria (REV1).pdf', type: 'ESTANDAR' },
    { title: 'EPDR 005 CHARLA INTEGRAL', year: 2022, name: 'E-PDR-005 Charla Integral (REV1).pdf', type: 'ESTANDAR' },
    { title: 'EPDR 006 CAPACITACIÓN', year: 2022, name: 'E-PDR-006 Capacitación (REV1).pdf', type: 'ESTANDAR' },
    { title: 'EPDR 007 ELEMENTOS DE PROTECCIÓN PERSONAL', year: 2022, name: 'E-PDR-007 Elementos de Protcción Personal (REV1).pdf', type: 'ESTANDAR' },
    { title: 'EPDR 008 INSTALACIÓN DE FAENA', year: 2022, name: 'E-PDR-008 Instalación de Faenas (REV1).pdf', type: 'ESTANDAR' },
    { title: 'EPDR 009 CIERRE DE FAENA', year: 2022, name: 'E-PDR-009 Cierre de Faenas (REV1).pdf', type: 'ESTANDAR' },

  ];

  displayedColumns = ['title', 'year', 'name', 'type', 'actions'];
}


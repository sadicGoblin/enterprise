import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-general-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
  ],
  templateUrl: './general-table.component.html',
  styleUrl: './general-table.component.scss',
})
export class GeneralTableComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  editForm: FormGroup;
  selectedIndex: number | null = null;

  cargos = [
    'Jefe de Obras',
    'Supervisora',
    'Encargado de Seguridad',
    'Coordinadora',
    'Maestro',
    'Analista',
    'Ingeniero Civil',
    'Arquitecta',
    'Prevencionista',
    'Analista de Proyectos',
    'Obrero',
    'Jefa de Proyectos',
    'Supervisor de Campo',
    'Especialista Técnica',
    'Ingeniero de Terreno',
  ];
  accesos = ['Administrador', 'Limitado', 'Solo lectura'];
  empresas = [
    'Vinarco',
    'Constructora Sur',
    'SegurObras',
    'Grupo Norte',
    'Edifica Chile',
    'Diseña SpA',
    'Prevencionar',
    'Planifica Ltda.',
    'Infraestructura Ltda.',
    'Consulting Pro',
    'Terreno S.A.',
  ];
  displayedColumns = [
    'usuario',
    'nombre',
    'cargo',
    'tipoAcceso',
    'empresa',
    'email',
    'celular',
    'obras',
    'areas',
    'acciones',
  ];

  data = [
    {
      usuario: 'jvalenzuela',
      nombre: 'Joaquín Valenzuela',
      cargo: 'Jefe de Obras',
      tipoAcceso: 'Administrador',
      empresa: 'Vinarco',
      email: 'jvalenzuela@vinarco.cl',
      celular: '+56911112222',
    },
    {
      usuario: 'mmorales',
      nombre: 'María Morales',
      cargo: 'Supervisora',
      tipoAcceso: 'Limitado',
      empresa: 'Constructora Sur',
      email: 'mmorales@sur.cl',
      celular: '+56933334444',
    },
    {
      usuario: 'pperez',
      nombre: 'Pedro Pérez',
      cargo: 'Encargado de Seguridad',
      tipoAcceso: 'Solo lectura',
      empresa: 'SegurObras',
      email: 'pperez@segurobras.cl',
      celular: '+56955556666',
    },
    {
      usuario: 'aespinoza',
      nombre: 'Andrea Espinoza',
      cargo: 'Coordinadora',
      tipoAcceso: 'Administrador',
      empresa: 'Grupo Norte',
      email: 'aespinoza@gruponorte.cl',
      celular: '+56977778888',
    },
    {
      usuario: 'ljimenez',
      nombre: 'Luis Jiménez',
      cargo: 'Maestro',
      tipoAcceso: 'Limitado',
      empresa: 'Vinarco',
      email: 'ljimenez@vinarco.cl',
      celular: '+56999990000',
    },
    {
      usuario: 'nrojas',
      nombre: 'Natalia Rojas',
      cargo: 'Analista',
      tipoAcceso: 'Solo lectura',
      empresa: 'Vinarco',
      email: 'nrojas@vinarco.cl',
      celular: '+56912121212',
    },
    {
      usuario: 'cfuentes',
      nombre: 'Carlos Fuentes',
      cargo: 'Ingeniero Civil',
      tipoAcceso: 'Administrador',
      empresa: 'Edifica Chile',
      email: 'cfuentes@edifica.cl',
      celular: '+56923232323',
    },
    {
      usuario: 'smunoz',
      nombre: 'Sandra Muñoz',
      cargo: 'Arquitecta',
      tipoAcceso: 'Limitado',
      empresa: 'Diseña SpA',
      email: 'smunoz@disena.cl',
      celular: '+56934343434',
    },
    {
      usuario: 'rbustamante',
      nombre: 'Ricardo Bustamante',
      cargo: 'Prevencionista',
      tipoAcceso: 'Solo lectura',
      empresa: 'Prevencionar',
      email: 'rbustamante@prev.cl',
      celular: '+56945454545',
    },
    {
      usuario: 'jpardo',
      nombre: 'Javiera Pardo',
      cargo: 'Analista de Proyectos',
      tipoAcceso: 'Administrador',
      empresa: 'Planifica Ltda.',
      email: 'jpardo@planifica.cl',
      celular: '+56956565656',
    },
    {
      usuario: 'gacosta',
      nombre: 'Gonzalo Acosta',
      cargo: 'Obrero',
      tipoAcceso: 'Limitado',
      empresa: 'Constructora Sur',
      email: 'gacosta@sur.cl',
      celular: '+56967676767',
    },
    {
      usuario: 'lhernandez',
      nombre: 'Laura Hernández',
      cargo: 'Jefa de Proyectos',
      tipoAcceso: 'Administrador',
      empresa: 'Vinarco',
      email: 'lhernandez@vinarco.cl',
      celular: '+56978787878',
    },
    {
      usuario: 'tcastillo',
      nombre: 'Tomás Castillo',
      cargo: 'Supervisor de Campo',
      tipoAcceso: 'Limitado',
      empresa: 'Infraestructura Ltda.',
      email: 'tcastillo@infra.cl',
      celular: '+56989898989',
    },
    {
      usuario: 'mcastro',
      nombre: 'Marcela Castro',
      cargo: 'Especialista Técnica',
      tipoAcceso: 'Solo lectura',
      empresa: 'Consulting Pro',
      email: 'mcastro@consulting.cl',
      celular: '+56990909090',
    },
    {
      usuario: 'fvera',
      nombre: 'Felipe Vera',
      cargo: 'Ingeniero de Terreno',
      tipoAcceso: 'Administrador',
      empresa: 'Terreno S.A.',
      email: 'fvera@terreno.cl',
      celular: '+56911221122',
    },
  ];

  dataSource = new MatTableDataSource<any>(this.data);

  constructor(private fb: FormBuilder, private dialog: MatDialog) {
    this.editForm = this.fb.group({
      usuario: [''],
      nombre: [''],
      cargo: [''],
      tipoAcceso: [''],
      empresa: [''],
      email: [''],
      celular: [''],
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  editar(element: any, index: number) {
    this.editForm.patchValue(element);
    this.selectedIndex = index;
  }

  onSubmit() {
    if (this.selectedIndex !== null) {
      this.data[this.selectedIndex] = this.editForm.value;
      this.dataSource.data = [...this.data];
      this.editForm.reset();
      this.selectedIndex = null;
    }
  }
}

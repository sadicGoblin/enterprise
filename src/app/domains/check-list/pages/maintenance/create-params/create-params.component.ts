import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

interface SubParam {
  name: string;
}

interface Param {
  name: string;
  subParams: SubParam[];
}

@Component({
  selector: 'app-create-params',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
  ],
  templateUrl: './create-params.component.html',
  styleUrl: './create-params.component.scss',
})
export class CreateParamsComponent {
  paramName = '';
  subParamName = '';
  selectedParam?: Param;

  params: Param[] = [
    {
      name: 'PERIODICIDAD',
      subParams: [
        { name: 'Diaria' },
        { name: 'Semanal' },
        { name: 'Mensual' },
      ],
    },
    {
      name: 'PERFIL',
      subParams: [
        { name: 'Administrador' },
        { name: 'Supervisor' },
        { name: 'Operador' },
      ],
    },
    {
      name: 'CARGO',
      subParams: [
        { name: 'Jefe de Obra' },
        { name: 'Capataz' },
        { name: 'Ingeniero Residente' },
      ],
    },
    {
      name: 'TIPO ACCESO',
      subParams: [
        { name: 'Sin Acceso' },
        { name: 'Usuario General' },
        { name: 'Super Usuario' },
      ],
    },
    {
      name: 'EMPRESA CONTRATISTA',
      subParams: [
        { name: 'Constructora Los Andes' },
        { name: 'Edifica S.A.' },
        { name: 'Obras del Sur' },
      ],
    },
    {
      name: 'TIPO DOCUMENTOS',
      subParams: [
        { name: 'Manual' },
        { name: 'Procedimiento' },
        { name: 'Plan de Trabajo' },
      ],
    },
    {
      name: 'INCIDENCIA',
      subParams: [
        { name: 'Retraso' },
        { name: 'Falla Técnica' },
        { name: 'Condición Insegura' },
      ],
    },
    {
      name: 'POTENCIAL DE RIESGO',
      subParams: [
        { name: 'Bajo' },
        { name: 'Medio' },
        { name: 'Alto' },
      ],
    },
    {
      name: 'HALLAZGO',
      subParams: [
        { name: 'Observación' },
        { name: 'No Conformidad' },
        { name: 'Mejora' },
      ],
    },
  ];
  
  
  subParams: SubParam[] = [];

  paramColumns = ['name', 'actions'];
  subParamColumns = ['name'];

  saveParam() {
    if (this.paramName) {
      this.params.push({ name: this.paramName, subParams: [] });
      this.paramName = '';
    }
  }
  

  editParam(index: number) {
    this.paramName = this.params[index].name;
    this.params.splice(index, 1);
  }

  deleteParam(index: number) {
    this.params.splice(index, 1);
  }

  saveSubParam() {
    if (this.subParamName && this.selectedParam) {
      this.selectedParam.subParams.push({ name: this.subParamName });
      this.subParamName = '';
    }
  }
  
}

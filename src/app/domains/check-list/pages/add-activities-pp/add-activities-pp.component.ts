import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-add-activities-pp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './add-activities-pp.component.html',
  styleUrl: './add-activities-pp.component.scss',
})
export class AddActivitiesPpComponent {
  projects = [
    { id: 1, name: 'EDIFICIO HABITACIONAL CAPITAN ORELLA' },
    { id: 2, name: 'CENTRO MÉDICO ANTOFAGASTA' },
  ];

  periods = ['may.-2025', 'jun.-2025'];

  users = ['FELIPE GALLARDO', 'CARLA MUÑOZ'];

  stages = ['AGUAS LLUVIAS PISO -1 OBRA GRUESA'];
  subprocesses = ['DISTRIBUCIONES'];

  scopes = ['Seguridad', 'Calidad', 'Ambiental'];
  activities = ['Revisión de planos', 'Control de acceso'];

  periodicities = ['Quincenal', 'Mensual'];
  categories = ['Evidencia fotográfica', 'Checklist'];
  parameters = ['Parámetro 1', 'Parámetro 2'];
  documents = ['Doc 1', 'Doc 2'];

  selectedProject = '';
  selectedPeriod = '';
  selectedUser = '';
  selectedStage = '';
  selectedSubprocess = '';
  selectedScope = '';
  selectedActivity = '';
  selectedPeriodicity = '';
  selectedCategory = '';
  selectedParameter = '';
  selectedDocument = '';

  tableData: any[] = [];

  addActivity() {
    if (
      this.selectedProject &&
      this.selectedUser &&
      this.selectedPeriod &&
      this.selectedStage &&
      this.selectedSubprocess &&
      this.selectedScope &&
      this.selectedActivity &&
      this.selectedPeriodicity &&
      this.selectedCategory &&
      this.selectedParameter &&
      this.selectedDocument
    ) {
      this.tableData.push({
        project: this.selectedProject,
        user: this.selectedUser,
        period: this.selectedPeriod,
        stage: this.selectedStage,
        subprocess: this.selectedSubprocess,
        scope: this.selectedScope,
        activity: this.selectedActivity,
        periodicity: this.selectedPeriodicity,
        category: this.selectedCategory,
        parameter: this.selectedParameter,
        document: this.selectedDocument,
      });

      this.resetFields();
    }
  }

  resetFields() {
    this.selectedScope = '';
    this.selectedActivity = '';
    this.selectedPeriodicity = '';
    this.selectedCategory = '';
    this.selectedParameter = '';
    this.selectedDocument = '';
    this.selectedProject = '';
    this.selectedPeriod = '';
    this.selectedUser = '';
    this.selectedStage = '';
    this.selectedSubprocess = '';
  }

  editActivity(index: number) {
    const item = this.tableData[index];
    this.selectedScope = item.scope;
    this.selectedActivity = item.activity;
    this.selectedPeriodicity = item.periodicity;
    this.selectedCategory = item.category;
    this.selectedParameter = item.parameter;
    this.selectedDocument = item.document;
    this.tableData.splice(index, 1);
  }

  deleteActivity(index: number) {
    this.tableData.splice(index, 1);
  }

  save() {
    console.log('Saved:', this.tableData);
  }

  displayedColumns = [
    'project',
    'user',
    'period',
    'stage',
    'subprocess',
    'scope',
    'activity',
    'periodicity',
    'actions',
  ];
}

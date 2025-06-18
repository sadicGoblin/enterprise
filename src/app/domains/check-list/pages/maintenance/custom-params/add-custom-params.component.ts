import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-add-custom-params',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './add-custom-params.component.html',
  styleUrl: './add-custom-params.component.scss',
})
export class AddCustomParamsComponent {
  projects = [
    { id: 1, name: 'Edificio habitacional Capitan Orella' },
    { id: 2, name: 'Proyecto Centro Médico Antofagasta' },
  ];

  selectedProjectId: number | null = null;
  newStageName = '';
  newStageCode = '';

  newSubprocessName = '';
  newSubprocessCode = '';
  selectedProjectIdSubprocess: number | null = null;

  stagesByProject: Record<number, { code: string; name: string }[]> = {
    1: [
      { code: '2900', name: 'Aguas lluvias piso -1 obra gruesa' },
      { code: '14400', name: 'Aguas lluvias (piso 11 azotea - obra gruesa)' },
      { code: '1700', name: 'Aguas lluvias piso -2 (instalaciones)' },
      {
        code: '17000',
        name: 'Artefactos y accesorios sanitarios (piso 1 terminacion)',
      },
      {
        code: '15900',
        name: 'Artefactos y accesorios sanitarios (piso -1 terminacion)',
      },
      {
        code: '26900',
        name: 'Artefactos y accesorios sanitarios (piso 10 terminacion)',
      },
      {
        code: '18100',
        name: 'Artefactos y accesorios sanitarios (piso 2 terminacion)',
      },
    ],
    2: [{ code: '3100', name: 'Instalación eléctrica primer piso' }],
  };

  subprocessesByProject: Record<number, { code: string; name: string }[]> = {
    1: [{ code: 'SP01', name: 'Hormigón losa piso 1' }],
    2: [{ code: 'SP02', name: 'Tabiquería estructural' }],
  };

  activityScopes = ['Safety', 'Quality', 'Environment'];
  frequencies = ['Daily', 'Weekly', 'Biweekly', 'Monthly'];
  activityCategories = ['Photo Evidence', 'Technical Report', 'Checklist'];
  associatedParameters = ['Parameter A', 'Parameter B', 'Parameter C'];
  associatedDocuments = ['Document X', 'Document Y', 'Document Z'];

  selectedScope: string = '';
  activityName = '';
  activityCode = '';
  activityFrequency = '';
  activityCategory = '';
  activityParameter = '';
  activityDocument = '';

  activities: {
    code: string;
    name: string;
    scope: string;
    frequency: string;
    category: string;
    parameter: string;
    document: string;
  }[] = [];

  displayedColumnsActivities = [
    'code',
    'name',
    'frequency',
    'category',
    'parameter',
    'document',
    'actions',
  ];

  addActivity() {
    if (
      !this.activityCode ||
      !this.activityName ||
      !this.selectedScope ||
      !this.activityFrequency ||
      !this.activityCategory ||
      !this.activityParameter ||
      !this.activityDocument
    )
      return;

    this.activities.push({
      code: this.activityCode,
      name: this.activityName,
      scope: this.selectedScope,
      frequency: this.activityFrequency,
      category: this.activityCategory,
      parameter: this.activityParameter,
      document: this.activityDocument,
    });

    this.activityCode = '';
    this.activityName = '';
    this.selectedScope = '';
    this.activityFrequency = '';
    this.activityCategory = '';
    this.activityParameter = '';
    this.activityDocument = '';
  }

  editActivity(index: number) {
    const a = this.activities[index];
    this.activityCode = a.code;
    this.activityName = a.name;
    this.selectedScope = a.scope;
    this.activityFrequency = a.frequency;
    this.activityCategory = a.category;
    this.activityParameter = a.parameter;
    this.activityDocument = a.document;
    this.deleteActivity(index);
  }

  deleteActivity(index: number) {
    this.activities.splice(index, 1);
  }

  saveActivity(){
    
  }

  get selectedStages() {
    return this.selectedProjectId
      ? this.stagesByProject[this.selectedProjectId] || []
      : [];
  }

  get selectedSubprocesses() {
    return this.selectedProjectIdSubprocess
      ? this.subprocessesByProject[this.selectedProjectIdSubprocess] || []
      : [];
  }

  addStage() {
    if (!this.selectedProjectId || !this.newStageCode || !this.newStageName)
      return;

    const list = this.stagesByProject[this.selectedProjectId] || [];
    list.push({ code: this.newStageCode, name: this.newStageName });
    this.stagesByProject[this.selectedProjectId] = list;

    this.newStageCode = '';
    this.newStageName = '';
  }

  addSubprocess() {
    if (
      !this.selectedProjectIdSubprocess ||
      !this.newSubprocessCode ||
      !this.newSubprocessName
    )
      return;

    const list =
      this.subprocessesByProject[this.selectedProjectIdSubprocess] || [];
    list.push({ code: this.newSubprocessCode, name: this.newSubprocessName });
    this.subprocessesByProject[this.selectedProjectIdSubprocess] = list;

    this.newSubprocessCode = '';
    this.newSubprocessName = '';
  }

  deleteStage(index: number) {
    if (this.selectedProjectId) {
      this.stagesByProject[this.selectedProjectId].splice(index, 1);
    }
  }

  editStage(index: number) {
    if (this.selectedProjectId) {
      const stage = this.stagesByProject[this.selectedProjectId][index];
      this.newStageCode = stage.code;
      this.newStageName = stage.name;
      this.deleteStage(index);
    }
  }

  deleteSubprocess(index: number) {
    if (this.selectedProjectIdSubprocess) {
      this.subprocessesByProject[this.selectedProjectIdSubprocess].splice(
        index,
        1
      );
    }
  }

  editSubprocess(index: number) {
    if (this.selectedProjectIdSubprocess) {
      const subprocess =
        this.subprocessesByProject[this.selectedProjectIdSubprocess][index];
      this.newSubprocessCode = subprocess.code;
      this.newSubprocessName = subprocess.name;
      this.deleteSubprocess(index);
    }
  }

  saveStages() {
    console.log('Stages saved:', this.stagesByProject);
  }

  saveSubprocesses() {
    console.log('Subprocesses saved:', this.subprocessesByProject);
  }

  stageColumns = ['code', 'name', 'actions'];
  subprocessColumns = ['code', 'name', 'actions'];
}

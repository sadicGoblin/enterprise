import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Work {
  code: number;
  name: string;
  commune: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-work-maintenance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './work-maintenance.component.html',
  styleUrl: './work-maintenance.component.scss',
})
export class WorkMaintenanceComponent {
  workForm = {
    code: '',
    name: '',
    address: '',
    startDate: '',
    endDate: '',
    region: '',
    commune: '',
    observations: '',
  };

  regions = ['Región Metropolitana', 'Valparaíso', 'Biobío'];
  communes = ['Ñuñoa', 'Pudahuel', 'Cerrillos'];

  works: Work[] = [
    {
      code: 599,
      name: 'EDIFICIO CAPITAN ORELLA',
      commune: 'Ñuñoa',
      startDate: '2023-01-16',
      endDate: '2024-08-30',
    },
    {
      code: 601,
      name: 'PURATOS UHT',
      commune: 'Cerrillos',
      startDate: '2023-06-01',
      endDate: '2024-06-30',
    },
    {
      code: 290,
      name: 'POST-VENTA',
      commune: 'Pudahuel',
      startDate: '2012-01-02',
      endDate: '2025-08-25',
    },
  ];

  isEditing = false;
  editingIndex: number | null = null;

  save() {
    const work = { ...this.workForm };

    if (this.isEditing && this.editingIndex !== null) {
      this.works[this.editingIndex] = { ...work, code: +work.code };
    } else {
      this.works.push({ ...work, code: +work.code });
    }

    this.cancel();
  }

  edit(index: number) {
    const w = this.works[index];
    this.workForm = {
      ...w,
      code: w.code.toString(),
      address: '',
      region: '',
      observations: '',
    };
    this.isEditing = true;
    this.editingIndex = index;
  }

  delete(index: number) {
    this.works.splice(index, 1);
    this.cancel();
  }

  cancel() {
    this.workForm = {
      code: '',
      name: '',
      address: '',
      startDate: '',
      endDate: '',
      region: '',
      commune: '',
      observations: '',
    };
    this.isEditing = false;
    this.editingIndex = null;
  }
}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ActivityItem } from '../../models/activity.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-activities-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './activities-table.component.html',
  styleUrls: ['./activities-table.component.scss'],
})
export class ActivitiesTableComponent implements OnInit {
  @Input() activities: ActivityItem[] = [];
  @Input() isLoading: boolean = false;

  @Output() editActivity = new EventEmitter<ActivityItem>();
  @Output() deleteActivity = new EventEmitter<number>();
  searchControl = new FormControl<string>('');

  // Columnas a mostrar en la tabla - separamos las acciones en columnas independientes
  displayedColumns: string[] = [
    'codigo',
    'nombre',
    'frecuencia',
    'categoria',
    'parametro',
    'documento',
    'edit',
    'delete',
  ];

  constructor() {}

  ngOnInit(): void {
    
  }

  /**
   * Maneja el evento de edición de una actividad
   */
  onEditActivity(activity: ActivityItem): void {
    this.editActivity.emit(activity);
  }

  /**
   * Maneja el evento de eliminación de una actividad
   */
  onDeleteActivity(activityId: number): void {
    if (confirm('¿Está seguro que desea eliminar esta actividad?')) {
      this.deleteActivity.emit(activityId);
    }
  }
}

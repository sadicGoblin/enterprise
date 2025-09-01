import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ActivityItem } from '../../models/activity.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

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
export class ActivitiesTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() activities: ActivityItem[] = [];
  @Input() isLoading: boolean = false;

  @Output() editActivity = new EventEmitter<ActivityItem>();
  @Output() deleteActivity = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();
  
  searchControl = new FormControl<string>('');
  filteredActivities: ActivityItem[] = [];
  private destroy$ = new Subject<void>();

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
    // Initialize filtered activities
    this.filteredActivities = [...this.activities];
    
    // Set up real-time search filtering
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.filterActivities(searchTerm || '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    // Update filtered activities when input activities change
    this.filteredActivities = [...this.activities];
    const currentSearch = this.searchControl.value;
    if (currentSearch) {
      this.filterActivities(currentSearch);
    }
  }

  /**
   * Filters activities based on search term
   */
  private filterActivities(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredActivities = [...this.activities];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.filteredActivities = this.activities.filter(activity => 
      activity.codigo?.toLowerCase().includes(term) ||
      activity.nombre?.toLowerCase().includes(term) ||
      activity.code?.toLowerCase().includes(term) ||
      activity.name?.toLowerCase().includes(term) ||
      activity.frequency?.toLowerCase().includes(term) ||
      activity.periocidad?.toLowerCase().includes(term) ||
      activity.category?.toLowerCase().includes(term) ||
      activity.CategoriaActividad?.toLowerCase().includes(term) ||
      activity.parameter?.toLowerCase().includes(term) ||
      activity.parametroAsociado?.toLowerCase().includes(term) ||
      activity.document?.toLowerCase().includes(term) ||
      activity.documentoAsociado?.toLowerCase().includes(term)
    );
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

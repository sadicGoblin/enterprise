import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SubParametroService } from '../../services/sub-parametro.service';
import { SubParametroItem } from '../../models/sub-parametro.model';
import { catchError, finalize } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

interface SelectOption {
  value: string;
  label: string;
}

interface TableItem {
  etapa: string;
  riesgo: string;
  medida: string;
}

@Component({
  selector: 'app-art-items-selection',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './art-items-selection.component.html',
  styleUrl: './art-items-selection.component.scss'
})
export class ArtItemsSelectionComponent implements OnInit {
  // Form controls para los selects
  protectionEquipmentControl = new FormControl<string[]>([]);
  riskControlControl = new FormControl<string[]>([]);
  toolsEquipmentControl = new FormControl<string[]>([]);
  
  // Opciones para los selects
  protectionEquipmentOptions: SelectOption[] = [];
  riskControlOptions: SelectOption[] = [];
  toolsEquipmentOptions: SelectOption[] = [];
  
  // Estado de carga
  isLoadingProtection = false;
  isLoadingRiskControl = false;
  isLoadingTools = false;
  
  // Estado de error
  hasErrorProtection = false;
  hasErrorRiskControl = false;
  hasErrorTools = false;
  
  // IDs de entidad para cada select
  private readonly PROTECTION_EQUIPMENT_ID = 196;
  private readonly RISK_CONTROL_ID = 197;
  private readonly TOOLS_EQUIPMENT_ID = 198;
  
  // Configuración de la tabla
  displayedColumns: string[] = ['etapa', 'riesgo', 'medida'];
  dataSource: TableItem[] = []; // Por ahora vacío como se solicitó
  
  constructor(private subParametroService: SubParametroService) {}
  
  ngOnInit(): void {
    // Cargar datos para los selects
    this.loadProtectionEquipment();
    this.loadRiskControl();
    this.loadToolsEquipment();
    
    // Escuchar cambios en los selects
    this.protectionEquipmentControl.valueChanges.subscribe(values => {
      console.log('Equipos de protección seleccionados:', values);
    });
    
    this.riskControlControl.valueChanges.subscribe(values => {
      console.log('Controles de riesgo seleccionados:', values);
    });
    
    this.toolsEquipmentControl.valueChanges.subscribe(values => {
      console.log('Herramientas seleccionadas:', values);
    });
  }
  
  /**
   * Carga los equipos de protección desde la API
   */
  loadProtectionEquipment(): void {
    this.isLoadingProtection = true;
    this.hasErrorProtection = false;
    
    this.subParametroService.getSubParametros(this.PROTECTION_EQUIPMENT_ID)
      .pipe(
        catchError(error => {
          console.error('Error al cargar equipos de protección:', error);
          this.hasErrorProtection = true;
          return of({ code: -1, data: [] });
        }),
        finalize(() => {
          this.isLoadingProtection = false;
        })
      )
      .subscribe(response => {
        if (response.data && response.data.length > 0) {
          this.protectionEquipmentOptions = response.data.map(item => ({
            value: item.IdSubParam,
            label: item.Nombre
          }));
        }
      });
  }
  
  /**
   * Carga los controles de riesgo desde la API
   */
  loadRiskControl(): void {
    this.isLoadingRiskControl = true;
    this.hasErrorRiskControl = false;
    
    this.subParametroService.getSubParametros(this.RISK_CONTROL_ID)
      .pipe(
        catchError(error => {
          console.error('Error al cargar controles de riesgo:', error);
          this.hasErrorRiskControl = true;
          return of({ code: -1, data: [] });
        }),
        finalize(() => {
          this.isLoadingRiskControl = false;
        })
      )
      .subscribe(response => {
        if (response.data && response.data.length > 0) {
          this.riskControlOptions = response.data.map(item => ({
            value: item.IdSubParam,
            label: item.Nombre
          }));
        }
      });
  }
  
  /**
   * Carga las herramientas y equipos desde la API
   */
  loadToolsEquipment(): void {
    this.isLoadingTools = true;
    this.hasErrorTools = false;
    
    this.subParametroService.getSubParametros(this.TOOLS_EQUIPMENT_ID)
      .pipe(
        catchError(error => {
          console.error('Error al cargar herramientas y equipos:', error);
          this.hasErrorTools = true;
          return of({ code: -1, data: [] });
        }),
        finalize(() => {
          this.isLoadingTools = false;
        })
      )
      .subscribe(response => {
        if (response.data && response.data.length > 0) {
          this.toolsEquipmentOptions = response.data.map(item => ({
            value: item.IdSubParam,
            label: item.Nombre
          }));
        }
      });
  }
  
  /**
   * Recarga todos los datos desde la API
   */
  reloadAllData(): void {
    this.loadProtectionEquipment();
    this.loadRiskControl();
    this.loadToolsEquipment();
  }
}

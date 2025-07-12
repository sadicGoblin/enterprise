import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule
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
  protectionEquipmentOptions: SelectOption[] = [
    { value: 'casco', label: 'CASCO DE SEGURIDAD' },
    { value: 'barbiquejo', label: 'BARBIQUEJO' },
    { value: 'antiparras', label: 'ANTIPARRAS' },
    { value: 'mascara_soldar', label: 'MÁSCARA DE SOLDAR' },
    { value: 'tapon_auditivo', label: 'TAPÓN AUDITIVO' },
    { value: 'protector_auditivo', label: 'PROTECTOR AUDITIVO TIPO FONO' },
    { value: 'coleto', label: 'COLETO DE CUERO' },
    { value: 'mascara_desechable', label: 'MÁSCARA DESECHABLE' },
    { value: 'buzo', label: 'BUZO DESECHABLE' }
  ];
  
  riskControlOptions: SelectOption[] = [
    { value: 'barreras', label: 'BARRERAS DURAS' },
    { value: 'malla_faenera', label: 'MALLA FAENERA' },
    { value: 'cinta_peligro', label: 'CINTA DE PELIGRO' },
    { value: 'conos', label: 'CONOS REFLECTANTES' },
    { value: 'biombos', label: 'BIOMBOS - MANTAS IGNÍFUGAS' },
    { value: 'malla_rachel', label: 'MALLA RACHEL' },
    { value: 'vanos', label: 'VANOS CUBIERTOS' },
    { value: 'excavaciones', label: 'EXCAVACIONES DELIMITADAS' },
    { value: 'instalaciones', label: 'INST. ELÉCTRICAS EN ALTURA' }
  ];
  
  toolsEquipmentOptions: SelectOption[] = [
    { value: 'pala', label: 'PALA' },
    { value: 'chuzo', label: 'CHUZO' },
    { value: 'carretilla', label: 'CARRETILLA' },
    { value: 'sierra', label: 'SIERRA CIRCULAR' },
    { value: 'taladros', label: 'TALADROS' },
    { value: 'dobladora', label: 'DOBLADORA DE FIERRO' },
    { value: 'vibrador', label: 'VIBRADOR' },
    { value: 'grifas', label: 'GRIFAS' },
    { value: 'demoledor', label: 'DEMOLEDOR' }
  ];
  
  // Configuración de la tabla
  displayedColumns: string[] = ['etapa', 'riesgo', 'medida'];
  dataSource: TableItem[] = []; // Por ahora vacío como se solicitó
  
  constructor() {}
  
  ngOnInit(): void {
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
}

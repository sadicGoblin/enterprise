import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-work-maintenance-popup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './work-maintenance-popup.component.html',
  styleUrl: './work-maintenance-popup.component.scss',
})
export class WorkMaintenancePopupComponent {
  collaborator = 'FELIPE GALLARDO';

  displayedColumns: string[] = ['work', 'enable', 'validator', 'reviewer'];
  dataSource = [
    { work: 'EDIFICIO HABITACIONAL CAPITAN ORELLA', enable: true, validator: true, reviewer: true },
    { work: 'PURATOS UHT', enable: false, validator: false, reviewer: false },
    { work: 'POST-VENTA', enable: false, validator: false, reviewer: false },
    { work: 'CD IANSA', enable: false, validator: false, reviewer: false },
    { work: 'MINI BODEGAS TARAPACA', enable: false, validator: false, reviewer: false },
    { work: 'MALL PLAZA VESPUCIO', enable: false, validator: false, reviewer: false },
    { work: 'CD CARTEL DE LA RUIZ', enable: false, validator: false, reviewer: false },
    { work: 'CD DESA REX', enable: false, validator: false, reviewer: false },
    { work: 'CD TRENDY', enable: false, validator: false, reviewer: false },
    { work: 'CD MERSAN VI Y VII', enable: false, validator: false, reviewer: false },
  ];

  constructor(private dialogRef: MatDialogRef<WorkMaintenancePopupComponent>) {}

  close(): void {
    this.dialogRef.close();
  }
}

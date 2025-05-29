import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-sstma-inspection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './sstma-inspection.component.html',
  styleUrl: './sstma-inspection.component.scss'
})
export class SstmaInspectionComponent {
  obrea: string = '';
  indicator: string = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;

  indicators = [
    'Tipo de Riesgo',
    'Usuario',
    'Potencial de Gravedad',
    'Empresa Inarco / SC'
  ];
}

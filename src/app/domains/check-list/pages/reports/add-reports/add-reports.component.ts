import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReportsTableComponent } from './components/reports-table/reports-table.component';
import { ArtModalComponent } from '../../../components/planification-table/components/art-modal/art-modal.component';
import { InspectionModalComponent } from '../../../components/inspection-modal/inspection-modal.component';
import { IncidentReportModalComponent } from '../../../components/incident-report-modal/incident-report-modal.component';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-add-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    ReportsTableComponent,
    MatMenuModule,
  ],
  templateUrl: './add-reports.component.html',
  styleUrl: './add-reports.component.scss',
})
export class AddReportsComponent implements OnInit {
  isLoading: boolean = false;
  loadingAppReports: boolean = false;
  isFormVisible: boolean = false;

  constructor(private dialog: MatDialog, private snackBar: MatSnackBar) {}

  ngOnInit(): void {}

  showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  createReport(type: string): void {
    const tipoSeleccionado = parseInt(type);

    if (tipoSeleccionado === 0) {
      // 0 = ART
      this.openArtModal();
    } else if (tipoSeleccionado === 1) {
      // 1 = INSPECCIÓN SSTMA
      this.openInspectionModal();
    } else if (tipoSeleccionado === 2) {
      // 2 = REPORTE INCIDENTES
      this.openReportModal();
    }
  }

  openArtModal(): void {
    const dialogRef = this.dialog.open(ArtModalComponent, {
      width: '90vw',
      maxWidth: '100%',
      disableClose: true,
      autoFocus: false,
      data: {
        artData: null,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('ART guardada:', result);
        this.showMessage('ART creada exitosamente');
      }
    });
  }

  openInspectionModal(): void {
    const dialogRef = this.dialog.open(InspectionModalComponent, {
      width: '90vw',
      maxWidth: '1400px',
      disableClose: true,
      autoFocus: false,
      data: {
        inspectionData: null,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Inspección guardada:', result);
        this.showMessage('Inspección SSTMA creada exitosamente');
      }
    });
  }

  openReportModal(): void {
    const dialogRef = this.dialog.open(IncidentReportModalComponent, {
      width: '90vw',
      maxWidth: '100%',
      disableClose: true,
      autoFocus: false,
      data: {
        reportData: null,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Reporte guardado:', result);
        this.showMessage('Reporte creado exitosamente');
      }
    });
  }
}

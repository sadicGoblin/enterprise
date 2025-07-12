import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ValidationErrorDialogData {
  title: string;
  errors: string[];
  confirmText: string;
}

@Component({
  selector: 'app-validation-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="error-dialog-container">
      <h2 mat-dialog-title>
        <mat-icon color="warn">warning</mat-icon>
        {{ data.title }}
      </h2>
      <mat-dialog-content>
        <ul class="error-list">
          <li *ngFor="let error of data.errors">{{ error }}</li>
        </ul>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-raised-button color="primary" [mat-dialog-close]="true">
          {{ data.confirmText }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./validation-error-dialog.component.scss']
})
export class ValidationErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ValidationErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ValidationErrorDialogData
  ) {}
}

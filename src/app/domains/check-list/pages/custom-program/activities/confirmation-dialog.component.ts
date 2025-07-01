import { Component, Inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

// Pipe to format options text
@Pipe({
  name: 'optionText',
  standalone: true
})
export class OptionTextPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/\\n/g, '<br>');
  }
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    OptionTextPipe
  ],
  template: `
    <div class="confirmation-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-divider></mat-divider>
      <div mat-dialog-content>
        <div class="options-container">
          <div class="question-icon">
            <mat-icon class="question-mark-icon">help_outline</mat-icon>
          </div>
          <div class="options-content">
            <div class="option-item" *ngFor="let option of data.options">
              <ng-container *ngIf="option.includes(':')">
                <span class="option-label">{{ option.split(':')[0] }}:</span>
                <div class="option-value" [innerHTML]="option.split(':')[1] | optionText"></div>
              </ng-container>
              <ng-container *ngIf="!option.includes(':')">
                <div [innerHTML]="option | optionText"></div>
              </ng-container>
            </div>
            <mat-divider class="question-divider"></mat-divider>
            <p class="question">{{ data.question }}</p>
          </div>
        </div>
      </div>
      <div mat-dialog-actions align="center">
        <button mat-raised-button color="primary" (click)="onConfirm()">SÍ</button>
        <button mat-stroked-button (click)="onCancel()">No</button>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      font-family: 'Roboto', Arial, sans-serif;
      min-width: 400px;
    }
    h2 {
      margin: 0;
      padding: 12px 16px;
      background-color: #f5f5f5;
      font-size: 16px;
      font-weight: 500;
      color: #333;
      letter-spacing: 0.2px;
    }
    mat-divider {
      margin-bottom: 16px;
    }
    .options-container {
      display: flex;
      padding: 0 8px;
    }
    .question-icon {
      width: 40px;
      height: 40px;
      margin-right: 16px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    .question-mark-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #1976d2;
    }
    .options-content {
      flex: 1;
      font-size: 13px;
    }
    .option-item {
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
    }
    .option-label {
      font-weight: 500;
      color: #555;
      font-size: 12px;
      margin-bottom: 3px;
    }
    .option-value {
      padding-left: 16px;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
    }
    .question-divider {
      margin: 16px 0 10px 0;
      opacity: 0.6;
    }
    .question {
      margin: 10px 0 5px 0;
      font-weight: 500;
      font-size: 13px;
      text-align: center;
    }
    mat-dialog-content {
      padding-bottom: 0;
      max-height: none;
    }
    mat-dialog-actions {
      padding: 16px;
      justify-content: center;
      margin-bottom: 0;
    }
    button {
      min-width: 90px;
      margin: 0 8px;
      font-size: 13px;
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string;
      options: string[];
      question: string;
    }
  ) {}

  onConfirm(): void {
    this.dialogRef.close('SÍ');
  }

  onCancel(): void {
    this.dialogRef.close('No');
  }
}



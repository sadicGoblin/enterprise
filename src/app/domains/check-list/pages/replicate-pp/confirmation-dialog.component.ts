import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>help_outline</mat-icon>
        {{ data.title }}
      </h2>
      
      <mat-dialog-content class="dialog-content">
        <p [innerHTML]="data.message"></p>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button 
          mat-stroked-button 
          (click)="onCancel()"
          class="cancel-btn">
          <mat-icon>close</mat-icon>
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onConfirm()"
          class="confirm-btn">
          <mat-icon>check</mat-icon>
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 0;
    }
    
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #333;
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 16px;
      padding: 15px;
      
      mat-icon {
        color: #ff9800;
        font-size: 24px;
      }
    }
    
    .dialog-content {
      margin-bottom: 24px;
      
      p {
        color: #666;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
      }
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin: 0;
      
      button {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 100px;
        
        mat-icon {
          font-size: 18px;
        }
      }
      
      .cancel-btn {
        color: #666;
        border-color: #ccc;
        
        &:hover {
          background-color: #f5f5f5;
        }
      }
      
      .confirm-btn {
        background-color: #1976d2;
        
        &:hover {
          background-color: #1565c0;
        }
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-imagen-dialog',
  template: `
    <div class="imagen-dialog-container">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon class="title-icon">photo</mat-icon>
        Imagen de Inspección
      </h2>
      
      <div mat-dialog-content class="dialog-content">
        <div class="image-container">
          <img [src]="data.imagenSrc" alt="Imagen de inspección">
        </div>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button color="primary" [mat-dialog-close] class="close-button">
          <mat-icon>delete</mat-icon>
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .imagen-dialog-container {
      display: flex;
      flex-direction: column;
      padding: 0;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    
    .dialog-title {
      display: flex;
      align-items: center;
      background-color: #1976d2;
      color: white;
      padding: 16px;
      margin: 0;
      border-radius: 8px 8px 0 0;
      font-size: 18px;
      font-weight: 500;
    }
    
    .title-icon {
      margin-right: 8px;
    }
    
    .dialog-content {
      padding: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #fff;
      max-height: 70vh;
      overflow: auto;
    }
    
    .image-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
    
    img {
      max-width: 100%;
      max-height: 65vh;
      object-fit: contain;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: center;
      padding: 16px;
      margin: 0;
    }
    
    .close-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class ImagenDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: {imagenSrc: string}) {}
}

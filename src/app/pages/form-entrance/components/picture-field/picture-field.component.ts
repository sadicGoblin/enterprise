import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormQuestion } from '../../models/form.models';

export interface PictureFile {
  file: File;
  preview: string;
  name: string;
}

@Component({
  selector: 'app-picture-field',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="picture-field-container">
      <label class="field-label">
        {{ question.name }}
        <span class="required-mark" *ngIf="question.required">*</span>
      </label>
      
      <div class="picture-info">
        <span *ngIf="question.allow_pictures">
          Mínimo: {{ question.allow_pictures.min }} | Máximo: {{ question.allow_pictures.max }} fotos
        </span>
        <span class="current-count">
          ({{ pictures.length }} seleccionada{{ pictures.length !== 1 ? 's' : '' }})
        </span>
      </div>

      <!-- Grid de fotos -->
      <div class="pictures-grid">
        <!-- Fotos existentes -->
        <div class="picture-item" *ngFor="let picture of pictures; let i = index">
          <img [src]="picture.preview" [alt]="picture.name" class="picture-preview">
          <button 
            mat-icon-button 
            class="remove-button" 
            (click)="removePicture(i)"
            [disabled]="question.read_only ?? false"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Botón para agregar foto -->
        <div 
          class="add-picture-button" 
          *ngIf="canAddMore && !question.read_only"
          (click)="triggerFileInput()"
        >
          <mat-icon>add_a_photo</mat-icon>
          <span>Agregar foto</span>
        </div>
      </div>

      <!-- Input oculto para seleccionar archivos -->
      <input
        #fileInput
        type="file"
        accept="image/*"
        (change)="onFileSelected($event)"
        style="display: none"
        [multiple]="false"
      >

      <div class="hint-text" *ngIf="question.required && pictures.length < (question.allow_pictures?.min || 1)">
        * Campo requerido - Agregue al menos {{ question.allow_pictures?.min || 1 }} foto(s)
      </div>
    </div>
  `,
  styles: [`
    .picture-field-container {
      margin-bottom: 20px;
    }
    
    .field-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }
    
    .required-mark {
      color: #f44336;
      margin-left: 4px;
    }
    
    .picture-info {
      font-size: 12px;
      color: #666;
      margin-bottom: 12px;
    }
    
    .current-count {
      margin-left: 8px;
      color: #1e2b50;
      font-weight: 500;
    }
    
    .pictures-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }
    
    .picture-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #e0e0e0;
    }
    
    .picture-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .remove-button {
      position: absolute;
      top: 4px;
      right: 4px;
      background-color: rgba(0, 0, 0, 0.6);
      color: white;
      width: 28px;
      height: 28px;
      line-height: 28px;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    
    .add-picture-button {
      aspect-ratio: 1;
      border: 2px dashed #1e2b50;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: #f5f5f5;
      min-height: 120px;
      
      &:hover {
        background-color: #e8e8e8;
        border-color: #fecd0d;
      }
      
      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #1e2b50;
        margin-bottom: 8px;
      }
      
      span {
        font-size: 12px;
        color: #666;
      }
    }
    
    .hint-text {
      font-size: 12px;
      color: #f44336;
      margin-top: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PictureFieldComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  @Input() question!: FormQuestion;
  @Output() valueChange = new EventEmitter<{ id: string; files: PictureFile[] }>();

  pictures: PictureFile[] = [];

  get canAddMore(): boolean {
    const max = this.question.allow_pictures?.max || 3;
    return this.pictures.length < max;
  }

  get isValid(): boolean {
    const min = this.question.allow_pictures?.min || 1;
    if (this.question.required) {
      return this.pictures.length >= min;
    }
    return true;
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar que es una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor seleccione un archivo de imagen válido');
        return;
      }

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        this.pictures.push({
          file: file,
          preview: preview,
          name: file.name
        });
        this.emitChange();
      };
      reader.readAsDataURL(file);

      // Limpiar input para permitir seleccionar el mismo archivo de nuevo
      input.value = '';
    }
  }

  removePicture(index: number): void {
    this.pictures.splice(index, 1);
    this.emitChange();
  }

  private emitChange(): void {
    this.valueChange.emit({
      id: this.question.id,
      files: [...this.pictures]
    });
  }
}

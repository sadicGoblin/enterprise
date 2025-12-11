import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormQuestion } from '../../models/form.models';

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ question.name }}</mat-label>
      <textarea
        matInput
        [placeholder]="question.name"
        [required]="question.required"
        [readonly]="question.read_only ?? false"
        [(ngModel)]="value"
        (ngModelChange)="onValueChange($event)"
        rows="3"
      ></textarea>
      <mat-hint *ngIf="question.required">* Campo requerido</mat-hint>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    
    :host {
      display: block;
      margin-bottom: 16px;
    }
    
    textarea {
      resize: vertical;
      min-height: 60px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextFieldComponent {
  @Input() question!: FormQuestion;
  @Output() valueChange = new EventEmitter<{ id: string; value: string }>();

  value: string = '';

  onValueChange(newValue: string): void {
    this.valueChange.emit({ id: this.question.id, value: newValue });
  }
}

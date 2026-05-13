import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BtnVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type BtnSize = 'md' | 'sm';
export type BtnType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './btn.component.html',
  styleUrls: ['./btn.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BtnComponent {
  @Input() variant: BtnVariant = 'primary';
  @Input() size: BtnSize = 'md';
  @Input() type: BtnType = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() block = false;
  @Input() icon?: string;
  @Input() iconRight = false;
  @Input() ariaLabel?: string;
  @Input() formId?: string;
}

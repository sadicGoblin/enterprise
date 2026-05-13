import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';
export type SpinnerTone = 'ink' | 'yellow' | 'inherit';

/**
 * AppSpinner · DS Inarco SSTMA
 * Spinner SVG inline con animación CSS — sin dependencia de Material.
 * Tamaños: xs(16), sm(24), md(40), lg(56). Tonos: ink (navy), yellow, inherit.
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() tone: SpinnerTone = 'ink';
  /** Etiqueta opcional debajo del spinner. */
  @Input() label?: string;
  /** Cuando true, ocupa todo el contenedor y centra. */
  @Input() block = false;

  get pxSize(): number {
    switch (this.size) {
      case 'xs': return 16;
      case 'sm': return 24;
      case 'md': return 40;
      case 'lg': return 56;
    }
  }
}

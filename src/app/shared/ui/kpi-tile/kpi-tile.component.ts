import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type KpiDeltaTone = 'positive' | 'negative' | 'neutral';

@Component({
  selector: 'app-kpi-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-tile.component.html',
  styleUrls: ['./kpi-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiTileComponent {
  @Input() eyebrow?: string;
  @Input() label!: string;
  @Input() value!: string | number;
  @Input() delta?: string;
  @Input() deltaTone: KpiDeltaTone = 'neutral';
  @Input() icon?: string;
  @Input() highlight = false;
}

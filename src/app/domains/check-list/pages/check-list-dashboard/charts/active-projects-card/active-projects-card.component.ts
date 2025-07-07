import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-active-projects-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './active-projects-card.component.html',
  styleUrls: ['./active-projects-card.component.scss']
})
export class ActiveProjectsCardComponent {
  @Input() totalProjects: number = 0;
  @Input() showTrend: boolean = false;
  @Input() trendPercentage: number = 0;
}

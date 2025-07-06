import { Component, OnInit } from '@angular/core'; // Import OnInit
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConstructiveStagesComponent } from './components/constructive-stages/constructive-stages.component';
import { SubprocessesComponent } from './components/subprocesses/subprocesses.component';
import { ActivitiesComponent } from './components/activities/activities.component';
import { AmbitsComponent } from './components/ambits/ambits.component';

@Component({
  selector: 'app-add-custom-params',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    ConstructiveStagesComponent,
    SubprocessesComponent,
    ActivitiesComponent,
    AmbitsComponent,
  ],
  templateUrl: './add-custom-params.component.html',
  styleUrls: ['./add-custom-params.component.scss'],
})
export class AddCustomParamsComponent implements OnInit {
  ngOnInit(): void {}
}

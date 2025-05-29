import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityPlanningComponent } from './activity-planning.component';

describe('ActivityPlanningComponent', () => {
  let component: ActivityPlanningComponent;
  let fixture: ComponentFixture<ActivityPlanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityPlanningComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActivityPlanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

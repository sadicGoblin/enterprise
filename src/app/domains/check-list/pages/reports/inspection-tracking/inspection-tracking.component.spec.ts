import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionTrackingComponent } from './inspection-tracking.component';

describe('InspectionTrackingComponent', () => {
  let component: InspectionTrackingComponent;
  let fixture: ComponentFixture<InspectionTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectionTrackingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InspectionTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

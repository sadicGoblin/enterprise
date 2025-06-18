import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkMaintenancePopupComponent } from './work-maintenance-popup.component';

describe('WorkMaintenancePopupComponent', () => {
  let component: WorkMaintenancePopupComponent;
  let fixture: ComponentFixture<WorkMaintenancePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkMaintenancePopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WorkMaintenancePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

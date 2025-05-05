import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkMaintenanceComponent } from './work-maintenance.component';

describe('WorkMaintenanceComponent', () => {
  let component: WorkMaintenanceComponent;
  let fixture: ComponentFixture<WorkMaintenanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkMaintenanceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WorkMaintenanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

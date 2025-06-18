import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreaMaintenancePopupComponent } from './area-maintenance-popup.component';

describe('AreaMaintenancePopupComponent', () => {
  let component: AreaMaintenancePopupComponent;
  let fixture: ComponentFixture<AreaMaintenancePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AreaMaintenancePopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AreaMaintenancePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanificationPopupComponent } from './planification-popup.component';

describe('PlanificationPopupComponent', () => {
  let component: PlanificationPopupComponent;
  let fixture: ComponentFixture<PlanificationPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanificationPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanificationPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

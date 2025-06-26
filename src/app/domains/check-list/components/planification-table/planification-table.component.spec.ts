import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanificationTableComponent } from './planification-table.component';

describe('PlanificationTableComponent', () => {
  let component: PlanificationTableComponent;
  let fixture: ComponentFixture<PlanificationTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanificationTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanificationTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

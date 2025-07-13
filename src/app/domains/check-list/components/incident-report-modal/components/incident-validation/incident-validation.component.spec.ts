import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentValidationComponent } from './incident-validation.component';

describe('IncidentValidationComponent', () => {
  let component: IncidentValidationComponent;
  let fixture: ComponentFixture<IncidentValidationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentValidationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IncidentValidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

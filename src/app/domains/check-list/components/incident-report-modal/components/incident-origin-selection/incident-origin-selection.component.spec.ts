import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentOriginSelectionComponent } from './incident-origin-selection.component';

describe('IncidentOriginSelectionComponent', () => {
  let component: IncidentOriginSelectionComponent;
  let fixture: ComponentFixture<IncidentOriginSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentOriginSelectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IncidentOriginSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

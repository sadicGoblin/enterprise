import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionModalComponent } from './inspection-modal.component';

describe('InspectionModalComponent', () => {
  let component: InspectionModalComponent;
  let fixture: ComponentFixture<InspectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectionModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InspectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

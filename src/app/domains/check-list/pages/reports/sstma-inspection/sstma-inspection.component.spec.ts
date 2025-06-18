import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SstmaInspectionComponent } from './sstma-inspection.component';

describe('SstmaInspectionComponent', () => {
  let component: SstmaInspectionComponent;
  let fixture: ComponentFixture<SstmaInspectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SstmaInspectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SstmaInspectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ARTReportModalComponent } from './art-report-modal.component';

describe('ARTReportModalComponent', () => {
  let component: ARTReportModalComponent;
  let fixture: ComponentFixture<ARTReportModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ARTReportModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ARTReportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChecklistReportModalComponent } from './checklist-report-modal.component';

describe('ChecklistReportModalComponent', () => {
  let component: ChecklistReportModalComponent;
  let fixture: ComponentFixture<ChecklistReportModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChecklistReportModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChecklistReportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

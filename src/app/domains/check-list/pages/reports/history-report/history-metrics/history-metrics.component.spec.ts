import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryMetricsComponent } from './history-metrics.component';

describe('HistoryMetricsComponent', () => {
  let component: HistoryMetricsComponent;
  let fixture: ComponentFixture<HistoryMetricsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryMetricsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoryMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

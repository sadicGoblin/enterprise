import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsFilterComponent } from './metrics-filter.component';

describe('MetricsFilterComponent', () => {
  let component: MetricsFilterComponent;
  let fixture: ComponentFixture<MetricsFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricsFilterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MetricsFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsDataComponent } from './metrics-data.component';

describe('MetricsDataComponent', () => {
  let component: MetricsDataComponent;
  let fixture: ComponentFixture<MetricsDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricsDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MetricsDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

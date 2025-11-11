import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccidentsStatisticsComponent } from './accidents-statistics.component';

describe('AccidentsStatisticsComponent', () => {
  let component: AccidentsStatisticsComponent;
  let fixture: ComponentFixture<AccidentsStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccidentsStatisticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccidentsStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

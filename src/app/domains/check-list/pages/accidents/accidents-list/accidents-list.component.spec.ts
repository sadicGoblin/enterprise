import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccidentsListComponent } from './accidents-list.component';

describe('AccidentsListComponent', () => {
  let component: AccidentsListComponent;
  let fixture: ComponentFixture<AccidentsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccidentsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccidentsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

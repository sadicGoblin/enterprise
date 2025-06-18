import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDashboardPpComponent } from './create-dashboard-pp.component';

describe('CreateDashboardPpComponent', () => {
  let component: CreateDashboardPpComponent;
  let fixture: ComponentFixture<CreateDashboardPpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDashboardPpComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateDashboardPpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

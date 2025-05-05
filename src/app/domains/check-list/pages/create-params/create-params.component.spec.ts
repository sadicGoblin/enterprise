import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateParamsComponent } from './create-params.component';

describe('CreateParamsComponent', () => {
  let component: CreateParamsComponent;
  let fixture: ComponentFixture<CreateParamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateParamsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateParamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

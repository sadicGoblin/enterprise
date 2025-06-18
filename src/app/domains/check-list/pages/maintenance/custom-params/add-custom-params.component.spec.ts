import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCustomParamsComponent } from './add-custom-params.component';

describe('AddCustomParamsComponent', () => {
  let component: AddCustomParamsComponent;
  let fixture: ComponentFixture<AddCustomParamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCustomParamsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCustomParamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

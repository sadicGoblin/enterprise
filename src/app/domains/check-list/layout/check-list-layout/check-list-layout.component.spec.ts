import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckListLayoutComponent } from './check-list-layout.component';

describe('CheckListLayoutComponent', () => {
  let component: CheckListLayoutComponent;
  let fixture: ComponentFixture<CheckListLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckListLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CheckListLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

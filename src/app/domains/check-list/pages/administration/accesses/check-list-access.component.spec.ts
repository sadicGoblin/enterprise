import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckListAccessComponent } from './check-list-access.component';

describe('CheckListAccessComponent', () => {
  let component: CheckListAccessComponent;
  let fixture: ComponentFixture<CheckListAccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckListAccessComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CheckListAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

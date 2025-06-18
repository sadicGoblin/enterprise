import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangePasswordsComponent } from './change-passwords.component';

describe('ChangePasswordsComponent', () => {
  let component: ChangePasswordsComponent;
  let fixture: ComponentFixture<ChangePasswordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangePasswordsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChangePasswordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

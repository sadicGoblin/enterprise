import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalFileComponent } from './modal-file.component';

describe('ModalFileComponent', () => {
  let component: ModalFileComponent;
  let fixture: ComponentFixture<ModalFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalFileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

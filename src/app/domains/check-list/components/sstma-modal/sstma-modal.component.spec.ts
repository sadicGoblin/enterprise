import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SstmaModalComponent } from './sstma-modal.component';

describe('SstmaModalComponent', () => {
  let component: SstmaModalComponent;
  let fixture: ComponentFixture<SstmaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SstmaModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SstmaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

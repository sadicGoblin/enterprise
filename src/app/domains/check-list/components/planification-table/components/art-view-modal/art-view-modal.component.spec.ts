import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ARTViewModalComponent } from './art-view-modal.component';

describe('ARTViewModalComponent', () => {
  let component: ARTViewModalComponent;
  let fixture: ComponentFixture<ARTViewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ARTViewModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ARTViewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

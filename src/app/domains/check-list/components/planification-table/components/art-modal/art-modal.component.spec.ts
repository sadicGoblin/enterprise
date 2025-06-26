import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtModalComponent } from './art-modal.component';

describe('ArtModalComponent', () => {
  let component: ArtModalComponent;
  let fixture: ComponentFixture<ArtModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArtModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

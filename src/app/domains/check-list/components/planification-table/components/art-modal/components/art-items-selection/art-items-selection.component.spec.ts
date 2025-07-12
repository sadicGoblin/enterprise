import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtItemsSelectionComponent } from './art-items-selection.component';

describe('ArtItemsSelectionComponent', () => {
  let component: ArtItemsSelectionComponent;
  let fixture: ComponentFixture<ArtItemsSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtItemsSelectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArtItemsSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

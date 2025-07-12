import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtInspectionElementsComponent } from './art-inspection-elements.component';

describe('ArtInspectionElementsComponent', () => {
  let component: ArtInspectionElementsComponent;
  let fixture: ComponentFixture<ArtInspectionElementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtInspectionElementsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArtInspectionElementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

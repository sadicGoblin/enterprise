import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtValidationSectionComponent } from './art-validation-section.component';

describe('ArtValidationSectionComponent', () => {
  let component: ArtValidationSectionComponent;
  let fixture: ComponentFixture<ArtValidationSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtValidationSectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArtValidationSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

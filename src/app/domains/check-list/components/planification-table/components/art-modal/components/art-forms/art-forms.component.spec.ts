import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtFormsComponent } from './art-forms.component';

describe('ArtFormsComponent', () => {
  let component: ArtFormsComponent;
  let fixture: ComponentFixture<ArtFormsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtFormsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArtFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

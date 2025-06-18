import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryPpComponent } from './library-pp.component';

describe('LibraryPpComponent', () => {
  let component: LibraryPpComponent;
  let fixture: ComponentFixture<LibraryPpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryPpComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LibraryPpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsDataComponent } from './details-data.component';

describe('DetailsDataComponent', () => {
  let component: DetailsDataComponent;
  let fixture: ComponentFixture<DetailsDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailsDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

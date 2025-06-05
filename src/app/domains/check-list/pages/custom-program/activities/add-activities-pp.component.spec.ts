import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddActivitiesPpComponent } from './add-activities-pp.component';

describe('AddActivitiesPpComponent', () => {
  let component: AddActivitiesPpComponent;
  let fixture: ComponentFixture<AddActivitiesPpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddActivitiesPpComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddActivitiesPpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

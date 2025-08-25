import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicatePpComponent } from './replicate-pp.component';

describe('ReplicatePpComponent', () => {
  let component: ReplicatePpComponent;
  let fixture: ComponentFixture<ReplicatePpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReplicatePpComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReplicatePpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

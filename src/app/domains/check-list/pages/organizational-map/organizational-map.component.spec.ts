import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationalMapComponent } from './organizational-map.component';

describe('OrganizationalMapComponent', () => {
  let component: OrganizationalMapComponent;
  let fixture: ComponentFixture<OrganizationalMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationalMapComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrganizationalMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

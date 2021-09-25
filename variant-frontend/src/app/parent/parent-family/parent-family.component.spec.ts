import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentFamilyComponent } from './parent-family.component';

describe('ParentFamilyComponent', () => {
  let component: ParentFamilyComponent;
  let fixture: ComponentFixture<ParentFamilyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParentFamilyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentFamilyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

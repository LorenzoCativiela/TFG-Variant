import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentNavigationComponent } from './parent-navigation.component';

describe('ParentNavigationComponent', () => {
  let component: ParentNavigationComponent;
  let fixture: ComponentFixture<ParentNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParentNavigationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

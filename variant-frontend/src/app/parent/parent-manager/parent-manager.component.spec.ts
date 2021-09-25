import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentManagerComponent } from './parent-manager.component';

describe('ParentManagerComponent', () => {
  let component: ParentManagerComponent;
  let fixture: ComponentFixture<ParentManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParentManagerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

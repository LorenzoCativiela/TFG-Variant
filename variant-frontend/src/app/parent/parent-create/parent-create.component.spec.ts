import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentCreateComponent } from './parent-create.component';

describe('ParentCreateComponent', () => {
  let component: ParentCreateComponent;
  let fixture: ComponentFixture<ParentCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParentCreateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

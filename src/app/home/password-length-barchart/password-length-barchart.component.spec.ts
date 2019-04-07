import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordLengthBarchartComponent } from './password-length-barchart.component';

describe('PasswordLengthBarchartComponent', () => {
  let component: PasswordLengthBarchartComponent;
  let fixture: ComponentFixture<PasswordLengthBarchartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PasswordLengthBarchartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordLengthBarchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShieldIconComponent } from './shield-icon.component';

describe('ShieldIconComponent', () => {
  let component: ShieldIconComponent;
  let fixture: ComponentFixture<ShieldIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShieldIconComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShieldIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordTreemapComponent } from './password-treemap.component';

describe('PasswordTreemapComponent', () => {
  let component: PasswordTreemapComponent;
  let fixture: ComponentFixture<PasswordTreemapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PasswordTreemapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordTreemapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

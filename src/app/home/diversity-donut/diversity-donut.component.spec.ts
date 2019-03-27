import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiversityDonutComponent } from './diversity-donut.component';

describe('DiversityDonutComponent', () => {
  let component: DiversityDonutComponent;
  let fixture: ComponentFixture<DiversityDonutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiversityDonutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiversityDonutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

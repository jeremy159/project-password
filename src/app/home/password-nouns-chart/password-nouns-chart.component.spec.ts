import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordNounsChartComponent } from './password-nouns-chart.component';

describe('PasswordNounsChartComponent', () => {
  let component: PasswordNounsChartComponent;
  let fixture: ComponentFixture<PasswordNounsChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PasswordNounsChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordNounsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

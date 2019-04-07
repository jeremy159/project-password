import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OneYearHeatmapComponent } from './one-year-heatmap.component';

describe('OneYearHeatmapComponent', () => {
  let component: OneYearHeatmapComponent;
  let fixture: ComponentFixture<OneYearHeatmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OneYearHeatmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OneYearHeatmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

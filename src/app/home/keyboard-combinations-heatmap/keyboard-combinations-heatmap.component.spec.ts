import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyboardCombinationsHeatmapComponent } from './keyboard-combinations-heatmap.component';

describe('KeyboardCombinationsHeatmapComponent', () => {
  let component: KeyboardCombinationsHeatmapComponent;
  let fixture: ComponentFixture<KeyboardCombinationsHeatmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KeyboardCombinationsHeatmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KeyboardCombinationsHeatmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyboardOccurrencesHeatmapComponent } from './keyboard-occurrences-heatmap.component';

describe('KeyboardOccurrencesHeatmapComponent', () => {
  let component: KeyboardOccurrencesHeatmapComponent;
  let fixture: ComponentFixture<KeyboardOccurrencesHeatmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KeyboardOccurrencesHeatmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KeyboardOccurrencesHeatmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

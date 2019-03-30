import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordCrackingHeatmapComponent } from './password-cracking-heatmap.component';

describe('PasswordCrackingHeatmapComponent', () => {
  let component: PasswordCrackingHeatmapComponent;
  let fixture: ComponentFixture<PasswordCrackingHeatmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PasswordCrackingHeatmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordCrackingHeatmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollToRefDirective } from './scroll-to-ref.directive';
import { ViewportDetectionDirective } from './viewport-detection.directive';

@NgModule({
  declarations: [ScrollToRefDirective, ViewportDetectionDirective],
  imports: [
    CommonModule
  ],
  exports: [
    ScrollToRefDirective,
    ViewportDetectionDirective
  ]
})
export class SharedModule { }

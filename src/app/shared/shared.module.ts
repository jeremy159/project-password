import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollToRefDirective } from './scroll-to-ref.directive';
import { DefearLoadDirective } from './defear-load.directive';

@NgModule({
  declarations: [ScrollToRefDirective, DefearLoadDirective],
  imports: [
    CommonModule
  ],
  exports: [
    ScrollToRefDirective,
    DefearLoadDirective
  ]
})
export class SharedModule { }

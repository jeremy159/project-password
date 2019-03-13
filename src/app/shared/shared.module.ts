import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollToRefDirective } from './scroll-to-ref/scroll-to-ref.directive';

@NgModule({
  declarations: [ScrollToRefDirective],
  imports: [
    CommonModule
  ],
  exports: [
    ScrollToRefDirective
  ]
})
export class SharedModule { }

import { NgModule, Optional, SkipSelf } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { throwIfAlreadyLoaded } from './module-import-guard';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule
  ],
  exports: [
    BrowserAnimationsModule
]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}

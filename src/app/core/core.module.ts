import { NgModule, Optional, SkipSelf } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { throwIfAlreadyLoaded } from './module-import-guard';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    HttpClientModule,
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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FlexLayoutModule } from '@angular/flex-layout';
import { HomeComponent } from './home/home.component';
import { TopPageComponent } from './top-page/top-page.component';

@NgModule({
  declarations: [
    HomeComponent,
    TopPageComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule
  ],
  exports: [
    HomeComponent
  ]
})
export class HomeModule { }

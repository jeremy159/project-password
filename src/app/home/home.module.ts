import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FlexLayoutModule } from '@angular/flex-layout';
import { HomeComponent } from './home/home.component';
import { TopPageComponent } from './top-page/top-page.component';
import { PasswordNounsChartComponent } from './password-nouns-chart/password-nouns-chart.component';

@NgModule({
  declarations: [
    HomeComponent,
    TopPageComponent,
    PasswordNounsChartComponent
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

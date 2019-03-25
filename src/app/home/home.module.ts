import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule } from '@angular/material';

import { HomeComponent } from './home/home.component';
import { TopPageComponent } from './top-page/top-page.component';
import { PasswordNounsChartComponent } from './password-nouns-chart/password-nouns-chart.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KeyboardCombinationsHeatmapComponent } from './keyboard-combinations-heatmap/keyboard-combinations-heatmap.component';
import { PasswordTreemapComponent } from './password-treemap/password-treemap.component';

@NgModule({
  declarations: [
    HomeComponent,
    TopPageComponent,
    PasswordNounsChartComponent,
    KeyboardCombinationsHeatmapComponent,
    PasswordTreemapComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    SharedModule
  ],
  exports: [
    HomeComponent
  ]
})
export class HomeModule { }

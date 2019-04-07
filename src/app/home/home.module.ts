import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule } from '@angular/material';

import { HomeComponent } from './home/home.component';
import { TopPageComponent } from './top-page/top-page.component';
import { PasswordNounsChartComponent } from './password-nouns-chart/password-nouns-chart.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KeyboardCombinationsHeatmapComponent } from './keyboard-combinations-heatmap/keyboard-combinations-heatmap.component';
import { PasswordTreemapComponent } from './password-treemap/password-treemap.component';
import { DiversityDonutComponent } from './diversity-donut/diversity-donut.component';
import { KeyboardOccurrencesHeatmapComponent } from './keyboard-occurrences-heatmap/keyboard-occurrences-heatmap.component';
import { PasswordCrackingHeatmapComponent } from './password-cracking-heatmap/password-cracking-heatmap.component';
import { CustomPasswordComponent } from './custom-password/custom-password.component';
import { ShieldIconComponent } from './custom-password/shield-icon/shield-icon.component';
import { CalendarHeatmapComponent } from './calendar-heatmap/calendar-heatmap.component';
import { OneYearHeatmapComponent } from './one-year-heatmap/one-year-heatmap.component';

@NgModule({
  declarations: [
    HomeComponent,
    TopPageComponent,
    PasswordNounsChartComponent,
    KeyboardCombinationsHeatmapComponent,
    PasswordTreemapComponent,
    DiversityDonutComponent,
    KeyboardOccurrencesHeatmapComponent,
    PasswordCrackingHeatmapComponent,
    CustomPasswordComponent,
    ShieldIconComponent,
    CalendarHeatmapComponent,
    OneYearHeatmapComponent
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
    MatTableModule,
    MatSortModule,
    SharedModule
  ],
  exports: [
    HomeComponent
  ]
})
export class HomeModule { }

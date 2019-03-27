import { Component, OnInit } from '@angular/core';
import { RestAPIService } from 'src/app/core/services/restAPI.service';
import { Observable, forkJoin } from 'rxjs';
import { NameOccurrence } from 'src/app/shared/models/name-occurrence';
import { Genders } from 'src/app/shared/models/genders';
import { KeyboardCombination } from 'src/app/shared/models/keyboard-combination';
import { PasswordTreemap } from 'src/app/shared/models/password-treemap';
import { Diversity } from 'src/app/shared/models/diversity';

@Component({
  selector: 'pp-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public passwordNounsChartData$: Observable<[NameOccurrence[], NameOccurrence[], Genders]>;
  public keyboardHeatMapData$: Observable<KeyboardCombination[]>;
  public passwordTreemapData$: Observable<PasswordTreemap>;
  public disersityDonutData$: Observable<Diversity[]>;

  constructor(private restApiService: RestAPIService) { }

  public ngOnInit(): void {
    this.initializeKeyboardCombinaisonsComponent();
    this.initializePasswordTreemapComponent();
    this.initializeBarChartComponent();
    this.initializeDiversityDonutComponent();
  }

  public initializeKeyboardCombinaisonsComponent(): void {
    this.keyboardHeatMapData$ = this.restApiService.getRequest<KeyboardCombination[]>('allCombinations.csv', true);
  }

  public initializePasswordTreemapComponent(): void {
    this.passwordTreemapData$ = this.restApiService.getRequest<PasswordTreemap>('data_100.json', true, false);
  }

  public initializeBarChartComponent(): void {
    const femaleData$ = this.restApiService.getRequest<NameOccurrence[]>('noms_propres_female_summary.csv', true);
    const maleData$ = this.restApiService.getRequest<NameOccurrence[]>('noms_propres_male_summary.csv', true);
    const genders$ = this.restApiService.getRequest<Genders>('genders.csv', true);
    this.passwordNounsChartData$ = forkJoin([femaleData$, maleData$, genders$]);
  }

  public initializeDiversityDonutComponent(): void {
    this.disersityDonutData$ = this.restApiService.getRequest<Diversity[]>('diversity.csv', true);
  }
}

import { Component, OnInit } from '@angular/core';
import { RestAPIService } from 'src/app/core/services/restAPI.service';
import { Observable, forkJoin } from 'rxjs';
import { NameOccurrence } from 'src/app/shared/models/name-occurrence';
import { Genders } from 'src/app/shared/models/genders';
import { KeyboardCombination } from 'src/app/shared/models/keyboard-combination';

@Component({
  selector: 'pp-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public passwordNounsChartData$: Observable<[NameOccurrence[], NameOccurrence[], Genders]>;
  public keyboardHeatMapData$: Observable<KeyboardCombination[]>;

  constructor(private restApiService: RestAPIService) { }

  public ngOnInit(): void {
    this.initializeKeyboardCombinaisonsComponent();
    this.initializeBarChartComponent();
  }

  public initializeKeyboardCombinaisonsComponent(): void {
    this.keyboardHeatMapData$ = this.restApiService.getRequest<KeyboardCombination[]>('allCombinations.csv', true);
  }

  public initializeBarChartComponent(): void {
    const femaleData$ = this.restApiService.getRequest<NameOccurrence[]>('noms_propres_female_summary.csv', true);
    const maleData$ = this.restApiService.getRequest<NameOccurrence[]>('noms_propres_male_summary.csv', true);
    const genders$ = this.restApiService.getRequest<Genders>('genders.csv', true);
    this.passwordNounsChartData$ = forkJoin([femaleData$, maleData$, genders$]);
  }
}

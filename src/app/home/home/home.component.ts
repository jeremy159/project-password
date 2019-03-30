import { Component, OnInit } from '@angular/core';
import { RestAPIService } from 'src/app/core/services/restAPI.service';
import { Observable, forkJoin } from 'rxjs';
import { NameOccurrence } from 'src/app/shared/models/name-occurrence';
import { KeyboardCombination } from 'src/app/shared/models/keyboard-combination';
import { PasswordTreemap } from 'src/app/shared/models/password-treemap';
import { Diversity } from 'src/app/shared/models/diversity';
import { KeyboardOccurrence } from 'src/app/shared/models/keyboard-occurrence';
import { PasswordCrackingTimes } from 'src/app/shared/models/password-cracking-times';

@Component({
  selector: 'pp-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public passwordNounsChartData$: Observable<[NameOccurrence[], NameOccurrence[]]>;
  public keyboardCombinationsHeatmapData$: Observable<KeyboardCombination[]>;
  public passwordTreemapData$: Observable<PasswordTreemap>;
  public disersityDonutData$: Observable<Diversity[]>;
  public keyboardOccurrencesHeatmapData$: Observable<[KeyboardOccurrence[], KeyboardOccurrence[], KeyboardOccurrence[]]>;
  public passwordCrackingHeatmap$: Observable<PasswordCrackingTimes>;

  constructor(private restApiService: RestAPIService) { }

  public ngOnInit(): void {
    this.initializeKeyboardOccurrencesComponent();
    this.initializeKeyboardCombinaisonsComponent();
    this.initializePasswordTreemapComponent();
    this.initializeBarChartComponent();
    this.initializeDiversityDonutComponent();
    this.initializePasswordCrackingHeatmapComponent();
  }

  public initializeKeyboardOccurrencesComponent(): void {
    const letters$ = this.restApiService.getRequest<KeyboardOccurrence[]>('letters.csv', true);
    const numbers$ = this.restApiService.getRequest<KeyboardOccurrence[]>('numbers.csv', true);
    const special_char$ = this.restApiService.getRequest<KeyboardOccurrence[]>('special_char.csv', true);
    this.keyboardOccurrencesHeatmapData$ = forkJoin(letters$, numbers$, special_char$);
  }

  public initializeKeyboardCombinaisonsComponent(): void {
    this.keyboardCombinationsHeatmapData$ = this.restApiService.getRequest<KeyboardCombination[]>('allCombinations.csv', true);
  }

  public initializePasswordTreemapComponent(): void {
    this.passwordTreemapData$ = this.restApiService.getRequest<PasswordTreemap>('data_100.json', true, false);
  }

  public initializeBarChartComponent(): void {
    const femaleData$ = this.restApiService.getRequest<NameOccurrence[]>('noms_propres_female_summary.csv', true);
    const maleData$ = this.restApiService.getRequest<NameOccurrence[]>('noms_propres_male_summary.csv', true);
    this.passwordNounsChartData$ = forkJoin([femaleData$, maleData$]);
  }

  public initializeDiversityDonutComponent(): void {
    this.disersityDonutData$ = this.restApiService.getRequest<Diversity[]>('diversity.csv', true);
  }

  public initializePasswordCrackingHeatmapComponent(): void {
    this.passwordCrackingHeatmap$ = this.restApiService.getRequest<PasswordCrackingTimes>('crackingTimes.json', true, false);
  }
}

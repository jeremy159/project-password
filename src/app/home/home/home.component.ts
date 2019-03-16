import { Component, OnInit } from '@angular/core';
import { RestAPIService } from 'src/app/core/services/restAPI.service';
import { Observable, forkJoin } from 'rxjs';
import { NameOccurrence } from 'src/app/shared/models/name-occurrence';
import { Genders } from 'src/app/shared/models/genders';

@Component({
  selector: 'pp-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public passwordNounsChartData$: Observable<[NameOccurrence[], NameOccurrence[], Genders]>;

  constructor(private restApiService: RestAPIService) { }

  public ngOnInit(): void {
    const femaleData$ = this.restApiService.getRequest<NameOccurrence[]>('noms_propres_female_summary.csv', true);
    const maleData$ = this.restApiService.getRequest<NameOccurrence[]>('noms_propres_male_summary.csv', true);
    const genders$ = this.restApiService.getRequest<Genders>('genders.csv', true);
    this.passwordNounsChartData$ = forkJoin([femaleData$, maleData$, genders$]);
  }
}

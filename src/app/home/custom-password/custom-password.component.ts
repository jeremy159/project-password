import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import * as zxcvbn from 'zxcvbn';
import { Observable, empty } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { RestAPIService } from 'src/app/core/services/restAPI.service';

// Fix nécessaire puisque le type ne contient pas le champ password
interface ZXCVBNResult extends zxcvbn.ZXCVBNResult {
  password: string;
}

@Component({
  selector: 'pp-custom-password',
  templateUrl: './custom-password.component.html',
  styleUrls: ['./custom-password.component.scss']
})
export class CustomPasswordComponent implements OnInit {

  public searchField: FormControl;
  public formGroup: FormGroup;
  public shieldFillPercentage: number;
  public shieldColor: zxcvbn.ZXCVBNScore = 0;
  public crackingTime = '';
  public searchResult$: Observable<string[]>;

  constructor(private fb: FormBuilder,
              private restApiService: RestAPIService) { }

  ngOnInit() {
    this.buildForm();
    this.listenToInput();
  }

  private buildForm(): void {
    this.searchField = new FormControl();
    this.formGroup = this.fb.group({search: this.searchField});
  }

  private listenToInput(): void {
    this.searchResult$ = this.searchField.valueChanges.pipe(
      tap((value: string) => this.shieldFillPercentage = value.length / 20),  // Update le remplissage du bouclier
      map((value: string) => this.getZxcvbnEstimation(value)),  // Obtenir les statistiques du mot de passe
      tap((value: ZXCVBNResult) => this.shieldColor = value.score), // Update la couleur du bouclier
      tap((value: ZXCVBNResult) => this.getCrackingTime(value)),
      map((value: ZXCVBNResult) => value.password), // Retenir seulement le mot de passe pour la suite
      debounceTime(400),  // Debounce puisqu'il y a utilisation du réseau après
      distinctUntilChanged(),
      switchMap(term => this.searchInDatabase(term))  // Recherche dans la base de données
    );
  }

  private getZxcvbnEstimation(value: string): ZXCVBNResult {
    return zxcvbn(value) as ZXCVBNResult;
  }

  private getCrackingTime(value: ZXCVBNResult): void {
    if (value.password === '') {
      this.crackingTime = '';
      return;
    }
    if (value.crack_times_display.offline_fast_hashing_1e10_per_second === 'less than a second') {
      this.crackingTime = 'moins d\'une seconde';
    }
    else {
      this.crackingTime =
        (value.crack_times_display.offline_fast_hashing_1e10_per_second as string).replace(/second/g, 'seconde')
          .replace(/seconds/g, 'secondes')
          .replace(/hours/g, 'heures')
          .replace(/hour/g, 'heure')
          .replace(/days/g, 'jours')
          .replace(/day/g, 'jour')
          .replace(/months/g, 'mois')
          .replace(/month/g, 'mois')
          .replace(/years/g, 'années')
          .replace(/year/g, 'année')
          .replace(/centuries/g, 'des siècles');
    }
  }

  private searchInDatabase(value: string): Observable<string[]> {
    this.restApiService.getRequest<string[]>(`password/${value}`).subscribe((d) => console.log(d));
    return empty();
  }
}

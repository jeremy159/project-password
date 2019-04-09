import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import * as zxcvbn from 'zxcvbn';
import { Observable, empty, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, tap, filter, catchError } from 'rxjs/operators';
import { RestAPIService } from 'src/app/core/services/restAPI.service';

// Fix nécessaire puisque le type ne contient pas le champ password
interface ZXCVBNResult extends zxcvbn.ZXCVBNResult {
  password: string;
}

interface DatabaseRequest {
  data: [User[], User[], User[], User[]];
}

interface User {
  username: string;
  password: string;
}

@Component({
  selector: 'pp-custom-password',
  templateUrl: './custom-password.component.html',
  styleUrls: ['./custom-password.component.scss']
})
export class CustomPasswordComponent implements OnInit {

  @ViewChild('table') private tableElement: ElementRef;
  public searchField: FormControl;
  public formGroup: FormGroup;
  public shieldFillPercentage: number;
  public shieldColor: zxcvbn.ZXCVBNScore = 0;
  public crackingTime = '';
  public searchResult$: Observable<User[]>;
  public displayedColumns: string[] = ['username', 'password'];
  public dataLength = 0;
  public isLoadingResults = false;
  public hasNoResults = false;
  public hasEncounteredError = false;

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
      filter((value: string) => !!value),
      switchMap(term => {
        this.isLoadingResults = true;
        this.hasNoResults = false;
        this.hasEncounteredError = false;
        return this.searchInDatabase(term); // Recherche dans la base de données
      })
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
    if (value.crack_times_display.offline_slow_hashing_1e4_per_second === 'less than a second') {
      this.crackingTime = 'moins d\'une seconde';
    }
    else {
      this.crackingTime =
        (value.crack_times_display.offline_slow_hashing_1e4_per_second as string).replace(/second/g, 'seconde')
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

  private searchInDatabase(value: string): Observable<User[]> {
    return this.restApiService.getRequest<DatabaseRequest>(`password/${value}`, false, false).pipe(
      map((results: DatabaseRequest) => {
        const data: [User[], User[], User[], User[]] = results.data;
        this.isLoadingResults = false;
        if (data[0].length === 0 && data[1].length === 0 && data[2].length === 0 && data[3].length === 0) {
          this.dataLength = 0;
          this.hasNoResults = true;
          return [];
        }
        const resultsConcanated = data[0].concat(data[1], data[2], data[3]);
        this.dataLength = resultsConcanated.length;

        // scroll back to top
        this.tableElement.nativeElement.scroll({top: 0});

        return resultsConcanated.sort((a: User, b: User) => a.username.localeCompare(b.username));
      }),
      catchError(() => {
        this.dataLength = 0;
        this.isLoadingResults = false;
        this.hasEncounteredError = true;
        return of([]);
      })
    );
  }
}

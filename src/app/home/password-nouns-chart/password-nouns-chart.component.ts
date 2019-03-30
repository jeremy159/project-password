import {  Component,
          ViewChild,
          ElementRef,
          OnInit,
          Input,
          ChangeDetectionStrategy,
          ViewChildren,
          QueryList } from '@angular/core';
import { D3Service } from 'src/app/core/services/d3.service';
import { NameOccurrence } from 'src/app/shared/models/name-occurrence';
import { PreProcessService } from 'src/app/core/services/pre-process.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, map, filter, tap } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';
import { MatTableDataSource, MatSort, MatRow } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';

interface D3ChartPropreties {
  usernameColor: d3.ScaleLinear<string, string>;
  passwordColor: d3.ScaleLinear<string, string>;
  egoColor: d3.ScaleLinear<string, string>;
}

interface SearchResponse {
  text: string;
  index: number;
  hasResult: boolean;
}

@Component({
  selector: 'pp-password-nouns-chart',
  templateUrl: './password-nouns-chart.component.html',
  styleUrls: ['./password-nouns-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordNounsChartComponent implements OnInit {

  @Input() private data: [NameOccurrence[], NameOccurrence[]];
  @ViewChild('table') private tableElement: ElementRef;
  @ViewChild(MatSort) private sort: MatSort;
  @ViewChildren(MatRow, {read: ElementRef}) private rows: QueryList<ElementRef>;

  private femaleData: NameOccurrence[];
  private maleData: NameOccurrence[];
  private mixedData: NameOccurrence[];
  private d3ChartProps: D3ChartPropreties = {usernameColor: undefined, passwordColor: undefined, egoColor: undefined};
  private usernameColorRange = ['#FFFFFF', '#311B92'];
  private passwordColorRange = ['#FFFFFF', '#01579B'];
  private egoColorRange = ['#FFFFFF', '#1B5E20'];

  public dataSource: MatTableDataSource<NameOccurrence>;
  public displayedColumns = ['position', 'name', 'username', 'password', 'both', 'egocentric'];
  public selectedRowIndex = 2;
  public searchField: FormControl;
  public formGroup: FormGroup;
  public searchResult$: Observable<string>;
  public selection: SelectionModel<NameOccurrence>;

  constructor(private d3Service: D3Service,
              private preProcessService: PreProcessService,
              private fb: FormBuilder) { }

  public ngOnInit(): void {
    this.femaleData = this.data[0];
    this.maleData = this.data[1];

    this.preProcessService.convertNumbers(this.femaleData, ['username', 'password', 'both']);
    this.preProcessService.convertNumbers(this.maleData, ['username', 'password', 'both']);

    this.initializeInput();

    this.formatData();
    this.initialize();
  }

  private formatData(): void {
    this.femaleData.forEach((f: NameOccurrence) => {
      f.egocentric = f.both / f.username;
      f.gender = 'female';
    });
    this.maleData.forEach((m: NameOccurrence) => {
      m.egocentric = m.both / m.username;
      m.gender = 'male';
    });
    this.mixedData = this.maleData.slice().concat(this.femaleData.slice());
    this.mixedData = this.mixedData.sort((d1: NameOccurrence, d2: NameOccurrence) =>
      this.d3Service.d3.descending(d1.egocentric, d2.egocentric));
    this.mixedData.forEach((m: NameOccurrence, i: number) => m.position = i + 1);
    this.dataSource = new MatTableDataSource(this.mixedData);
    this.dataSource.sort = this.sort;
    this.selection = new SelectionModel(false, null);
  }

  private initialize(): void {
    // Set the ranges
    this.d3ChartProps.usernameColor = this.d3Service.d3.scaleLinear().range(this.usernameColorRange);
    this.d3ChartProps.passwordColor = this.d3Service.d3.scaleLinear().range(this.passwordColorRange);
    this.d3ChartProps.egoColor = this.d3Service.d3.scaleLinear().range(this.egoColorRange);

    // Domains
    this.d3ChartProps.usernameColor.domain([
      this.d3Service.d3.min(this.mixedData, (d: NameOccurrence) => d.username),
      this.d3Service.d3.max(this.mixedData, (d: NameOccurrence) => d.username)
    ]);
    this.d3ChartProps.passwordColor.domain([
      this.d3Service.d3.min(this.mixedData, (d: NameOccurrence) => d.password),
      this.d3Service.d3.max(this.mixedData, (d: NameOccurrence) => d.password)
    ]);
    this.d3ChartProps.egoColor.domain([
      this.d3Service.d3.min(this.mixedData, (d: NameOccurrence) => d.egocentric),
      this.d3Service.d3.max(this.mixedData, (d: NameOccurrence) => d.egocentric)
    ]);
  }

  public getFormattedNumber(n: number): string {
    return this.d3Service.getFormattedNumber(n);
  }

  public getFormattedPercent(n: number): string {
    return this.d3Service.getFormattedPercent(n);
  }

  public getBgColor(column: string, ratio: number): string {
    let color: string;
    switch (column) {
      case 'username':
        color = this.d3ChartProps.usernameColor(ratio);
      break;

      case 'password':
        color = this.d3ChartProps.passwordColor(ratio);
      break;

      case 'egocentric':
        color = this.d3ChartProps.egoColor(ratio);
      break;

      default:
        color = 'rgb(255, 255, 255)';
      break;
    }
    return color;
  }

  // https://stackoverflow.com/a/12043228
  public getColor(column: string, ratio: number): string {
    const regExp = /\(([^)]+)\)/;
    const color = this.getBgColor(column, ratio);
    const match = regExp.exec(color)[1].replace(/\s/g, '');
    const [rs, gs, bs] = match.split(',');
    const r = parseInt(rs, 10);
    const g = parseInt(gs, 10);
    const b = parseInt(bs, 10);

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    return luma > 128 ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)';
  }

  private showRow(index: number): void {
    if (index != null) {
      const rowsArray = this.rows.toArray();
      this.selection.select(this.mixedData[index]);
      const el: any = (<ElementRef>rowsArray[index]).nativeElement;
      const padding = el.clientHeight + 8;
      this.tableElement.nativeElement.scroll({top: el.offsetTop - padding, behavior: 'smooth'});
    }
    else {
      this.selection.select(null);
    }
  }

  private initializeInput(): void {
    this.searchField = new FormControl();
    this.formGroup = this.fb.group({search: this.searchField});

    this.searchResult$ = this.searchField.valueChanges.pipe(
      map((term: string) => term.toLowerCase()),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchInFiles(term)),
      tap((response: SearchResponse) => this.showRow(response.hasResult ? response.index : null)),
      map((response: SearchResponse) => response.text)
    );
  }

  private searchInFiles(term: string): Observable<SearchResponse> {
    let text = '';
    let hasResult = false;
    let index = -1;
    const subject: BehaviorSubject<SearchResponse> = new BehaviorSubject<SearchResponse>({text, index, hasResult});
    if (term !== '') {
      text = 'Votre prénom n\'apparaît pas<br/>dans les prénoms les plus égocentriques';
      for (let i = 0; i < this.mixedData.length; i++) {
        if (this.mixedData[i].name === term) {
          text = `Voyez votre prénom dans le tableau!`;
          hasResult = true;
          index = i;
          break;
        }
      }
    }
    subject.next({text, index, hasResult});
    return subject.asObservable();
  }
}

import { Component, ViewChild, ElementRef, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { D3Service } from 'src/app/core/services/d3.service';
import { NameOccurrence } from 'src/app/shared/models/name-occurrence';
import { PreProcessService } from 'src/app/core/services/pre-process.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';
import { MatTableDataSource, MatSort } from '@angular/material';

interface D3ChartPropreties {
  usernameColor: d3.ScaleLinear<string, string>;
  passwordColor: d3.ScaleLinear<string, string>;
  egoColor: d3.ScaleLinear<string, string>;
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

  private femaleData: NameOccurrence[];
  private maleData: NameOccurrence[];
  private mixedData: NameOccurrence[];
  private tooltip: any;
  private d3ChartProps: D3ChartPropreties = {usernameColor: undefined, passwordColor: undefined, egoColor: undefined};
  public dataSource: MatTableDataSource<NameOccurrence>;
  public displayedColumns = ['name', 'username', 'password', 'both', 'egocentric'];
  private usernameColorRange = ['#FFFFFF', '#311B92'];
  private passwordColorRange = ['#FFFFFF', '#01579B'];
  private egoColorRange = ['#FFFFFF', '#1B5E20'];

  public searchField: FormControl;
  public formGroup: FormGroup;
  public searchResult$: Observable<string>;

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
    // this.mixedData = this.mixedData.slice(0, 10);
    this.dataSource = new MatTableDataSource(this.mixedData);
    this.dataSource.sort = this.sort;
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

    // Define the div for the tooltip
    this.tooltip = this.d3Service.d3.select(this.tableElement.nativeElement).append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
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

  private getTooltipText(data: NameOccurrence): string {
    return `<strong>Prénom:</strong> ${data.name}<br/>
            <strong>Proportion:</strong> ${this.d3Service.getFormattedPercent(data.egocentric)}<br/>
            <strong>Nom d'usager:</strong> ${this.d3Service.getFormattedNumber(data.username)} fois<br/>
            <strong>Mot de passe:</strong> ${this.d3Service.getFormattedNumber(data.password)} fois<br/>
            <strong>Les deux:</strong> ${this.d3Service.getFormattedNumber(data.both)} fois<br/>`;
  }

  private showTooltip(d: NameOccurrence): void {
    const rect = this.d3Service.d3.event.target.getBoundingClientRect();
    const hostElem = this.tableElement.nativeElement.getBoundingClientRect();
    const tooltip = document.getElementsByClassName('tooltip')[0].getBoundingClientRect();
    this.tooltip.style('left', () => {
      const offset = 24 / 2;
      const x = rect.left + rect.width / 2 - tooltip.width / 2 - offset;
      return `${x}px`;
    }).style('top', () => {
      const padding = 20;
      const y = rect.top - hostElem.top - tooltip.height - padding;
      return `${y}px`;
    });

    this.tooltip.transition()
      .duration(200)
      .style('opacity', .9);
    this.tooltip.html(this.getTooltipText(d));
  }

  private hideTooltip(d: any): void {
    this.tooltip.transition()
      .duration(500)
      .style('opacity', 0);
  }

  private initializeInput(): void {
    this.searchField = new FormControl();
    this.formGroup = this.fb.group({search: this.searchField});

    this.searchResult$ = this.searchField.valueChanges.pipe(
      map((term: string) => term.toLowerCase()),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchInFiles(term))
    );
  }

  private searchInFiles(term: string): Observable<string> {
    let text = '';
    const subject: BehaviorSubject<string> = new BehaviorSubject<string>(text);
    if (term !== '') {
      text = 'Votre prénom n\'apparaît pas<br/>dans les prénoms les plus égocentriques';
      for (let i = 0; i < this.mixedData.length; i++) {
        if (this.mixedData[i].name === term) {
          text = `Parmi les prénoms les plus égocentriques,<br/>
                  ${term.toUpperCase()} arrive en ${i + 1}${i === 0 ? 'ère' : 'eme'} position!`;
          break;
        }
      }
    }
    subject.next(text);
    return subject.asObservable();
  }
}

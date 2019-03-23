import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { ScrollRefService } from 'src/app/core/services/scroll-ref.service';
import { D3Service } from 'src/app/core/services/d3.service';
import { NameOccurrence } from 'src/app/shared/models/name-occurrence';
import { Margin } from 'src/app/shared/models/margin';
import { ChartPropreties } from 'src/app/shared/models/chart-propreties';
import { PreProcessService } from 'src/app/core/services/pre-process.service';
import { Genders } from 'src/app/shared/models/genders';
import d3Tip from 'd3-tip';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, map, tap } from 'rxjs/operators';
import { Observable, from, Subject, BehaviorSubject } from 'rxjs';

interface GraphData {
  gender: string;
  proportion: number;
}

interface SplitData {
  female: {
    object: any,
    keys: string[]
  };
  male: {
    object: any,
    keys: string[]
  };
}

@Component({
  selector: 'pp-password-nouns-chart',
  templateUrl: './password-nouns-chart.component.html',
  styleUrls: ['./password-nouns-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordNounsChartComponent implements OnInit, AfterViewInit {

  @Input() private data: [NameOccurrence[], NameOccurrence[], Genders[]];
  @ViewChild('firstChart') private scrollReference: ElementRef;
  @ViewChild('chart') private chartElement: ElementRef;
  private femaleData: NameOccurrence[];
  private maleData: NameOccurrence[];
  private mixedData: NameOccurrence[];
  private genders: Genders[];
  private svgElement: any;
  private tooltip: any;
  private chartProps: ChartPropreties = {x: undefined, y: undefined, xAxis: undefined, yAxis: undefined, color: undefined, height: 0};
  private femaleColors: string[] = ['#880E4F', '#AD1457', '#C2185B', '#D81B60', '#E91E63', '#EC407A'];
  private maleColors: string[] = ['#1A237E', '#283593', '#303F9F', '#3949AB', '#3F51B5', '#5C6BC0'];
  private femaleCount: number;
  private maleCount: number;
  private formatedInitialData: GraphData[];
  private formatedSplitData: SplitData = {female: {object: {}, keys: []}, male: {object: {}, keys: []}};

  public searchField: FormControl;
  public formGroup: FormGroup;
  public searchResult$: Observable<string>;

  constructor(private scrollRefService: ScrollRefService,
              private d3Service: D3Service,
              private preProcessService: PreProcessService,
              private fb: FormBuilder) { }

  public ngOnInit(): void {
    this.femaleData = this.data[0];
    this.maleData = this.data[1];
    this.genders = this.data[2];

    this.preProcessService.convertNumbers(this.femaleData, ['username', 'password', 'both']);
    this.preProcessService.convertNumbers(this.maleData, ['username', 'password', 'both']);
    this.preProcessService.convertNumbers(this.genders, ['male', 'female']);

    this.initializeInput();

    this.formatData();
    this.initialize();
    // this.createBarChart();
  }

  public ngAfterViewInit(): void {
    this.scrollRefService.scrollElement = this.scrollReference;
  }

  private formatData(): void {
    this.formatInitialData();
    this.formatSplitingData('female', this.femaleCount);
    this.formatSplitingData('male', this.maleCount);
  }

  private formatInitialData(): void {
    this.femaleCount = this.d3Service.d3.sum(this.femaleData, (f: NameOccurrence) => f.both);
    this.maleCount = this.d3Service.d3.sum(this.maleData, (f: NameOccurrence) => f.both);
    this.formatedInitialData = [
      {gender: 'masculin', proportion: this.maleCount / this.genders[0].male},
      {gender: 'feminin', proportion: this.femaleCount / this.genders[0].female}
    ];
    this.mixedData = this.maleData.slice().concat(this.femaleData.slice());
    // this.mixedData = this.mixedData.sort((d1: NameOccurrence, d2: NameOccurrence) =>
    //   this.d3Service.d3.descending(d1.both / d1.username, d2.both / d2.username));
    this.preProcessService.sortData(this.mixedData, 'both', false);
  }

  private formatSplitingData(gender: string, count: number): void {
    const data: NameOccurrence[] = this[`${gender}Data`];

    // data = data.sort((d1: NameOccurrence, d2: NameOccurrence) =>
    //   this.d3Service.d3.descending(d1.both / d1.username, d2.both / d2.username));
    this.preProcessService.sortData(data, 'both', false);

    const firstNames = [];
    const firstNOccurrences = 5;
    const total = count + this.genders[0][gender];
    const formatedObject = { gender, autres: 0 };
    const others: NameOccurrence = {name: 'autres', username: 0, password: 0, both: 0};
    data.forEach((d: NameOccurrence, index: number) => {
      if (index < firstNOccurrences) {
        formatedObject[d.name] = d.both / total;
        firstNames.push(d.name);
      }
      else {
        formatedObject['autres'] += d.both;
        others.username += d.username;
        others.password += d.password;
        others.both += d.both;
      }
    });
    formatedObject['autres'] /= total;
    firstNames.unshift('autres');
    data.push(others);

    // Quick fix pour faire en sorte que les rectangles ne bougent pas
    // (La somme étant plus petite, e.g. 2.63% au lieu de 2.70% pour les femmes)
    let sum = 0;
    for (const k in formatedObject) {
      if (k !== 'gender') {
        sum += formatedObject[k];
      }
    }
    formatedObject['autres'] += count / this.genders[0][gender] - sum;
    this.formatedSplitData[gender] = {object: [formatedObject], keys: firstNames};
  }

  private getTooltipText(name: string, gender: string): string {
    let nameData: NameOccurrence;
    if (gender === 'female') {
      nameData = this.femaleData.find((f: NameOccurrence) => f.name === name);
    }
    else {
      nameData = this.maleData.find((m: NameOccurrence) => m.name === name);
    }

    return `<strong>Prénom:</strong> ${name}<br/>
            <strong>Proportion:</strong> ${this.d3Service.getFormattedPercent(nameData.both / this[`${gender}Count`])}<br/>
            <strong>Nom d'usager:</strong> ${this.d3Service.getFormattedNumber(nameData.username)} fois<br/>
            <strong>Mot de passe:</strong> ${this.d3Service.getFormattedNumber(nameData.password)} fois<br/>
            <strong>Les deux:</strong> ${this.d3Service.getFormattedNumber(nameData.both)} fois<br/>`;
  }

  private initialize(): void {
    // Set the dimensions of the canvas / graph
    const margin: Margin = { top: 30, right: 20, bottom: 30, left: 50 };
    const width = 400 - margin.left - margin.right;
    this.chartProps.height = 400 - margin.top - margin.bottom;

    // Set the ranges
    this.chartProps.x = this.d3Service.d3.scaleBand().range([0, width]).round(0.05).padding(0.4);
    this.chartProps.y = this.d3Service.d3.scaleLinear().range([this.chartProps.height, 0]);

    this.chartProps.x.domain(['masculin', 'feminin']);
    this.chartProps.y.domain([0, 0.04]);

    this.chartProps.color = this.d3Service.d3.scaleOrdinal()
      .range([this.maleColors[this.maleColors.length - 1], this.femaleColors[this.femaleColors.length - 1]])
      .domain(['masculin', 'feminin']);

    // Define the axes
    this.chartProps.xAxis = this.d3Service.d3.axisBottom(this.chartProps.x);

    this.svgElement = this.d3Service.d3.select(this.chartElement.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', this.chartProps.height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.d3Service.createAxes(this.svgElement, this.chartProps.xAxis, width, this.chartProps.height, null);

    // Define the div for the tooltip
    this.tooltip = this.d3Service.d3.select(this.chartElement.nativeElement).append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
  }

  public createBarChart(): void {
    const bars = this.svgElement.selectAll('rect')
      .data(this.formatedInitialData)
      .enter()
      .append('g');

    bars.append('rect')
      .attr('class', (d: GraphData) => `${d.gender === 'feminin' ? 'female' : 'male'}`)
      .attr('fill', (d: GraphData) => this.chartProps.color(d.gender))
      .attr('x', (d: GraphData) => this.chartProps.x(d.gender))
      .attr('width', this.chartProps.x.bandwidth())
      .attr('y', (d: GraphData) => this.chartProps.y(d.proportion))
      .attr('height', 0)
      .on('click', (d: GraphData) => this.splitBar(d.gender === 'feminin' ? 'female' : 'male'));

    this.svgElement.selectAll('.female, .male').transition()
      .duration(1000)
      .attr('height', (d: GraphData) => this.chartProps.height - this.chartProps.y(d.proportion));

    bars.append('text')
      .attr('class', 'label')
      .attr('x', (d: GraphData) => this.chartProps.x(d.gender) + this.chartProps.x.bandwidth() / 2)
      .attr('y', (d: GraphData) => this.chartProps.y(d.proportion) - 5)
      .text((d: GraphData) => this.d3Service.getFormattedPercent(d.proportion));
  }

  private splitBar(gender: string): void {
    const stack = this.d3Service.d3.stack()
      .keys(this.formatedSplitData[gender].keys)
      .order(this.d3Service.d3.stackOrderNone)
      .offset(this.d3Service.d3.stackOffsetNone);

    const series = stack(this.formatedSplitData[gender].object);

    const colorScale: d3.ScaleOrdinal<string, string> = this.d3Service.d3.scaleOrdinal()
      .range(this[`${gender}Colors`]).domain(this.formatedSplitData[gender].keys);

    const bars = this.svgElement.selectAll(`.${gender}`)
      .remove().exit()
      .data(series)
      .enter();

    bars.append('rect')
      .attr('class', () => `${gender}-split`)
      .attr('fill', () => this.chartProps.color(gender === 'female' ? 'feminin' : 'masculin'))
      .attr('x', () => this.chartProps.x(gender === 'female' ? 'feminin' : 'masculin'))
      .attr('width', this.chartProps.x.bandwidth())
      .attr('y', (d: any) => this.chartProps.y(d[0][1]))
      .attr('height', (d: any) => this.chartProps.y(d[0][0]) - this.chartProps.y(d[0][1]))
      .on('mouseover', (d: any) => {
        this.showTooltip(d, this.formatedSplitData[gender].object);
      })
      .on('mouseout', (d: any) => {
        this.hideTooltip(d);
      });

    this.svgElement.selectAll(`.${gender}-split`)
      .transition()
      .duration(1000)
      .attr('fill', (d: any) => colorScale(d.key));
  }

  private showTooltip(d: any, formatedData: any[]): void {
    const rect = this.d3Service.d3.event.target.getBoundingClientRect();
    const hostElem = this.chartElement.nativeElement.getBoundingClientRect();
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
    this.tooltip.html(this.getTooltipText(d.key, formatedData[0].gender));
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

import { Component, ViewChild, ElementRef, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { D3Service } from 'src/app/core/services/d3.service';
import { NameOccurrence } from 'src/app/shared/models/name-occurrence';
import { Margin } from 'src/app/shared/models/margin';
import { PreProcessService } from 'src/app/core/services/pre-process.service';
import { Genders } from 'src/app/shared/models/genders';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, map, tap } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';

interface BubbleChartPropreties {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  r: d3.ScaleLinear<number, number>;
  xAxis: d3.Axis<number>;
  yAxis: d3.Axis<number>;
  color: d3.ScaleOrdinal<string, string>;
}

@Component({
  selector: 'pp-password-nouns-chart',
  templateUrl: './password-nouns-chart.component.html',
  styleUrls: ['./password-nouns-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordNounsChartComponent implements OnInit {

  @Input() private data: [NameOccurrence[], NameOccurrence[], Genders[]];
  @ViewChild('bubbleChart') private bubbleChartElement: ElementRef;
  private femaleData: NameOccurrence[];
  private maleData: NameOccurrence[];
  private mixedData: NameOccurrence[];
  // private genders: Genders[];
  private svgElement: any;
  private tooltip: any;
  private bubbleChartProps: BubbleChartPropreties =
    {x: undefined, y: undefined, r: undefined, xAxis: undefined, yAxis: undefined, color: undefined};
  private femaleColors: string[] = ['#880E4F', '#AD1457', '#C2185B', '#D81B60', '#E91E63', '#EC407A'];
  private maleColors: string[] = ['#1A237E', '#283593', '#303F9F', '#3949AB', '#3F51B5', '#5C6BC0'];

  public searchField: FormControl;
  public formGroup: FormGroup;
  public searchResult$: Observable<string>;

  constructor(private d3Service: D3Service,
              private preProcessService: PreProcessService,
              private fb: FormBuilder) { }

  public ngOnInit(): void {
    this.femaleData = this.data[0];
    this.maleData = this.data[1];
    // this.genders = this.data[2];

    this.preProcessService.convertNumbers(this.femaleData, ['username', 'password', 'both']);
    this.preProcessService.convertNumbers(this.maleData, ['username', 'password', 'both']);
    // this.preProcessService.convertNumbers(this.genders, ['male', 'female']);

    this.initializeInput();

    this.formatData();
    this.initialize();
    this.createBubbleChart();
  }

  private formatData(): void {
    this.femaleData.forEach((f: NameOccurrence) => f.gender = 'female');
    this.maleData.forEach((m: NameOccurrence) => m.gender = 'male');
    this.mixedData = this.maleData.slice().concat(this.femaleData.slice());
    this.mixedData = this.mixedData.sort((d1: NameOccurrence, d2: NameOccurrence) =>
      this.d3Service.d3.descending(d1.both / d1.username, d2.both / d2.username));
  }

  private getTooltipText(data: NameOccurrence): string {
    return `<strong>Prénom:</strong> ${data.name}<br/>
            <strong>Proportion:</strong> ${this.d3Service.getFormattedPercent(data.both / data.username)}<br/>
            <strong>Nom d'usager:</strong> ${this.d3Service.getFormattedNumber(data.username)} fois<br/>
            <strong>Mot de passe:</strong> ${this.d3Service.getFormattedNumber(data.password)} fois<br/>
            <strong>Les deux:</strong> ${this.d3Service.getFormattedNumber(data.both)} fois<br/>`;
  }

  private initialize(): void {
    // Set the dimensions of the canvas / graph
    const margin: Margin = { top: 30, right: 20, bottom: 30, left: 50 };
    const width = 400 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Set the ranges
    this.bubbleChartProps.x = this.d3Service.d3.scaleLinear().range([0, width]);
    this.bubbleChartProps.y = this.d3Service.d3.scaleLinear().range([height, 0]);
    this.bubbleChartProps.r = this.d3Service.d3.scaleSqrt().range([5, 20]);
    this.bubbleChartProps.color = this.d3Service.d3.scaleOrdinal().range(['#e377c2', '#1f77b4']);

    // Domains
    this.bubbleChartProps.x.domain([0, this.d3Service.d3.max(this.mixedData, (d: NameOccurrence) => d.username)]);
    this.bubbleChartProps.y.domain([0, this.d3Service.d3.max(this.mixedData, (d: NameOccurrence) => d.password)]);
    this.bubbleChartProps.r.domain([
      this.d3Service.d3.min(this.mixedData, (d: NameOccurrence) => d.both / d.username),
      this.d3Service.d3.max(this.mixedData, (d: NameOccurrence) => d.both / d.username)
    ]);
    this.bubbleChartProps.color.domain(['female', 'male']);

    // Define the axes
    this.bubbleChartProps.xAxis = this.d3Service.d3.axisBottom(this.bubbleChartProps.x).tickFormat(this.d3Service.getFormattedNumber);
    this.bubbleChartProps.yAxis = this.d3Service.d3.axisLeft(this.bubbleChartProps.y).tickFormat(this.d3Service.getFormattedNumber);

    this.svgElement = this.d3Service.d3.select(this.bubbleChartElement.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.createAxes(this.svgElement, this.bubbleChartProps.xAxis, this.bubbleChartProps.yAxis, width, height);

    // Define the div for the tooltip
    this.tooltip = this.d3Service.d3.select(this.bubbleChartElement.nativeElement).append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
  }

  private createAxes(g: any, xAxis: d3.Axis<number>, yAxis: d3.Axis<number>, width: number, height: number) {
    // horizontal axe
    g.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    // x title
    g.append('text')
      .attr('transform', `translate(${width}, ${height})`)
      .attr('text-anchor', 'end')
      .text('Nombre d\'apparitions dans le nom d\'utilisateur');

    // vertical axe
    g.append('g')
      .attr('class', 'y axis')
      .call(yAxis);

    // y title
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -10)
      .attr('x', 18)
      .text('Nombre d\'apparitions dans le mot de passe');
  }

  public createBubbleChart(): void {
    this.svgElement.selectAll('circle')
      .data(this.mixedData)
      .enter()
      .append('circle')
      .attr('cx', (d: NameOccurrence) => this.bubbleChartProps.x(d.username))
      .attr('cy', (d: NameOccurrence) => this.bubbleChartProps.y(d.password))
      .attr('r', (d: NameOccurrence) => this.bubbleChartProps.r(d.both / d.username))
      .attr('fill', (d: NameOccurrence) => this.bubbleChartProps.color(d.gender))
      .on('mouseover', (d: NameOccurrence) => {
        this.showTooltip(d);
      })
      .on('mouseout', (d: NameOccurrence) => {
        this.hideTooltip(d);
      });
  }

  private showTooltip(d: NameOccurrence): void {
    const rect = this.d3Service.d3.event.target.getBoundingClientRect();
    const hostElem = this.bubbleChartElement.nativeElement.getBoundingClientRect();
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

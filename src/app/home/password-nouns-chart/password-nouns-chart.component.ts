import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { ScrollRefService } from 'src/app/core/services/scroll-ref.service';
import { D3Service } from 'src/app/core/services/d3.service';
import { NameOccurrence } from 'src/app/shared/models/name-occurrence';
import { Margin } from 'src/app/shared/models/margin';
import { ChartPropreties } from 'src/app/shared/models/chart-propreties';
import { PreProcessService } from 'src/app/core/services/pre-process.service';
import { Genders } from 'src/app/shared/models/genders';

interface GraphData {
  gender: string;
  percentage: number;
}

interface GenderCount {
  female: number;
  male: number;
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
  private genders: Genders[];
  private svgElement: any;
  private chartProps: ChartPropreties = {x: undefined, y: undefined, xAxis: undefined, yAxis: undefined, color: undefined};
  private genderCount: GenderCount = {female: 0, male: 0};
  private femaleColors: string[] = ['#e377c2', '#2ca02c', '#ff7f0e', '#d62728', '#bcbd22', '#17becf'];
  private maleColors: string[] = ['#1f77b4', '#bcbd22', '#8c564b', '#ff7f0e', '#2ca02c', '#d62728'];

  constructor(private scrollRefService: ScrollRefService,
              private d3Service: D3Service,
              private preProcessService: PreProcessService) { }

  public ngOnInit(): void {
    this.femaleData = this.data[0];
    this.maleData = this.data[1];
    this.genders = this.data[2];

    this.preProcessService.convertNumbers(this.femaleData, ['username', 'password', 'both']);
    this.preProcessService.convertNumbers(this.maleData, ['username', 'password', 'both']);
    this.preProcessService.convertNumbers(this.genders, ['male', 'female']);

    this.initialize();
  }

  public ngAfterViewInit(): void {
    this.scrollRefService.scrollElement = this.scrollReference;
  }

  private formatInitialData(): GraphData[] {
    this.genderCount.female = this.d3Service.d3.sum(this.femaleData, (f: NameOccurrence) => f.both);
    this.genderCount.male = this.d3Service.d3.sum(this.maleData, (f: NameOccurrence) => f.both);
    const initialData: GraphData[] = [
      {gender: 'masculin', percentage: this.genderCount.male / this.genders[0].male},
      {gender: 'feminin', percentage: this.genderCount.female / this.genders[0].female}
    ];
    return initialData;
  }

  private formatSplitingData(gender: string, data: NameOccurrence[]): any {
    const firstNames = [];
    const firstNOccurrences = 5;
    const total = this.genderCount[gender] + this.genders[0][gender];
    const formatedObject = { gender, autres: 0 };
    data.forEach((d: NameOccurrence, index: number) => {
      if (index < firstNOccurrences) {
        formatedObject[d.name] = d.both / total;
        firstNames.push(d.name);
      }
      else {
        formatedObject['autres'] += d.both;
      }
    });
    formatedObject['autres'] /= total;
    firstNames.push('autres');
    return {object: [formatedObject], keys: firstNames.reverse()};
  }

  private initialize(): void {
    // Set the dimensions of the canvas / graph
    const margin: Margin = { top: 30, right: 20, bottom: 30, left: 50 };
    const width = 400 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Set the ranges
    this.chartProps.x = this.d3Service.d3.scaleBand().range([0, width]).round(0.05).padding(0.4);
    this.chartProps.y = this.d3Service.d3.scaleLinear().range([height, 0]);

    this.chartProps.x.domain(['masculin', 'feminin']);
    this.chartProps.y.domain([0, 0.05]);

    this.chartProps.color = this.d3Service.d3.scaleOrdinal()
      .range([this.maleColors[0], this.femaleColors[0]]).domain(['masculin', 'feminin']);

    // Define the axes
    this.chartProps.xAxis = this.d3Service.d3.axisBottom(this.chartProps.x);

    this.svgElement = this.d3Service.d3.select(this.chartElement.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.d3Service.createAxes(this.svgElement, this.chartProps.xAxis, width, height, null, 'Sexe');

    this.createBarChart(height);
  }

  private createBarChart(height: number): void {
    const initialData = this.formatInitialData();

    const bars = this.svgElement.selectAll('rect')
      .data(initialData)
      .enter()
      .append('g');

    bars.append('rect')
      .attr('class', (d: GraphData) => `${d.gender === 'feminin' ? 'female' : 'male'}`)
      .attr('fill', (d: GraphData) => this.chartProps.color(d.gender))
      .attr('x', (d: GraphData) => this.chartProps.x(d.gender))
      .attr('width', this.chartProps.x.bandwidth())
      .attr('y', (d: GraphData) => this.chartProps.y(d.percentage))
      .attr('height', 0)
      .on('click', (d: GraphData) => this.splitBar(d.gender === 'feminin' ? 'female' : 'male'));

    this.svgElement.selectAll('.female, .male').transition()
      .duration(1000)
      .attr('height', (d: GraphData) => height - this.chartProps.y(d.percentage));

    bars.append('text')
      .attr('class', 'label')
      .attr('x', (d: GraphData) => this.chartProps.x(d.gender) + this.chartProps.x.bandwidth() / 2)
      .attr('y', (d: GraphData) => this.chartProps.y(d.percentage) - 5)
      .text((d: GraphData) => this.d3Service.getFormattedPercent(d.percentage));
  }

  private splitBar(gender: string): void {
    const data: NameOccurrence[] = this[`${gender}Data`].slice();

    this.preProcessService.sortData(data, 'both', false);

    const formated = this.formatSplitingData(gender, data);
    const formatedData = formated.object;
    const keys = formated.keys;

    const stack = this.d3Service.d3.stack()
      .keys(keys)
      .order(this.d3Service.d3.stackOrderNone)
      .offset(this.d3Service.d3.stackOffsetNone);

    const series = stack(formatedData);

    const colorScale: d3.ScaleOrdinal<string, string> = this.d3Service.d3.scaleOrdinal()
      .range(this[`${gender}Colors`]).domain(keys);

    const bars = this.svgElement.selectAll(`.${gender}`)
      .remove().exit()
      .data(series)
      .enter();

    bars.append('rect')
      .attr('class', () => `${gender}`)
      .attr('fill', () => this.chartProps.color(gender === 'female' ? 'feminin' : 'masculin'))
      .attr('x', () => this.chartProps.x(gender === 'female' ? 'feminin' : 'masculin'))
      .attr('width', this.chartProps.x.bandwidth())
      .attr('y', (d: any) => this.chartProps.y(d[0][1]))
      .attr('height', (d: any) => this.chartProps.y(d[0][0]) - this.chartProps.y(d[0][1]));

    this.svgElement.selectAll(`.${gender}`)
      .transition()
      .duration(1000)
      .attr('fill', (d: any) => colorScale(d.key));
  }
}

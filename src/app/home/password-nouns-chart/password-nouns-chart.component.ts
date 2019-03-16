import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { ScrollRefService } from 'src/app/core/services/scroll-ref.service';
import { D3Service } from 'src/app/core/services/d3.service';
import { NameOccurrence } from 'src/app/shared/models/name-occurrence';
import { Margin } from 'src/app/shared/models/margin';
import { ChartPropreties } from 'src/app/shared/models/chart-propreties';
import { PreProcessService } from 'src/app/core/services/pre-process.service';
import { Genders } from 'src/app/shared/models/genders';

@Component({
  selector: 'pp-password-nouns-chart',
  templateUrl: './password-nouns-chart.component.html',
  styleUrls: ['./password-nouns-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordNounsChartComponent implements OnInit, AfterViewInit {

  @ViewChild('firstChart') public scrollReference: ElementRef;
  @ViewChild('chart') public chartElement: ElementRef;
  public femaleData: NameOccurrence[];
  public maleData: NameOccurrence[];

  @Input() private data: [NameOccurrence[], NameOccurrence[], Genders];
  private genders: Genders;
  private svgElement: any;
  private chartProps: ChartPropreties;

  constructor(private scrollRefService: ScrollRefService,
              private d3Service: D3Service,
              private preProcessService: PreProcessService) {
    this.chartProps = {x: undefined, y: undefined, xAxis: undefined, yAxis: undefined, color: undefined};
  }

  public ngOnInit(): void {
    this.femaleData = this.data[0];
    this.maleData = this.data[1];
    this.genders = this.data[2];

    this.preProcessService.convertNumbers(this.femaleData, ['username', 'password', 'both']);
    this.preProcessService.convertNumbers(this.maleData, ['username', 'password', 'both']);
    this.preProcessService.convertNumbers(this.genders, ['male', 'female']);

    this.buildChart();
  }

  public ngAfterViewInit(): void {
    this.scrollRefService.scrollElement = this.scrollReference;
  }

  private buildChart(): void {
    // Set the dimensions of the canvas / graph
    const margin: Margin = { top: 30, right: 20, bottom: 30, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 270 - margin.top - margin.bottom;

    // Set the ranges
    this.chartProps.x = this.d3Service.d3.scaleBand().range([0, width]).round(0.05);
    this.chartProps.y = this.d3Service.d3.scaleLinear().range([height, 0]);

    this.chartProps.x.domain(['M', 'F']);
    this.chartProps.y.domain([0, 5]);

    this.chartProps.color = this.d3Service.d3.scaleOrdinal()
      .range(['blue', 'pink']).domain(['male', 'female']);

    // Define the axes
    this.chartProps.xAxis = this.d3Service.d3.axisBottom(this.chartProps.x);
    this.chartProps.yAxis = this.d3Service.d3.axisLeft(this.chartProps.y).ticks(5);

    this.svgElement = this.d3Service.d3.select(this.chartElement.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    this.d3Service.createAxes(this.svgElement, this.chartProps.xAxis, this.chartProps.yAxis, height);

    this.createBarChart(height);
  }

  private createBarChart(height: number): void {
    const femaleNumber = this.d3Service.d3.sum(this.femaleData, (f: NameOccurrence) => f.both);
    const maleNumber = this.d3Service.d3.sum(this.maleData, (f: NameOccurrence) => f.both);
    const initialData: any[] = [
      {gender: 'male', number: maleNumber / this.genders.male},
      {gender: 'female', number: femaleNumber / this.genders.female}
    ];

    this.svgElement.selectAll('rect')
      .data(initialData)
      .enter()
      .append('rect')
      .attr('fill', (d) => this.chartProps.color(d.gender))
      .attr('x', (d) => this.chartProps.x(d.gender))
      .attr('width', this.chartProps.x.bandWidth())
      .attr('y', (d) => this.chartProps.y(d.number))
      .attr('height', (d) => height - this.chartProps.y(d.number));
  }
}

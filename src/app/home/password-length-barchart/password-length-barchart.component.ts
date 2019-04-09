import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { D3Service } from 'src/app/core/services/d3.service';
import { PreProcessService } from 'src/app/core/services/pre-process.service';

interface BarchartProperties {
  color: d3.ScaleLinear<string, string>;
  width: number;
  height: number;
  margin: number;
  x: d3.ScaleBand<string>;
  y: d3.ScaleLinear<string, string>;
}

@Component({
  selector: 'pp-password-length-barchart',
  templateUrl: './password-length-barchart.component.html',
  styleUrls: ['./password-length-barchart.component.scss']
})
export class PasswordLengthBarchartComponent implements OnInit {

  @Input() private data: any;
  @ViewChild('barchart') private barchartElement: ElementRef;
  private svgElement: any;
  private chart: any;
  private tooltip: any;
  private target: any;
  private barchartProps: BarchartProperties =
    { color: undefined, width: 0, height: 0, x: undefined, y: undefined, margin: 60 };

  constructor(private d3Service: D3Service,
              private preProcessService: PreProcessService) { }

  ngOnInit() {
    this.preProcessService.convertNumbers(this.data, ['occurrence']);

    this.initialize();
    this.createBarchart();
  }

  private initialize(): void {
    const svgWidth = 800;
    const svgHeight = 500;

    this.svgElement = this.d3Service.d3.select(this.barchartElement.nativeElement)
      .append('svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    this.barchartProps.width = 700 - 2 * this.barchartProps.margin;
    this.barchartProps.height = 400 - 2 * this.barchartProps.margin;

    this.chart = this.svgElement.append('g')
      .attr('transform', `translate(${this.barchartProps.margin}, ${this.barchartProps.margin})`);

    this.barchartProps.y = this.d3Service.d3.scaleLinear()
      .range([this.barchartProps.height, 0])
      .domain([0, 1.01 * this.d3Service.d3.max(this.data, (d) => d.occurrence)]);

    this.chart.append('g')
      .attr('transform', `translate(100, 0)`)
      .call(this.d3Service.d3.axisLeft(this.barchartProps.y));

    this.barchartProps.x = this.d3Service.d3.scaleBand()
      .range([0, this.barchartProps.width - 100])
      .domain(this.data.map((s) => s.len))
      .padding(0.2);

    this.chart.append('g')
      .attr('transform', `translate(100, ${this.barchartProps.height})`)
      .call(this.d3Service.d3.axisBottom(this.barchartProps.x));

    // Define the div for the tooltip
    this.tooltip = this.d3Service.d3.select(this.barchartElement.nativeElement).append('div')
      .attr('id', 'password-length-tooltip')
      .attr('class', 'tooltip')
      .style('opacity', 0);
  }

  public createBarchart(): void {
    this.chart.selectAll()
      .data(this.data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (s) => this.barchartProps.x(s.len) + 100)
      .attr('y', (s) => this.barchartProps.y(s.occurrence))
      .attr('height', (s) => this.barchartProps.height - +this.barchartProps.y(s.occurrence))
      .attr('width', this.barchartProps.x.bandwidth())
      .attr('fill', '#021d49')
      .style('opacity', 0.9)
      .on('mouseover', (d) => {
        this.target = this.d3Service.d3.event.path[0];
        const rectD3Wrapper = this.d3Service.d3.select(this.target);

        // Rect
        rectD3Wrapper.attr('opacity', 1);

        this.showTooltip(d);
      })
      .on('mouseout', () => {
        if (this.target) {
          const rectD3Wrapper = this.d3Service.d3.select(this.target);

          // Rect
          rectD3Wrapper.attr('opacity', 0.9);

          this.hideTooltip();
        }
      });

    // grid system
    this.chart.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(100, 0)`)
      .style('opacity', 1)
      .call(this.d3Service.d3.axisLeft()
        .scale(this.barchartProps.y)
        .tickSize(-this.barchartProps.width, 10)
        .tickFormat(''));

    // text
    this.svgElement.append('text')
      .attr('x', -(this.barchartProps.height / 2) - this.barchartProps.margin)
      .attr('y', this.barchartProps.margin)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .style('fill', '#657ba0')
      .style('font-size', '20px')
      .text('Occurence');

    this.svgElement.append('text')
      .attr('x', this.barchartProps.width / 2 + this.barchartProps.margin)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .style('fill', '#657ba0')
      .style('font-size', '24px')
      .text('Occurrences des longueurs de 10 000 000 de mots de passes');

    this.svgElement.append('text')
      .attr('transform', `translate(${this.barchartProps.width / 2 + this.barchartProps.margin}, ${this.barchartProps.height + 120})`)
      .attr('text-anchor', 'middle')
      .style('fill', '#657ba0')
      .style('font-size', '20px')
      .text('Longueur');

    this.addOutsiderInfoData();
  }

  private addOutsiderInfoData(): void {
    this.svgElement.append('text')
      .attr('x', this.barchartProps.width - 120)
      .attr('y', this.barchartProps.height + 155)
      .style('fill', '#657ba0')
      .style('font-size', '12px')
      .text('Données exclues');

    this.svgElement.append('text')
      .attr('x', this.barchartProps.width)
      .attr('y', this.barchartProps.height + 155)
      .style('fill', '#657ba0')
      .style('font-size', '12px')
      .text('Longueur de 1: utilisé 2 fois');

    this.svgElement.append('text')
      .attr('x', this.barchartProps.width)
      .attr('y', this.barchartProps.height + 170)
      .style('fill', '#657ba0')
      .style('font-size', '12px')
      .text('Longueur de 2: utilisé 3 fois');

    this.svgElement.append('text')
      .attr('x', this.barchartProps.width)
      .attr('y', this.barchartProps.height + 185)
      .style('fill', '#657ba0')
      .style('font-size', '12px')
      .text('Longueur de 3: utilisé 5944 fois');
  }

  private getTooltipText(d: any): string {
    return `<strong>Occurrences:</strong> ${this.d3Service.getFormattedNumber(d.occurrence)}`;
  }

  private showTooltip(d: any): void {
    const rect = this.target.getBoundingClientRect();
    const hostElem = this.barchartElement.nativeElement.getBoundingClientRect();
    const tooltip = document.getElementById('password-length-tooltip').getBoundingClientRect();
    this.tooltip.style('left', () => {
      const offset = 24 / 2;
      const x = rect.left + rect.width / 2 - tooltip.width / 2 - offset;
      return `${x}px`;
    }).style('top', () => {
      const padding = 10;
      const y = rect.top - hostElem.top - tooltip.height - padding;
      return `${y}px`;
    });
    this.tooltip.transition()
      .duration(200)
      .style('opacity', .9);
    this.tooltip.html(this.getTooltipText(d));
  }

  private hideTooltip(): void {
    this.tooltip.transition()
      .duration(500)
      .style('opacity', 0);
  }
}

import { Component, OnInit, ElementRef, AfterViewInit, ViewChild, Input, ChangeDetectionStrategy } from '@angular/core';
import { ScrollRefService } from 'src/app/core/services/scroll-ref.service';
import { KeyboardCombination } from 'src/app/shared/models/keyboard-combination';
import { D3Service } from 'src/app/core/services/d3.service';
import { PreProcessService } from 'src/app/core/services/pre-process.service';

interface ChartPropreties {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleBand<string>;
  xAxis: d3.Axis<string>;
  yAxis: d3.Axis<number>;
  color: d3.ScaleOrdinal<number, string>;
}

@Component({
  selector: 'pp-keyboard-combinations-heatmap',
  templateUrl: './keyboard-combinations-heatmap.component.html',
  styleUrls: ['./keyboard-combinations-heatmap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeyboardCombinationsHeatmapComponent implements OnInit, AfterViewInit {

  @ViewChild('firstChart') private scrollReference: ElementRef;
  @ViewChild('heatmap') private heatmapElement: ElementRef;
  @Input() private data: KeyboardCombination[];
  private svgElement: any;
  private chartProps: ChartPropreties = {x: undefined, y: undefined, xAxis: undefined, yAxis: undefined, color: undefined};
  private keyboard: string[][];
  private alphabet: string[];
  private matrix: any;
  private keyboardProps:  {keyWidth: number, keyHeight: number, xKey: number, yKey: number} =
                          {keyWidth: 40, keyHeight: 40, yKey: 150, xKey: 125};
  private barChartPos: {x: number, y: number} = {x: 625, y: 135};

  constructor(private scrollRefService: ScrollRefService,
              private d3Service: D3Service,
              private preProcessService: PreProcessService) { }

  ngOnInit() {
    this.preProcessService.convertNumbers(this.data, ['count']);
    this.formatData();
  }

  public ngAfterViewInit(): void {
    this.scrollRefService.scrollElement = this.scrollReference;
  }

  private formatData(): void {
    this.createMatrix();
    this.initialize();
    this.createChart();
  }

  private createMatrix(): void {
    this.keyboard = [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    this.alphabet = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

    /* CRÉATION DE LA MATRICE */
    this.matrix = [];

    for (let j = 0; j < this.alphabet.length; j++) {
      const row = [];
      let i = 0;
      for (i = 0; i < this.alphabet.length; i++) {
        row.push(0);
      }
      this.matrix.push(row);
    }

    this.data.forEach((d: KeyboardCombination) => {
      const line = this.alphabet.indexOf(d.combination[0]);
      const col = this.alphabet.indexOf(d.combination[1]);
      this.matrix[line][col] = d.count;
    });
  }

  /* CALCUL DU TOTAL D'UNE LIGNE */
  private totalRow(index: number): number {
    let total = 0;
    this.matrix[index].forEach((c: number) => {
      total += c;
    });
    return total;
  }

  private initialize(): void {
    /* ÉCHELLE DE COULEUR */
    this.chartProps.color = this.d3Service.d3.scaleLinear()
      .range(['#FFFFFF', '#FF0000']);

    /* AXES */
    const barChartHeight = 200;
    const barChartLength = 300;
    const keyboardWidth = 950;
    const keyboardHeight = 400;

    this.chartProps.x = this.d3Service.d3.scaleLinear().range([0, barChartLength]);

    this.chartProps.y = this.d3Service.d3.scaleBand().range([0, barChartHeight]);

    this.chartProps.xAxis = this.d3Service.d3.axisTop(this.chartProps.x).ticks(4).tickSizeOuter(0);
    this.chartProps.yAxis = this.d3Service.d3.axisLeft(this.chartProps.y).tickSizeOuter(0);

    this.svgElement = this.d3Service.d3.select(this.heatmapElement.nativeElement)
      .append('svg')
      .attr('width', keyboardWidth)
      .attr('height', keyboardHeight);
  }

  /* CALCUL DES DOMAINES */
  private updateDomain(sum: number, index: number): [number[], string[]] {
    const row: number[] = this.matrix[index];
    const unsorted: number[] = [];
    row.forEach(d => {
      unsorted.push(d);
    });

    const sorted: number[] = [];
    row.forEach(d => {
      sorted.push(d);
    });
    sorted.sort(this.d3Service.d3.descending);

    const top5: number[] = [];
    for (let i = 0; i < 5 ; i++) {
      top5.push(sorted[i]);
    }

    const indices: number[] = [];
    top5.forEach(d => {
      indices.push(unsorted.indexOf(d));
    });

    const yDomain: string[] = [];
    indices.forEach(d => {
      yDomain.push(this.alphabet[index] + this.alphabet[d]);
    });

    const minRatio = Math.min(...row) / sum;
    const maxRatio = Math.max(...row) / sum;

    const min = Math.min(...row);
    const max = Math.max(...row);

    this.chartProps.color.domain([minRatio, maxRatio]);
    this.chartProps.x.domain([min, max]);
    this.chartProps.y.domain(yDomain);

    return [top5, yDomain];
  }

  /* CALCUL DE LA CARTE DE CHALEUR */
  private heatMap(character: string): void {
    const lower = character.toLowerCase();
    const index = this.alphabet.indexOf(lower);
    const sum = this.totalRow(index);

    this.updateDomain(sum, index);

    for (let i = 0; i < 4; i++) {
      this.svgElement.select(`#row${i}`).remove();
      this.d3Service.d3.select(`#rowText${i}`).remove();
    }

    this.svgElement.selectAll('rect.key')
      .data(this.keyboard)
      .enter()
      .append('g')
      .attr('id', (d: string[], i: number) => `row${i}`)
      .each((d: string[], i: number) => {
        this.d3Service.d3.select(`#row${i}`)
        .selectAll('rect')
        .data(d)
        .enter()
        .append('rect')
        .attr('class', 'key')
        .attr('width', (k: string) => k === character ? this.keyboardProps.keyWidth - 3 : this.keyboardProps.keyWidth)
        .attr('height', (k: string) => k === character ? this.keyboardProps.keyHeight - 3 : this.keyboardProps.keyHeight)
        .attr('x', (k: string, j: number) => k === character  ? this.keyboardProps.xKey + 2 + i * 20 + j * (this.keyboardProps.keyWidth + 3)
                                                              : this.keyboardProps.xKey + i * 20 + j * (this.keyboardProps.keyWidth + 3))
        .attr('y', (k: string, j: number) => k === character  ? this.keyboardProps.yKey + 1 + i * (this.keyboardProps.keyHeight + 3)
                                                              : this.keyboardProps.yKey + i * (this.keyboardProps.keyHeight + 3))
        .attr('stroke-width', (k: string) => k === character ? 1.2 : 1)
        .attr('fill', (k: string) => {
          const lettre = k.toLowerCase();
          const indice = this.alphabet.indexOf(lettre);
          if (indice !== -1) {
            const value = this.matrix[index][indice];
            const shade = value / sum;
            return this.chartProps.color(shade);
          }
          else {
            return 'white';
          }
        })
        .attr('stroke', (k: string) => this.alphabet.indexOf(k.toLowerCase()) !== -1 ? 'black' : '#C0C0C0')
        .on('click', (e: string) => {
          this.heatMap(e);
          this.barChart(e);
        });
      });

    this.svgElement.selectAll('text.key')
      .data(this.keyboard)
      .enter()
      .append('g')
      .attr('id', (d: string[], i: number) => `rowText${i}`)
      .each((d: string[], i: number) => {
        this.d3Service.d3.select(`#rowText${i}`)
          .selectAll('text')
          .data(d)
          .enter()
          .append('text')
          .attr('x', (k: string, j: number) => k === character
              ? this.keyboardProps.xKey + 2 + 3 + i * 20 + j * (this.keyboardProps.keyWidth + 3)
              : this.keyboardProps.xKey + 3 + i * 20 + j * (this.keyboardProps.keyWidth + 3))
          .attr('y', (k: string, j: number) => k === character  ? this.keyboardProps.yKey + 2 + 15 + i * (this.keyboardProps.keyHeight + 3)
                                                                : this.keyboardProps.yKey + 15 + i * (this.keyboardProps.keyHeight + 3))
          .text((k: string) => k)
          .attr('fill', (k: string) => this.alphabet.indexOf(k.toLowerCase()) !== -1 ? 'black' : '#C0C0C0');
        });
  }

  /* BAR CHART */
  private barChart(character: string): void {
    const index = this.alphabet.indexOf(character.toLowerCase());
    const [top5, yDomain]: [number[], string[]] = this.updateDomain(this.totalRow(index), index);

    this.svgElement.selectAll('rect.bars')
      .data(top5)
      .transition()
      .duration(1000)
      .attr('x', () => this.barChartPos.x + 1)
      .attr('y', (d: number, i: number) => this.barChartPos.y + this.chartProps.y.step() / 4 + this.chartProps.y(yDomain[i]))
      .attr('width', (d: number) => this.chartProps.x(d))
      .attr('height', () => this.chartProps.y.step() / 2)
      .attr('fill', (d: number) => this.chartProps.color(d / this.totalRow(index)));

    this.svgElement.selectAll('rect.bars')
      .select('title')
      .data(top5)
      .text((d: number) => d);

    this.svgElement.select('.xAxis')
      .transition()
      .duration(1000)
      .call(this.chartProps.xAxis);

    this.svgElement.select('.yAxis')
      .transition()
      .duration(1000)
      .call(this.chartProps.yAxis);
  }

  public createChart(): void {

    /* INITIALISATION DU CLAVIER SVG*/
    this.heatMap('A');

    /* INITIALISATION DU BAR CHART */
    const barChart = this.svgElement.append('g')
      .attr('class', 'barChartRegion');

    barChart.append('g')
      .attr('class', 'xAxis')
      .attr('transform', `translate(${this.barChartPos.x}, ${this.barChartPos.y})`)
      .call(this.chartProps.xAxis);

    barChart.append('g')
      .attr('class', 'yAxis')
      .attr('transform', `translate(${this.barChartPos.x}, ${this.barChartPos.y})`)
      .call(this.chartProps.yAxis);

    const [top5, yDomain]: [number[], string[]] = this.updateDomain(this.totalRow(0), 0);

    barChart.append('text')
      .attr('class', 'barChartTitle')
      .attr('x', () => this.barChartPos.x + 10)
      .attr('y', () => this.barChartPos.y - 35)
      .text('Combinaisons les plus communes');

    barChart.selectAll('rect.bars')
      .data(top5)
      .enter()
      .append('rect')
      .attr('class', 'bars')
      .attr('x', () => this.barChartPos.x + 1)
      .attr('y', (d: number, i: number) => this.barChartPos.y + this.chartProps.y.step() / 4 + this.chartProps.y(yDomain[i]))
      .attr('width', (d: number) => this.chartProps.x(d))
      .attr('height', () => this.chartProps.y.step() / 2)
      .attr('fill', (d: number) => this.chartProps.color(d / this.totalRow(0)))
      .append('title')
      .text((d: number) => d);
  }

}

import { Component, OnInit, Input, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { KeyboardOccurrence } from 'src/app/shared/models/keyboard-occurrence';
import { D3Service } from 'src/app/core/services/d3.service';
import { PreProcessService } from 'src/app/core/services/pre-process.service';
import d3Tip from 'd3-tip';

interface HeatmapPropreties {
  color: d3.ScaleLinear<string, string>;
  keyboardX: number;
  keyboardY: number;
  keyWidth: number;
  keyHeight: number;
}

type OccurrenceType = 'letters' | 'numbers' | 'specialChars';

@Component({
  selector: 'pp-keyboard-occurrences-heatmap',
  templateUrl: './keyboard-occurrences-heatmap.component.html',
  styleUrls: ['./keyboard-occurrences-heatmap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeyboardOccurrencesHeatmapComponent implements OnInit {

  @Input() private data: [KeyboardOccurrence[], KeyboardOccurrence[], KeyboardOccurrence[]];
  @ViewChild('heatmap') private heatmapElement: ElementRef;
  private lettersData: KeyboardOccurrence[];
  private numbersData: KeyboardOccurrence[];
  private specialcharactersData: KeyboardOccurrence[];
  private svgLettersElement: any;
  private svgNumbersElement: any;
  private svgSpecialcharactersElement: any;
  private tooltip: any;
  private heatmapProps: HeatmapPropreties = {color: undefined, keyWidth: 40, keyHeight: 40, keyboardX: 50, keyboardY: 140};
  private keyboard: string[][];
  private lettersMatrix: KeyboardOccurrence[][];
  private numbersMatrix: KeyboardOccurrence[][];
  private specialCharsMatrix: KeyboardOccurrence[][];

  constructor(private d3Service: D3Service,
              private preprocesservice: PreProcessService) { }

  ngOnInit() {
    this.lettersData = this.data[0];
    this.numbersData = this.data[1];
    this.specialcharactersData = this.data[2];

    this.preprocesservice.convertNumbers(this.lettersData, ['occurrence']);
    this.preprocesservice.convertNumbers(this.numbersData, ['occurrence']);
    this.preprocesservice.convertNumbers(this.specialcharactersData, ['occurrence']);

    this.formatData();
    this.initialize();

    this.createLettersKeyboard();
    this.createNumbersKeyboard();
    this.createSpecialCharsKeyboard();
  }

  private formatData(): void {
    this.keyboard = [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];
  }

  private createMatrix(type: OccurrenceType): [number, number] {
    let max = 0;
    let min = 100000000000;
    if (type !== 'specialChars') {
      this[`${type}Matrix`] = [];

      this.keyboard.forEach(row => {
        const row_occ = [];
        row.forEach(key => {
          this[`${type}Data`].forEach(element => {
            if (element.character === key) {
              if (max < element.occurrence) {
                max = element.occurrence;
              }
              if (min > element.occurrence && element.occurrence !== 0) {
                min = element.occurrence;
              }
              row_occ.push(element);
            }
          });
        });
        this[`${type}Matrix`].push(row_occ);
      });
    }
    else {
      this[`${type}Matrix`] = [];
      let counter = 0;
      let row_occ = [];

      this.specialcharactersData.forEach(element => {
        if (max < element.occurrence) {
          max = element.occurrence;
        }
        if (min > element.occurrence && element.occurrence !== 0) {
            min = element.occurrence;
        }
        row_occ.push(element);
        // counter++;
        if (++counter === 12) {
            counter = 0;
            this[`${type}Matrix`].push(row_occ);
            row_occ = [];
        }
      });
    }

    return [min, max];
  }

  private initialize(): void {
    const keyboardHeight = 350;
    const keyboardWidth = 620;

    this.svgLettersElement = this.d3Service.d3.select(this.heatmapElement.nativeElement)
      .append('svg')
      .attr('width', keyboardWidth)
      .attr('height', keyboardHeight);

    this.svgNumbersElement = this.d3Service.d3.select(this.heatmapElement.nativeElement)
      .append('svg')
      .attr('width', keyboardWidth)
      .attr('height', keyboardHeight);

    this.svgSpecialcharactersElement = this.d3Service.d3.select(this.heatmapElement.nativeElement)
      .append('svg')
      .attr('width', keyboardWidth)
      .attr('height', keyboardHeight);

    const colorRange = ['#f7fcf0', '#084081'];
    this.heatmapProps.color = this.d3Service.d3.scaleLinear()
      .range(colorRange);

    // Define the div for the tooltip
    this.tooltip = this.d3Service.d3.select(this.heatmapElement.nativeElement).append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
  }

  public createLettersKeyboard(): void {
    const [min, max] = this.createMatrix('letters');
    this.heatmapProps.color.domain([min, max]);
    this.createHeatmap('letters', this.svgLettersElement, this.keyboard, this.lettersMatrix);
    this.addLegend(this.svgLettersElement, min, max);
  }

  public createNumbersKeyboard(): void {
    const [min, max] = this.createMatrix('numbers');
    this.heatmapProps.color.domain([min, max]);
    this.createHeatmap('numbers', this.svgNumbersElement, this.keyboard, this.numbersMatrix);
    this.addLegend(this.svgNumbersElement, min, max);
  }

  public createSpecialCharsKeyboard(): void {
    const [min, max] = this.createMatrix('specialChars');
    this.heatmapProps.color.domain([min, max]);
    this.createHeatmap('specialChars', this.svgSpecialcharactersElement, [], this.specialCharsMatrix);
    this.addLegend(this.svgSpecialcharactersElement, min, max);
  }

  /**
   * Create the heat map and fill colors
   * @param svg svg group
   * @param keyboard keyboard table
   * @param matrix the data
   * @param color the color domain
   */
  public createHeatmap(type: OccurrenceType, svg: any, keyboard: string[][], matrix: KeyboardOccurrence[][]): void {
    const _this = this;
    svg.selectAll('rect')
      .data(matrix)
      .enter()
      .append('g')
      .each(function (row: KeyboardOccurrence[], i: number) {
        _this.d3Service.d3.select(this)
          .selectAll('rect')
          .data(row)
          .enter()
          .append('rect')
          .attr('class', 'rect')
          .attr('fill', (d: KeyboardOccurrence) => d.occurrence !== 0 ? _this.heatmapProps.color(d.occurrence) : 'grey')
          .attr('width', _this.heatmapProps.keyWidth)
          .attr('height', _this.heatmapProps.keyHeight)
          .attr('x', (d: KeyboardOccurrence, j: number) => _this.heatmapProps.keyboardX + i * 20 + j * (_this.heatmapProps.keyWidth + 3))
          .attr('y', () => _this.heatmapProps.keyboardY + i * (_this.heatmapProps.keyHeight + 3))
          .attr('stroke', 'black')
          .style('opacity', 0.8)
          .on('mouseover', function(d: KeyboardOccurrence, j: number) {
            if (d.occurrence > 0) {
              this.dataset.previousX = this.x.baseVal.valueAsString;
              this.dataset.previousY = this.y.baseVal.valueAsString;

              _this.d3Service.d3.select(this)
                .attr('width', () => _this.heatmapProps.keyWidth - 4)
                .attr('height', () => _this.heatmapProps.keyHeight - 4)
                .attr('x', this.x.baseVal.value + 2)
                .attr('y', this.y.baseVal.value + 2);

              _this.d3Service.d3.select(`#${type}-text${i}-${j}`)
                .attr('x', function() {
                  return this.x.baseVal[0].value + 2;
                })
                .attr('y', function() {
                  return this.y.baseVal[0].value + 2;
                });
              _this.showTooltip(d);
            }
          })
          .on('mouseout', function(d: KeyboardOccurrence, j: number) {
            if (this.dataset.previousX && this.dataset.previousY) {
              _this.d3Service.d3.select(this)
                .attr('width', () => _this.heatmapProps.keyWidth)
                .attr('height', () => _this.heatmapProps.keyHeight)
                .attr('x', this.dataset.previousX)
                .attr('y', this.dataset.previousY);

              _this.d3Service.d3.select(`#${type}-text${i}-${j}`)
                .attr('x', function() {
                  return this.x.baseVal[0].value - 2;
                })
                .attr('y', function() {
                  return this.y.baseVal[0].value - 2;
                });
              _this.hideTooltip(d);
            }
          });
      });

    // map text
    svg.selectAll('text')
      .data(type !== 'specialChars' ? keyboard : matrix)
      .enter()
      .append('g')
      .each(function (row: string[] | KeyboardOccurrence[], i: number) {
        _this.d3Service.d3.select(this)
          .selectAll('text')
          .data(row)
          .enter()
          .append('text')
          .attr('id', (d: string, j: number) => `${type}-text${i}-${j}`)
          .attr('class', 'letters')
          .attr('x', (d: string, j: number) => _this.heatmapProps.keyboardX + 3 + i * 20 + j * (_this.heatmapProps.keyWidth + 3))
          .attr('y', () => _this.heatmapProps.keyboardY + 15 + i * (_this.heatmapProps.keyHeight + 3))
          .text((d: string | KeyboardOccurrence) => typeof d === 'string' ? d : d.character)
          .attr('fill', 'black');
      });
  }

  private getTooltipText(d: KeyboardOccurrence): string {
    return `<strong>Occurrences:</strong> ${this.d3Service.getFormattedNumber(d.occurrence)}`;
  }

  private showTooltip(d: KeyboardOccurrence): void {
    const rect = this.d3Service.d3.event.target.getBoundingClientRect();
    const hostElem = this.heatmapElement.nativeElement.getBoundingClientRect();
    const tooltip = document.getElementsByClassName('tooltip')[0].getBoundingClientRect();
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

  private hideTooltip(d: KeyboardOccurrence): void {
    this.tooltip.transition()
      .duration(500)
      .style('opacity', 0);
  }

  /**
   * Create the heatmap legend
   * @param svg     svg group
   * @param min     minimum value
   * @param max     maximum value
   */
  private addLegend(svg: any, min: number, max: number): void {
    // legend
    const w = 400, h = 50;

    const text = svg.append('text')
      .text(`Intervalle d'occurrence de ${this.d3Service.getFormattedNumber(min)} à ${this.d3Service.getFormattedNumber(max)}`)
      .attr('dy', '1em')
      .attr('fill', '#1E60AE');

    const key = svg
      .append('g')
      .attr('width', w)
      .attr('height', h);

    const legend = key.append('defs')
      .append('g:linearGradient')
      .attr('id', 'gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '100%')
      .attr('y2', '100%')
      .attr('spreadMethod', 'pad');

    legend.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#f7fcf0')
        .attr('stop-opacity', 0.8);

    legend.append('stop')
      .attr('offset', '33%')
      .attr('stop-color', '#bae4bc')
      .attr('stop-opacity', 0.8);

    legend.append('stop')
      .attr('offset', '66%')
      .attr('stop-color', '#7bccc4')
      .attr('stop-opacity', 0.8);

    legend.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#084081')
      .attr('stop-opacity', 0.8);

    key.append('rect')
      .attr('width', w)
      .attr('height', h - 30)
      .style('fill', 'url(#gradient)')
      .attr('transform', 'translate(10,20)');

    svg.append('rect')
      .attr('x', 0)
      .attr('y', 89)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', 'grey');

    svg.append('text')
      .text('Ces caratères ne sont pas pris en compte dans ce contexte ')
      .attr('x', 25)
      .attr('y', 105)
      .attr('fill', 'grey');

    const y = this.d3Service.d3.scaleLinear()
      .range([w, 0])
      .domain([max, min]);

    const yAxis = this.d3Service.d3.axisBottom()
      .scale(y)
      .ticks(3);

    key.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(10,40)')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)');
  }
}

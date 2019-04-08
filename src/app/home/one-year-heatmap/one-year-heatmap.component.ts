import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { D3Service } from 'src/app/core/services/d3.service';
import { PreProcessService } from 'src/app/core/services/pre-process.service';

interface CalendarProperties {
  color: d3.ScaleLinear<string, string>;
  caseWidth: number;
  caseHeight: number;
  colorRange: string[];
}

@Component({
  selector: 'pp-one-year-heatmap',
  templateUrl: './one-year-heatmap.component.html',
  styleUrls: ['./one-year-heatmap.component.scss']
})
export class OneYearHeatmapComponent implements OnInit {

  @Input() private data: any;
  @ViewChild('heatmap') private heatmapElement: ElementRef;
  private svgElement: any;
  private tooltip: any;
  private target: any;
  private calendarProps: CalendarProperties =
    { color: undefined, caseWidth: 25, caseHeight: 25, colorRange: [] };
  private monthsMatrix: any[][];

  constructor(private d3Service: D3Service,
              private preProcessService: PreProcessService) { }

  ngOnInit() {
    this.preProcessService.convertNumbers(this.data, ['dd', 'mm', 'occurrence']);

    this.initialize();
    this.createMonthsHeatmap();
  }

  private createMatrix(): [number, number] {
    let max = 0;
    let min = 100000000000;
    let row_counter = 1;
    let row_occ = [];
    this.monthsMatrix = [];
    this.data.forEach(element => {
      if (max < element.occurrence) {
          max = element.occurrence;
      }
      if (min > element.occurrence && element.occurrence !== 0) {
          min = element.occurrence;
      }
      row_occ.push(element);
      if ((element.mm === 1 ||
          element.mm === 3 ||
          element.mm === 5 ||
          element.mm === 7 ||
          element.mm === 8 ||
          element.mm === 10 ||
          element.mm === 12) && row_counter === 31) {
          this.monthsMatrix.push(row_occ);
          row_counter = 0;
          row_occ = [];
      }
      if (element.mm === 2 && row_counter === 29) {
          this.monthsMatrix.push(row_occ);
          row_counter = 0;
          row_occ = [];
      }
      if ((element.mm === 4 ||
          element.mm === 6 ||
          element.mm === 9 ||
          element.mm === 11) && row_counter === 30) {
          this.monthsMatrix.push(row_occ);
          row_counter = 0;
          row_occ = [];
      }
      row_counter++;
    });

    return [min, max];
  }

  private initialize(): void {
    const width = 800;
    const height = 550;

    this.svgElement = this.d3Service.d3.select(this.heatmapElement.nativeElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    this.calendarProps.colorRange = ['#ffffff', '#084081'];
    this.calendarProps.color = this.d3Service.d3.scaleLinear()
      .range(this.calendarProps.colorRange);

    const [min, max] = this.createMatrix();
    this.calendarProps.color.domain([min, max]);
    this.addLegend(this.svgElement, min, max, 0, 20);

    // Define the div for the tooltip
    this.tooltip = this.d3Service.d3.select(this.heatmapElement.nativeElement).append('div')
      .attr('id', 'one-year-tooltip')
      .attr('class', 'tooltip')
      .style('opacity', 0);
  }

  public createMonthsHeatmap(): void {
    let xPos = 0;
    let xPosTxt = 0;
    const _this = this;
    this.svgElement.selectAll('rect.one-year-rects')
      .data(this.monthsMatrix)
      .enter()
      .append('g')
      .each(function (row, i) {
        _this.d3Service.d3.select(this)
          .selectAll('rect')
          .data(row)
          .enter()
          .append('rect')
          .attr('class', 'one-year-rects')
          .attr('id', (d: string, j: number) => `one-year-rect${i}-${j}`)
          .attr('fill', (d) => _this.calendarProps.color(d.occurrence))
          .attr('width', _this.calendarProps.caseWidth)
          .attr('height', _this.calendarProps.caseHeight)
          .attr('y', function (d, j) {
            if (d.mm < 7) {
              if ((j % 7) === 0) {
                if (j !== 0) {
                  xPos++;
                }
                _this.d3Service.d3.select(this).attr('x', () =>
                  xPos * _this.calendarProps.caseWidth + i * (_this.calendarProps.caseWidth + 10));
                return 100;
              }
              else if ((j % 7) > 0) {
                _this.d3Service.d3.select(this).attr('x', () =>
                  xPos * _this.calendarProps.caseWidth + i * (_this.calendarProps.caseWidth + 10));
                return 100 + (j % 7) * _this.calendarProps.caseHeight;
              }
            }
            else {
              if (j === 0 && d.mm === 7 && d.dd !== 31) {
                  xPos = 0;
              }
              if ((j % 7) === 0) {
                if (j !== 0) {
                    xPos++;
                }
                _this.d3Service.d3.select(this).attr('x', () =>
                  xPos * _this.calendarProps.caseWidth + (i - 6) * (_this.calendarProps.caseWidth + 10));
                return 320;
              }
              else if ((j % 7) > 0) {
                _this.d3Service.d3.select(this).attr('x', () =>
                  xPos * _this.calendarProps.caseWidth + (i - 6) * (_this.calendarProps.caseWidth + 10));
                return 320 + (j % 7) * _this.calendarProps.caseHeight;
              }
            }
          })
          .attr('stroke', 'white')
          .style('opacity', 0.8);

        _this.d3Service.d3.select(this)
          .selectAll('text')
          .data(row)
          .enter()
          .append('text')
          .attr('id', (d: string, j: number) => `one-year-text${i}-${j}`)
          .attr('class', 'date')
          .attr('fill', 'black')
          .attr('y', function (d, j) {
            if (d.mm < 7) {
              if ((j % 7) === 0) {
                if (j !== 0) {
                  xPosTxt++;
                }
                _this.d3Service.d3.select(this).attr('x', () =>
                  xPosTxt * _this.calendarProps.caseWidth + i * (_this.calendarProps.caseWidth + 10) + _this.calendarProps.caseWidth / 4);
                return 116;
              }
              else if ((j % 7) > 0) {
                _this.d3Service.d3.select(this).attr('x', () =>
                  xPosTxt * _this.calendarProps.caseWidth + i * (_this.calendarProps.caseWidth + 10) + _this.calendarProps.caseWidth / 4);
                return 100 + (j % 7) * _this.calendarProps.caseHeight + 16;
              }
            }
            else {
              if (j === 0 && d.mm === 7 && d.dd !== 31) {
                xPosTxt = 0;
              }
              if ((j % 7) === 0) {
                if (j !== 0) {
                  xPosTxt++;
                }
                _this.d3Service.d3.select(this).attr('x', () =>
                  xPosTxt * _this.calendarProps.caseWidth + (i - 6) * (_this.calendarProps.caseWidth + 10)
                    + _this.calendarProps.caseWidth / 4);
                return 336;
              }
              else if ((j % 7) > 0) {
                _this.d3Service.d3.select(this).attr('x', () =>
                  xPosTxt * _this.calendarProps.caseWidth + (i - 6) * (_this.calendarProps.caseWidth + 10)
                    + _this.calendarProps.caseWidth / 4);
                return 320 + (j % 7) * _this.calendarProps.caseHeight + 16;
              }
            }
          })
          .text(function (d) {
              return d.dd;
          });
      })
      .on('mouseover', () => {
        this.target = this.d3Service.d3.event.path[0];
        if (this.target.nodeName === 'text') {
          this.target = this.d3Service.d3.event.fromElement;
        }
        const rectD3Wrapper = this.d3Service.d3.select(this.target);

        if (rectD3Wrapper.attr('id') && rectD3Wrapper.attr('id').split('rect')[1]) {
          const [strI, strJ] = rectD3Wrapper.attr('id').split('rect')[1].split('-');
          const [i, j] = [parseInt(strI, 10), parseInt(strJ, 10)];

          if (this.monthsMatrix[i][j].occurrence > 0) {
            // Rect
            rectD3Wrapper.attr('width', this.calendarProps.caseWidth - 4)
              .attr('height', this.calendarProps.caseHeight - 4)
              .attr('x', +rectD3Wrapper.attr('x') + 2)
              .attr('y', +rectD3Wrapper.attr('y') + 2)
              .attr('stroke', 'black')
              .attr('stroke-width', 2);

            this.showTooltip(this.monthsMatrix[i][j]);
          }
        }
      })
      .on('mouseout', () => {
        if (this.target) {
          const rectD3Wrapper = this.d3Service.d3.select(this.target);

          if (rectD3Wrapper.attr('id') && rectD3Wrapper.attr('id').split('rect')[1]) {
            const [strI, strJ] = rectD3Wrapper.attr('id').split('rect')[1].split('-');
            const [i, j] = [parseInt(strI, 10), parseInt(strJ, 10)];

            if (this.monthsMatrix[i][j].occurrence > 0) {
              // Rect
              rectD3Wrapper.attr('width', this.calendarProps.caseWidth)
                .attr('height', this.calendarProps.caseHeight)
                .attr('x', +rectD3Wrapper.attr('x') - 2)
                .attr('y', +rectD3Wrapper.attr('y') - 2)
                .attr('stroke', 'none');

              this.hideTooltip();
            }
          }
        }
      });

    this.addText();
  }

  private getTooltipText(d: any): string {
    return `<strong>Occurrences:</strong> ${this.d3Service.getFormattedNumber(d.occurrence)}`;
  }

  private showTooltip(d: any): void {
    const rect = this.target.getBoundingClientRect();
    const hostElem = this.heatmapElement.nativeElement.getBoundingClientRect();
    const tooltip = document.getElementById('one-year-tooltip').getBoundingClientRect();
    this.tooltip.style('left', () => {
      const offset = 24 / 2;
      const x = rect.left + rect.width / 2 - tooltip.width / 2 - offset;
      return `${x}px`;
    }).style('top', () => {
      const padding = 5;
      const y = rect.top - hostElem.top - tooltip.height + padding;
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

  private addLegend(svg: any, min: number, max: number, xPos: number, yPos: number): void {
    const w = 400, h = 50;
    svg.append('text')
      .attr('class', 'text legend')
      .text('Intervalle d\'occurrence de ' + min + ' à ' + max)
      .attr('dy', '0.35em')
      .attr('transform', 'translate(' + xPos + ',' + yPos + ')')
      .attr('fill', '#1E60AE');

    const key = svg.append('g')
      .attr('class', '#legend1')
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
      .attr('stop-color', '#EDEDED')
      .attr('stop-opacity', 0.8);

    legend.append('stop')
      .attr('offset', '33%')
      .attr('stop-color', '#8F9EAF')
      .attr('stop-opacity', 0.8);

    legend.append('stop')
      .attr('offset', '66%')
      .attr('stop-color', '#496381')
      .attr('stop-opacity', 0.8);

    legend.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#032853')
      .attr('stop-opacity', 0.8);

    key.append('rect')
      .attr('width', w)
      .attr('height', h - 30)
      .style('fill', 'url(#gradient)')
      .attr('transform', 'translate(' + (xPos + 10) + ',' + (yPos + 20) + ')');

    const y = this.d3Service.d3.scaleLinear()
      .range([w, 0])
      .domain([max, min]);

    const yAxis = this.d3Service.d3.axisBottom()
      .scale(y)
      .ticks(3);

    key.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + (xPos + 10) + ',' + (yPos + 40) + ')')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)');
  }

  private addText(): void {
    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Janvier')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(0, 285)')
      .attr('fill', '#1E60AE');

    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Fevrier')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(135, 285)')
      .attr('fill', '#1E60AE');

    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Mars')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(270, 285)')
      .attr('fill', '#1E60AE');

    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Avril')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(405, 285)')
      .attr('fill', '#1E60AE');

    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Mai')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(540, 285)')
      .attr('fill', '#1E60AE');

    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Juin')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(675, 285)')
      .attr('fill', '#1E60AE');

    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Juillet')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(0, 505)')
      .attr('fill', '#1E60AE');

    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Aout')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(135, 505)')
      .attr('fill', '#1E60AE');

    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Septembre')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(270, 505)')
      .attr('fill', '#1E60AE');

    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Octobre')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(405, 505)')
      .attr('fill', '#1E60AE');

    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Novembre')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(540, 505)')
      .attr('fill', '#1E60AE');

    this.svgElement.append('text')
      .attr('class', 'text month')
      .text('Decembre')
      .attr('dy', '0.35em')
      .attr('transform', 'translate(675, 505)')
      .attr('fill', '#1E60AE');
  }
}

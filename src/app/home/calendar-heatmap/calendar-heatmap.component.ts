import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { YearOccurrence } from 'src/app/shared/models/year-occurrence';
import { D3Service } from 'src/app/core/services/d3.service';
import { PreProcessService } from 'src/app/core/services/pre-process.service';
import * as moment from 'moment';

interface CalendarProperties {
  color: d3.ScaleLinear<string, string>;
  caseWidth: number;
  caseHeight: number;
  colorRange: string[];
  smallCaseWidth: number;
  smallCaseHeight: number;
}

@Component({
  selector: 'pp-calendar-heatmap',
  templateUrl: './calendar-heatmap.component.html',
  styleUrls: ['./calendar-heatmap.component.scss']
})
export class CalendarHeatmapComponent implements OnInit {

  @Input() private data: YearOccurrence[];
  @ViewChild('heatmap') private heatmapElement: ElementRef;
  private svgElement: any;
  private tooltip: any;
  private target: any;
  private monthTarget: any;
  private calendarProps: CalendarProperties =
    { color: undefined, caseWidth: 80, caseHeight: 30, colorRange: [], smallCaseWidth: 20, smallCaseHeight: 20 };
  private yearsMatrix: YearOccurrence[][];

  constructor(private d3Service: D3Service,
    private preProcessService: PreProcessService) { }

  ngOnInit() {
    this.preProcessService.convertNumbers(this.data, ['occurrence']);

    this.initialize();
    this.createYearsHeatMap();
    this.createCalendarHeatmap();
  }

  private createMatrix(): [number, number] {
    let max = 0;
    let min = 100000000000;
    let row_counter = 0;
    this.yearsMatrix = [];
    let row_occ = [];

    this.data.forEach(element => {
      if (max < element.occurrence) {
        max = element.occurrence;
      }
      if (min > element.occurrence && element.occurrence !== 0) {
        min = element.occurrence;
      }
      row_occ.push(element);
      row_counter++;
      if (row_counter === 12) {
        this.yearsMatrix.push(row_occ);
        row_counter = 0;
        row_occ = [];
      }
    });

    return [min, max];
  }

  private initialize(): void {
    const width = 950;
    const height = 750;

    this.svgElement = this.d3Service.d3.select(this.heatmapElement.nativeElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    this.calendarProps.colorRange = ['#EDEDED', '#032853'];
    this.calendarProps.color = this.d3Service.d3.scaleLinear()
      .range(this.calendarProps.colorRange);

    const [min, max] = this.createMatrix();
    this.calendarProps.color.domain([min, max]);
    this.addLegend(this.svgElement, min, max, 0, 90);

    // Define the div for the tooltip
    this.tooltip = this.d3Service.d3.select(this.heatmapElement.nativeElement).append('div')
      .attr('id', 'calendar-tooltip')
      .attr('class', 'tooltip')
      .style('opacity', 0);
  }

  public createYearsHeatMap(): void {
    const _this = this;
    this.svgElement.selectAll('rect.years-rects')
      .data(this.yearsMatrix)
      .enter()
      .append('g')
      .each(function (row: YearOccurrence[], i: number) {
        _this.d3Service.d3.select(this)
          .selectAll('rect')
          .data(row)
          .enter()
          .append('rect')
          .attr('id', (d: string, j: number) => `years-rect${i}-${j}`)
          .attr('class', 'years-rects')
          .attr('fill', (d: YearOccurrence) => _this.calendarProps.color(d.occurrence))
          .attr('width', _this.calendarProps.caseWidth)
          .attr('height', _this.calendarProps.caseHeight)
          .attr('x', (d: YearOccurrence, j: number) => j * _this.calendarProps.caseWidth)
          .attr('y', () => 250 + i * _this.calendarProps.caseHeight)
          .attr('stroke', 'white')
          .style('opacity', 0.8);

        _this.d3Service.d3.select(this)
          .selectAll('text')
          .data(row)
          .enter()
          .append('text')
          .attr('id', (d: string, j: number) => `text${i}-${j}`)
          .attr('x', (d: YearOccurrence, j: number) => j * _this.calendarProps.caseWidth + 18)
          .attr('y', () => 250 + i * _this.calendarProps.caseHeight + 20)
          .text((d: YearOccurrence) => d.year)
          .attr('fill', 'black');
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

          if (this.yearsMatrix[i][j].occurrence > 0) {
            // Rect
            rectD3Wrapper.attr('width', this.calendarProps.caseWidth - 4)
              .attr('height', this.calendarProps.caseHeight - 4)
              .attr('x', +rectD3Wrapper.attr('x') + 2)
              .attr('y', +rectD3Wrapper.attr('y') + 2)
              .attr('stroke', 'black')
              .attr('stroke-width', 2);

            this.showTooltip(this.yearsMatrix[i][j]);
          }
        }
      })
      .on('mouseout', () => {
        if (this.target) {
          const rectD3Wrapper = this.d3Service.d3.select(this.target);

          if (rectD3Wrapper.attr('id') && rectD3Wrapper.attr('id').split('rect')[1]) {
            const [strI, strJ] = rectD3Wrapper.attr('id').split('rect')[1].split('-');
            const [i, j] = [parseInt(strI, 10), parseInt(strJ, 10)];

            if (this.yearsMatrix[i][j].occurrence > 0) {
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
  }

  public createCalendarHeatmap(): void {
    let aYearSvg = this.d3Service.d3.select(this.heatmapElement.nativeElement)
      .append('svg');

    const years = this.svgElement.selectAll('rect');
    const _this = this;

    years.on('click', function (d: YearOccurrence) {
      aYearSvg.remove();

      aYearSvg = _this.d3Service.d3.select(_this.heatmapElement.nativeElement)
        .append('svg')
        .attr('width', 800)
        .attr('height', 1000)
        .attr('position', 'absolute');

      if (d.occurrence !== 0) {
        _this.d3Service.d3.csv('/data/donnees_traitees/years/' + d.year + '.csv').then(function (formatted_dates_data) {
          const selectedYearData = _this.getYearData(d.year, formatted_dates_data);
          let max = 0;
          let min = 100000000000;

          selectedYearData.forEach(element => {
              element.forEach(day => {
                if (max < day.occurrence) {
                  max = day.occurrence;
                }
                if (min > day.occurrence && day.occurrence !== 0) {
                    min = day.occurrence;
                }
            });
          });
          if (min === 100000000000) {
            min = 0;
          }
          _this.calendarProps.color.domain([min, max]);

          aYearSvg.selectAll('rect')
            .data(selectedYearData)
            .enter()
            .append('g')
            .each(function (row, i: number) {
              _this.d3Service.d3.select(this)
                .selectAll('rect')
                .data(row)
                .enter()
                .append('rect')
                .attr('id', (d2: string, j: number) => `months-rect${i}-${j}`)
                .attr('fill', (d2) => {
                  if (d2.occurrence !== 0) {
                    return _this.calendarProps.color(d2.occurrence);
                  } else {
                    return '#FFFFFF';
                  }
                })
                .attr('width', _this.calendarProps.smallCaseWidth)
                .attr('height', _this.calendarProps.smallCaseHeight)
                .attr('x', (d2, j: number) => {
                  if (j > 7 && j < 39) {
                    if (i < 3) {
                      return (d2.calendarPos * 28) + (i * 220) + 70;
                    }
                    else if (i < 6) {
                      return (d2.calendarPos * 28) + ((i - 3) * 220) + 70;
                    }
                    else if (i < 9) {
                      return (d2.calendarPos * 28) + ((i - 6) * 220) + 70;
                    }
                    else {
                      return (d2.calendarPos * 28) + ((i - 9) * 220) + 70;
                    }
                  }
                })
                .attr('y', (d2, j: number) => {
                  if (j > 7 && j < 39) {
                    if (i < 3) {
                      return d2.weekDay * 21 + 100;
                    }
                    else if (i < 6) {
                      return d2.weekDay * 21 + 300;
                    }
                    else if (i < 9) {
                      return d2.weekDay * 21 + 500;
                    }
                    else {
                      return d2.weekDay * 21 + 700;
                    }
                  }
                })
                .attr('stroke', 'black')
                .style('opacity', function (d2, j) {
                  if (j > 7 && j < 39) {
                    return 0.8;
                  } else {
                    return 0;
                  }
                });

              _this.d3Service.d3.select(this)
                .selectAll('text')
                .data(row)
                .enter()
                .append('text')
                .attr('id', (d2: string, j: number) => `dayText${i}-${j}`)
                .attr('x', function (d2, j: number) {
                  if (i < 3) {
                    return (d2.calendarPos * 28) + (i * 220) + 71;
                  }
                  else if (i < 6) {
                    return (d2.calendarPos * 28) + ((i - 3) * 220) + 71;
                  }
                  else if (i < 9) {
                    return (d2.calendarPos * 28) + ((i - 6) * 220) + 71;
                  }
                  else {
                    return (d2.calendarPos * 28) + ((i - 9) * 220) + 71;
                  }
                })
                .attr('y', function (d2, j: number) {
                  if (i < 3) {
                    if (j < 1) {
                      return 280;
                    } else {
                      return d2.weekDay * 21 + 115;
                    }
                  }
                  else if (i < 6) {
                    if (j < 1) {
                      return 480;
                    } else {
                      return d2.weekDay * 21 + 315;
                    }
                  }
                  else if (i < 9) {
                    if (j < 1) {
                      return 680;
                    } else {
                      return d2.weekDay * 21 + 515;
                    }
                  } else {
                    if (j < 1) {
                      return 880;
                    } else {
                      return d2.weekDay * 21 + 715;
                    }
                  }
                })
                .text(function (d2, j: number) {
                  if (j < 1) {
                    return d2.month;
                  }
                  if (j < 8) {
                    return d2.day;
                  } else {
                    if (j < 39) {
                      return j - 7;
                    }
                  }
                })
                .attr('fill', 'black');
            })
            .on('mouseover', () => {
              _this.monthTarget = _this.d3Service.d3.event.path[0];
              if (_this.monthTarget.nodeName === 'text') {
                _this.monthTarget = _this.d3Service.d3.event.fromElement;
              }
              const rectD3Wrapper = _this.d3Service.d3.select(_this.monthTarget);

              if (rectD3Wrapper.attr('id') && rectD3Wrapper.attr('id').split('rect')[1]) {
                const [strI, strJ] = rectD3Wrapper.attr('id').split('rect')[1].split('-');
                const [i, j] = [parseInt(strI, 10), parseInt(strJ, 10)];

                if (selectedYearData[i][j].occurrence > 0) {
                  // Rect
                  rectD3Wrapper.attr('width', _this.calendarProps.smallCaseWidth - 4)
                    .attr('height', _this.calendarProps.smallCaseHeight - 4)
                    .attr('x', +rectD3Wrapper.attr('x') + 2)
                    .attr('y', +rectD3Wrapper.attr('y') + 2)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2);

                  _this.showTooltip(selectedYearData[i][j], false);
                }
              }
            })
            .on('mouseout', () => {
              if (_this.monthTarget) {
                const rectD3Wrapper = _this.d3Service.d3.select(_this.monthTarget);

                if (rectD3Wrapper.attr('id') && rectD3Wrapper.attr('id').split('rect')[1]) {
                  const [strI, strJ] = rectD3Wrapper.attr('id').split('rect')[1].split('-');
                  const [i, j] = [parseInt(strI, 10), parseInt(strJ, 10)];

                  if (selectedYearData[i][j].occurrence > 0) {
                    // Rect
                    rectD3Wrapper.attr('width', _this.calendarProps.smallCaseWidth)
                      .attr('height', _this.calendarProps.smallCaseHeight)
                      .attr('x', +rectD3Wrapper.attr('x') - 2)
                      .attr('y', +rectD3Wrapper.attr('y') - 2)
                      .attr('stroke', 'none');

                    _this.hideTooltip();
                  }
                }
              }
            });

          _this.addLegend(aYearSvg, min, max, 0, 10);

          // Header
          const header = aYearSvg.append('g')
            .attr('transform', 'translate(520, 35)');

          // Title
          header.append('text')
            .text(`Année: ${d.year}`)
            .style('font-size', '20px');

          // Close button
          header.append('circle')
            .attr('class', 'close-button')
            .attr('cx', 150)
            .attr('cy', -5)
            .attr('r', 20)
            .style('fill', '#1E60AE');

          header.append('text')
            .attr('class', 'close-button')
            .text('x')
            .style('font-size', '20px')
            .attr('transform', 'translate(145, 0)')
            .attr('fill', 'white');

          const button = _this.d3Service.d3.selectAll('circle.close-button');
          button.on('click', () => {
            aYearSvg.remove();
          });
        });
      }
    });
  }

  private getYearData(selectedYear, formatted_dates_data): any {
    const year = [];
    const yearAgo = moment().startOf('year').subtract(2019 - (selectedYear), 'year').toDate();
    const yearAfter = moment().startOf('year').subtract(2018 - (selectedYear), 'year').toDate();
    const dateRange = ((this.d3Service.d3.time && this.d3Service.d3.time.days) || this.d3Service.d3.timeDays)(yearAgo, yearAfter);
    let month = [];
    let actualMonth = 'Janvier';
    month.push({ month: actualMonth, day: '', weekDay: 0, calendarPos: 0, occurrence: 0 });
    month.push({ month: actualMonth, day: 'Di', weekDay: 0, calendarPos: 0, occurrence: 0 });
    month.push({ month: actualMonth, day: 'Lu', weekDay: 1, calendarPos: 0, occurrence: 0 });
    month.push({ month: actualMonth, day: 'Ma', weekDay: 2, calendarPos: 0, occurrence: 0 });
    month.push({ month: actualMonth, day: 'Me', weekDay: 3, calendarPos: 0, occurrence: 0 });
    month.push({ month: actualMonth, day: 'Je', weekDay: 4, calendarPos: 0, occurrence: 0 });
    month.push({ month: actualMonth, day: 'Ve', weekDay: 5, calendarPos: 0, occurrence: 0 });
    month.push({ month: actualMonth, day: 'Sa', weekDay: 6, calendarPos: 0, occurrence: 0 });

    let monthCounter = 0;
    let dayCounter = 0;
    let dayYearCounter = 0;
    let day0 = 1;
    let day1 = 1;
    let day2 = 1;
    let day3 = 1;
    let day4 = 1;
    let day5 = 1;
    let day6 = 1;

    dateRange.forEach(day => {
      const counterTemp = day.getMonth();
      if (counterTemp === 0) {
        actualMonth = 'Janvier';
      } else if (counterTemp === 1) {
        actualMonth = 'Fevrier';
      } else if (counterTemp === 2) {
        actualMonth = 'Mars';
      } else if (counterTemp === 3) {
        actualMonth = 'Avril';
      } else if (counterTemp === 4) {
        actualMonth = 'Mai';
      } else if (counterTemp === 5) {
        actualMonth = 'Juin';
      } else if (counterTemp === 6) {
        actualMonth = 'Juillet';
      } else if (counterTemp === 7) {
        actualMonth = 'Aout';
      } else if (counterTemp === 8) {
        actualMonth = 'Septembre';
      } else if (counterTemp === 9) {
        actualMonth = 'Octobre';
      } else if (counterTemp === 10) {
        actualMonth = 'Novembre';
      } else if (counterTemp === 11) {
        actualMonth = 'Decembre';
      }

      if (counterTemp > monthCounter) {
        year.push(month);
        monthCounter = counterTemp;
        dayCounter = 0;
        month = [];
        day0 = 1;
        day1 = 1;
        day2 = 1;
        day3 = 1;
        day4 = 1;
        day5 = 1;
        day6 = 1;
        month.push({ month: actualMonth, day: '', weekDay: 0, calendarPos: 0, occurrence: 0 });
        month.push({ month: actualMonth, day: 'Di', weekDay: 0, calendarPos: 0, occurrence: 0 });
        month.push({ month: actualMonth, day: 'Lu', weekDay: 1, calendarPos: 0, occurrence: 0 });
        month.push({ month: actualMonth, day: 'Ma', weekDay: 2, calendarPos: 0, occurrence: 0 });
        month.push({ month: actualMonth, day: 'Me', weekDay: 3, calendarPos: 0, occurrence: 0 });
        month.push({ month: actualMonth, day: 'Je', weekDay: 4, calendarPos: 0, occurrence: 0 });
        month.push({ month: actualMonth, day: 'Ve', weekDay: 5, calendarPos: 0, occurrence: 0 });
        month.push({ month: actualMonth, day: 'Sa', weekDay: 6, calendarPos: 0, occurrence: 0 });
      }
      if (counterTemp === monthCounter) {
        dayCounter++;
        const weekDay = day.getDay();
        if (weekDay === 0) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day0, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day0++;
        } else if (weekDay === 1) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day1, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day1++;
        } else if (weekDay === 2) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day2, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day2++;
        } else if (weekDay === 3) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day3, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day3++;
        } else if (weekDay === 4) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day4, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day4++;
        } else if (weekDay === 5) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day5, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day5++;
        } else if (weekDay === 6) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day6, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day6++;
          if (day6 === 2) {
            if (day0 === 1) { day0++; }
            if (day1 === 1) { day1++; }
            if (day2 === 1) { day2++; }
            if (day3 === 1) { day3++; }
            if (day4 === 1) { day4++; }
            if (day5 === 1) { day5++; }
          }
        }
      }
      if (counterTemp === 11 && dayCounter === 31) {
        const weekDay = day.getDay();
        if (weekDay === 0) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day0, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day0++;
        } else if (weekDay === 1) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day1, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day1++;
        } else if (weekDay === 2) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day2, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day2++;
        } else if (weekDay === 3) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day3, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day3++;
        } else if (weekDay === 4) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day4, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day4++;
        } else if (weekDay === 5) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day5, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day5++;
        } else if (weekDay === 6) {
          month.push({
            month: actualMonth, day: dayCounter, weekDay: weekDay,
            calendarPos: day6, occurrence: formatted_dates_data[dayYearCounter].occurrence
          });
          day6++;
        }
        year.push(month);
      }
      dayYearCounter++;
    });
    return year;
  }

  private getTooltipText(d: YearOccurrence): string {
    return `<strong>Occurrences:</strong> ${this.d3Service.getFormattedNumber(d.occurrence)}`;
  }

  private showTooltip(d: YearOccurrence, onYearsCalendar: boolean = true): void {
    const rect = (onYearsCalendar ? this.target : this.monthTarget).getBoundingClientRect();
    const hostElem = this.heatmapElement.nativeElement.getBoundingClientRect();
    const tooltip = document.getElementById('calendar-tooltip').getBoundingClientRect();
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
}

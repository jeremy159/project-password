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
  private calendarProps: CalendarProperties =
    {color: undefined, caseWidth: 80, caseHeight: 30, colorRange: [], smallCaseWidth: 20, smallCaseHeight: 20};
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

    this.calendarProps.colorRange = ['#f7fcf0', '#084081'];
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
    this.svgElement.selectAll('rect')
      .data(this.yearsMatrix)
      .enter()
      .append('g')
      .each(function (row: YearOccurrence[], i: number) {
        _this.d3Service.d3.select(this)
          .selectAll('rect')
          .data(row)
          .enter()
          .append('rect')
          .attr('class', 'rect')
          .attr('fill', function (d: YearOccurrence) {
              return _this.calendarProps.color(d.occurrence);
          })
          .attr('width', _this.calendarProps.caseWidth)
          .attr('height', _this.calendarProps.caseHeight)
          .attr('x', (d: YearOccurrence, j: number) => j * _this.calendarProps.caseWidth)
          .attr('y', () => 250 + i * _this.calendarProps.caseHeight)
          .attr('stroke', 'white')
          .style('opacity', 0.8)
          .on('mouseover', function (d: YearOccurrence, j: number) {
            if (d.occurrence > 0) {
              // _this.d3Service.d3.select(this)
              //   .style('border', '2px, black solid');
              _this.showTooltip(d);
            }
          })
          .on('mouseout', function(d: YearOccurrence, j: number) {
            // _this.d3Service.d3.select(this)
              // .style('border', 'none');
            _this.hideTooltip(d);
          });
      });

  this.svgElement.selectAll('text')
      .data(this.yearsMatrix)
      .enter()
      .append('g')
      .each(function (row: YearOccurrence[], i: number) {
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
      });
  }

  public createCalendarHeatmap(): void {
    let aYearSvg = this.d3Service.d3.select(this.heatmapElement.nativeElement)
      .append('svg');

    const years = this.d3Service.d3.selectAll('rect.rect');
    const _this = this;
    years.on('mouseout', function () {
      _this.d3Service.d3.select(this)
        .attr('rect', 50)
        .style('opacity', 0.8)
        .attr('width', _this.calendarProps.caseWidth)
        .attr('height', _this.calendarProps.caseHeight)
        .style('cursor', 'default');
    });

    years.on('click', function (d: YearOccurrence) {
      aYearSvg.remove();

      aYearSvg = _this.d3Service.d3.select(_this.heatmapElement.nativeElement)
        .append('svg')
        .attr('width', 800)
        .attr('height', 1000)
        .attr('position', 'absolute');

      _this.d3Service.d3.select(this)
        .attr('width', _this.calendarProps.caseWidth - 4)
        .attr('height', _this.calendarProps.caseHeight - 4);
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
                    if (min > day.occurrence) {
                        min = day.occurrence;
                    }
                });
            });

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
                  .attr('class', 'rect')
                  .attr('fill', (d2) => _this.calendarProps.color(d2.occurrence))
                  .attr('width', 20)
                  .attr('height', 20)
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
                  })
                .on('mouseover', function (d2: any, j: number) {
                  if (d.occurrence > 0) {
                    this.dataset.previousX = this.x.baseVal.valueAsString;
                    this.dataset.previousY = this.y.baseVal.valueAsString;

                    _this.d3Service.d3.select(this)
                      .attr('width', () => _this.calendarProps.smallCaseWidth - 4)
                      .attr('height', () => _this.calendarProps.smallCaseHeight - 4)
                      .attr('x', this.x.baseVal.value + 2)
                      .attr('y', this.y.baseVal.value + 2);

                    _this.d3Service.d3.select(`#dayText${i}-${j}`)
                      .attr('x', function() {
                        return this.x.baseVal[0].value + 2;
                      })
                      .attr('y', function() {
                        return this.y.baseVal[0].value + 2;
                      });
                    _this.showTooltip(d2);
                  }
                })
                .on('mouseout', function(d2: any, j: number) {
                  if (this.dataset.previousX && this.dataset.previousY) {
                    _this.d3Service.d3.select(this)
                      .attr('width', () => _this.calendarProps.smallCaseWidth)
                      .attr('height', () => _this.calendarProps.smallCaseHeight)
                      .attr('x', this.dataset.previousX)
                      .attr('y', this.dataset.previousY);

                    _this.d3Service.d3.select(`#dayText${i}-${j}`)
                      .attr('x', function() {
                        return this.x.baseVal[0].value - 2;
                      })
                      .attr('y', function() {
                        return this.y.baseVal[0].value - 2;
                      });
                    _this.hideTooltip(d2);
                  }
                });
              });

            aYearSvg.selectAll('text')
                .data(selectedYearData)
                .enter()
                .append('g')
                .each(function (row, i: number) {
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
                });

            _this.addLegend(aYearSvg, min, max, 0, 10);

            aYearSvg.append('circle')
                .attr('class', 'but')
                .attr('cx', 650)
                .attr('cy', 30)
                .attr('r', 20)
                .style('fill', '#1E60AE')
                .style('opacity', 0.8);

            aYearSvg.append('text')
                .attr('class', 'but')
                .text('x')
                .style('font-size', '20px')
                .attr('transform', 'translate(645, 35)')
                .attr('fill', 'white');

            const button = _this.d3Service.d3.selectAll('circle');
            button.on('click', () => {
                aYearSvg.remove();
            });
            button.on('mouseover', function () {
              _this.d3Service.d3.select(this)
                    .style('opacity', 1)
                    .style('cursor', 'pointer');
            });
            button.on('mouseout', function () {
              _this.d3Service.d3.select(this).style('opacity', 0.8);
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
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day0, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day0++;
            } else if (weekDay === 1) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day1, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day1++;
            } else if (weekDay === 2) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day2, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day2++;
            } else if (weekDay === 3) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day3, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day3++;
            } else if (weekDay === 4) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day4, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day4++;
            } else if (weekDay === 5) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day5, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day5++;
            } else if (weekDay === 6) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day6, occurrence: formatted_dates_data[dayYearCounter].occurrence });
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
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day0, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day0++;
            } else if (weekDay === 1) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day1, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day1++;
            } else if (weekDay === 2) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day2, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day2++;
            } else if (weekDay === 3) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day3, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day3++;
            } else if (weekDay === 4) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day4, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day4++;
            } else if (weekDay === 5) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day5, occurrence: formatted_dates_data[dayYearCounter].occurrence });
                day5++;
            } else if (weekDay === 6) {
                month.push({ month: actualMonth, day: dayCounter, weekDay: weekDay,
                  calendarPos: day6, occurrence: formatted_dates_data[dayYearCounter].occurrence });
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

  private showTooltip(d: YearOccurrence): void {
    const rect = this.d3Service.d3.event.target.getBoundingClientRect();
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

  private hideTooltip(d: YearOccurrence): void {
    console.log('this.d3Service.d3.event.target', this.d3Service.d3.event.target.tagName);
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

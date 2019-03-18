import { Injectable } from '@angular/core';
import * as d3Instance from 'd3';

const frenchLocale = {
  'decimal': ',',
  'thousands': '',
  'grouping': [3],
  'currency': ['$', ''],
  'dateTime': '%a %b %e %X %Y',
  'date': '%d/%m/%Y',
  'time': '%H:%M:%S',
  'periods': ['AM', 'PM'],
  'days': ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  'shortDays': ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  'months': ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  'shortMonths': ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jui', 'août', 'sep', 'oct', 'nov', 'déc']
};

const customTimeFormat = [
  ['.%L', (d: any) => d.getMilliseconds()],
  [':%S', (d: any) => d.getSeconds()],
  ['%I:%M', (d: any) => d.getMinutes()],
  ['%I %p', (d: any) => d.getHours()],
  ['%d %b', (d: any) => d.getDate() !== 1],
  ['%B', (d: any) => d.getMonth()],
  ['%Y', () => true]
];

@Injectable({
  providedIn: 'root'
})
export class D3Service {

  get d3(): any {
    return d3Instance;
  }

  private locale = this.d3.timeFormatDefaultLocale(frenchLocale);

  public getFormattedDate(date: string): string {
    return this.locale.format(customTimeFormat.find((format: any) => format[1](date))[0])(date);
  }

  public getFormattedNumber(number: number): string {
    if (number % 1 !== 0) {
      number = parseInt(number.toFixed(2).replace('.', ','), 10);
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  public getFormattedPercent(percent: number | string): string {
    return this.d3.format('.1%')(percent).replace('.', ',');
  }

  public createAxes(g: any, xAxis: d3.Axis<any>, width: number, height: number, yAxis?: d3.Axis<any>, xTitle?: string, yTitle?: string) {
    // horizontal axe
    g.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    // x title
    if (xTitle) {
      g.append('text')
        .attr('transform', `translate(${width}, ${height})`)
        .attr('text-anchor', 'end')
        .text(xTitle);
    }

    if (yAxis) {
      // vertical axe
      g.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

      // y title
      if (yTitle) {
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -10)
          .attr('x', 18)
          .text(yTitle);
      }
    }
  }
}

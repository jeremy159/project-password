import { Injectable } from '@angular/core';
import * as d3Instance from 'd3';

@Injectable({
  providedIn: 'root'
})
export class D3Service {

  get d3(): any {
    return d3Instance;
  }

  public createAxes(g: any, xAxis: d3.Axis<any>, yAxis: d3.Axis<any>, height: number, xTitle?: string, yTitle?: string) {
    // horizontal axe
    g.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    // x title
    if (xTitle) {
      g.append('text')
        .attr('text-anchor', 'end')
        .text(xTitle);
    }

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

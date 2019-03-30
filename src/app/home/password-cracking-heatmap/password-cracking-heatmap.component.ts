import { Component, OnInit, ChangeDetectionStrategy, Input, ViewChild, ElementRef } from '@angular/core';
import { PasswordCrackingTimes, TickValue } from 'src/app/shared/models/password-cracking-times';
import { D3Service } from 'src/app/core/services/d3.service';
import { Margin } from 'src/app/shared/models/margin';
import d3Tip from 'd3-tip';

interface HeatmapPropreties {
  color: d3.ScaleLogarithmic<string, string>;
  width: number;
  Heatmap: any;
}

let tip: any;

@Component({
  selector: 'pp-password-cracking-heatmap',
  templateUrl: './password-cracking-heatmap.component.html',
  styleUrls: ['./password-cracking-heatmap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordCrackingHeatmapComponent implements OnInit {

  @Input() private data: PasswordCrackingTimes;
  @ViewChild('heatmap') private heatmapElement: ElementRef;
  private heatmapSvg: any;
  private heatmapProps: HeatmapPropreties = {color: undefined, width: 0, Heatmap: undefined};
  private buttonGroup: any;
  private crackedGroup: any;
  private heatmapGroup: any;
  private bars: any;
  private  timeouts: any[] = [];
  private isAnimating = false;

  constructor(private d3Service: D3Service) { }

  ngOnInit() {
    this.initialize();
    this.createHeatmap();
  }

  private initialize(): void {
    const datasets = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'];
    const domain = [10, 100, 1000, 10000, 100000, 1000000, 10000000];
    const colors = ['#5858e9', '#49bb36', '#3ae396', '#4de02c', '#cbdd1e', '#da5911', '#d70450'];
    this.heatmapProps.color = this.d3Service.d3.scaleLog().domain(domain).range(colors);
    const margin: Margin = { top: 100, right: 0, bottom: 50, left: 100 };
    this.heatmapProps.width = 1300 + margin.left + margin.right;
    const height = 300 + margin.top + margin.bottom;

    const SVG = {
      top: margin.top,
      right: margin.right,
      bottom: margin.bottom,
      left: margin.left
    };
    const Legend = {
      top: SVG.top,
      right: SVG.right,
      bottom: SVG.bottom,
      left: SVG.left,
      barHeight: (height - SVG.top - margin.bottom) / (domain.length),
      barWidth: 15
    };
    this.heatmapProps.Heatmap = {
      top: Legend.top + Legend.barHeight * domain.length / 2 - 55 / 2,
      right: SVG.right + 50,
      bottom: Legend.bottom,
      left: Legend.left + 150,
      barHeight: 55,
      barWidth: 0 // Est utilisé plus bas
    };
    const Buttons = {
      top: this.heatmapProps.Heatmap.top - 40,
      right: 0,
      bottom: 0,
      left: this.heatmapProps.Heatmap.left,
      buttonWidth: 75,
      buttonHeight: 30,
      space: 7
    };
    const Cracked = {
      top: this.heatmapProps.Heatmap.top + this.heatmapProps.Heatmap.barHeight + 50,
      right: 0,
      bottom: 0,
      left: this.heatmapProps.Heatmap.left,
      animate: {
        position: {
          top: 0,
          right: 0,
          botton: 0,
          left: 0
        }
      }
    };
    // heatmap svg
    this.heatmapSvg = this.d3Service.d3.select(this.heatmapElement.nativeElement)
      .append('svg')
      .attr('width', this.heatmapProps.width)
      .attr('height', height);

    this.buttonGroup = this.heatmapSvg.append('g')
      .attr('id', 'buttons')
      .attr('transform', `translate(${Buttons.left}, ${Buttons.top})`);
    this.buttonGroup.selectAll('rect')
      .data(datasets)
      .enter()
      .append('rect')
      .attr('class', 'button')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('transform', (d, i: number) => `translate(${i * (Buttons.buttonWidth + Buttons.space)}, ${0})`)
      .attr('width', Buttons.buttonWidth)
      .attr('height', Buttons.buttonHeight);
    this.buttonGroup.selectAll('text')
      .data(datasets)
      .enter()
      .append('text')
      .attr('transform', (d, i: number) =>
        `translate(${i * (Buttons.buttonWidth + Buttons.space) + Buttons.buttonWidth / 2}, ${Buttons.buttonHeight / 2 + 4})`)
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .text((d: string) => d);

    this.crackedGroup = this.heatmapSvg.append('g')
      .attr('id', 'cracked')
      .attr('transform', `translate(${Cracked.left}, ${Cracked.top})`);
    this.crackedGroup.append('text')
      .attr('id', 'count')
      .attr('transform', `translate(${Cracked.animate.position.left}, ${Cracked.animate.position.top + 50})`);
    this.crackedGroup.append('rect')
      .attr('class', 'button')
      .attr('width', Buttons.buttonWidth + 30)
      .attr('height', Buttons.buttonHeight);
      // .attr('transform', (d,i) => `translate(${Cracked.animate.position.left}, ${Cracked.animate.position.top})`);
    this.crackedGroup.append('text')
      .attr('id', 'buttonText')
      .attr('transform', `translate(${Cracked.animate.position.left + (Buttons.buttonWidth + 30) / 2},
                                    ${Cracked.animate.position.top + Buttons.buttonHeight / 2 + 4})`)
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text('Animer');

    this.heatmapGroup = this.heatmapSvg.append('g')
      .attr('id', 'heatmap')
      .attr('transform', `translate(${this.heatmapProps.Heatmap.left}, ${this.heatmapProps.Heatmap.top})`);

    const legend = this.heatmapSvg.append('g')
      .attr('id', 'legend')
      .attr('transform', `translate(${Legend.left}, ${Legend.top})`);
    legend.append('text')
      .text('Légende')
      .attr('transform', `translate(${0}, ${-15})`);

    legend.append('g').selectAll('.legendBar')
      .data(domain)
      .enter()
      .append('rect')
      .attr('class', 'legendBar')
      .attr('transform', (d, i: number) => `translate(${0}, ${(colors.length - i - 1) * Legend.barHeight})`)
      .attr('width', Legend.barWidth)
      .attr('height', Legend.barHeight)
      .attr('fill', (d) => this.heatmapProps.color(d));

    legend.append('g').selectAll('text')
      .data(domain)
      .enter()
      .append('text')
      .attr('transform', (d, i) =>
        `translate(${Legend.barWidth + 5}, ${(colors.length - i - 1) * Legend.barHeight + Legend.barHeight / 2 + 5})`)
      .text((d) => `≤ ${this.d3Service.getFormattedNumber(d)}`);

    // tooltip
    tip = d3Tip().attr('class', 'd3-tip').offset([-10, 0]);
    tip.html((d: TickValue) => this.d3Service.getFormattedNumber(d.value));
  }

  public createHeatmap(): void {
    const data_init = 'seconds';
    this.buttonGroup.selectAll('.button')
      .filter(d => d === data_init)
      .attr('class', 'button selected');
    this.heatmap(this.data.data[data_init], data_init);

    let lastSelection = data_init;
    this.buttonGroup.selectAll('.button')
      .on('click', d => {
        lastSelection = d;
        this.buttonGroup.selectAll('.button')
          .attr('class', e => d === e ? 'button selected' : 'button');
        this.heatmap(this.data.data[d], d);
      });

    this.crackedGroup.select('.button')
      .on('click', () => {
        if (this.isAnimating) {
          this.heatmap(this.data.data[lastSelection], lastSelection);
        }
        else {
          this.animate(this.data.data[lastSelection], lastSelection);
        }
      });
  }

  private heatmap(data, unit): void {
    this.reset();
    const MaxBarWidth = 20;
    const space = (this.heatmapProps.width - this.heatmapProps.Heatmap.left - this.heatmapProps.Heatmap.right);
    this.heatmapProps.Heatmap.barWidth = space / data.length > MaxBarWidth ? MaxBarWidth : space / data.length;

    // Suppression des rectangles
    this.heatmapGroup.selectAll('.bordered').remove();

    // update heatmap 1D
    this.bars = this.heatmapGroup.selectAll('.bar').data(data);
    // Mise à jour des unités
    this.setunits(data, unit);

    this.bars.enter().append('rect')
      .attr('transform', (d, i) => `translate(${i * this.heatmapProps.Heatmap.barWidth}, ${0}) rotate(0)`)
      .attr('class', 'bordered')
      .attr('width', this.heatmapProps.Heatmap.barWidth)
      .attr('height', this.heatmapProps.Heatmap.barHeight)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .style('fill', d => this.heatmapProps.color(d.value));
    this.crackedGroup.select('#count')
      .text(d => `Nombre de mot de passe déchiffré :
        ${this.d3Service.getFormattedNumber(this.d3Service.d3.sum(data, d2 => d2.value))} après ${data.length - 1} ${unit}`);
    this.heatmapSvg.call(tip);
  }

  private animate(data, unit): void {
    this.reset();

    this.isAnimating = true;
    this.crackedGroup.select('#buttonText').text('Arrêter l\'animation');
    // Mise à jour des barres
    let c = 0;
    this.bars.enter().append('rect')
      .attr('transform', (d, i) => `translate(${i * this.heatmapProps.Heatmap.barWidth}, ${0}) rotate(0)`)
      .attr('class', 'bordered')
      .attr('width', this.heatmapProps.Heatmap.barWidth)
      .attr('height', this.heatmapProps.Heatmap.barHeight)
      .on('mouseover', () => tip.show)
      .on('mouseout', () => tip.hide)
      .style('fill', () => this.heatmapProps.color(1))
      .transition().duration(300)
      .delay((d, i: number) => {
        const delay = i * 100;
        this.timeouts.push(setTimeout(() => {
            c += d.value;
            this.crackedGroup.select('#count').text(() =>
              `Nombre de mot de passe déchiffré : ${this.d3Service.getFormattedNumber(c)} après ${i} ${unit}`);
            if (i === data.length) {
              this.isAnimating = false;
            }
        }, delay));
        return delay;
      })
      .style('fill', d => this.heatmapProps.color(d.value));
    this.heatmapGroup.call(tip);
  }

  private setunits(data, unit): void {
    this.heatmapGroup.selectAll('.timeLabel')
      .remove()
      .exit()
      .data(data)
      .enter()
      .filter((d, i: number) => i % 5 === 0)
      .append('text')
      .text((d: TickValue) => `${d.t}`)
      .style('text-anchor', 'left')
      .attr('transform', (d, i) =>
        `translate( ${(this.heatmapProps.Heatmap.barWidth / 2) + i * 5 * this.heatmapProps.Heatmap.barWidth - 5},
                    ${this.heatmapProps.Heatmap.barHeight + 15})`)
      .attr('class', (d, i) => ((i >= 7 && i <= 16) ? 'timeLabel mono axis axis-worktime' : 'timeLabel mono axis'));

    /*heatmapGroup.select('text')
        //.attr('transform', (d, i) => `translate(${width}, ${-15})`)
        //.transition()
        //.duration(650)
        .text(d => unit)
        .attr('transform', (d, i) => `translate(${0}, ${-15})`)*/
  }

  private clearTimeouts(): void {
    this.timeouts.forEach(t => {
      clearTimeout(t);
    });
  }

  private reset(): void {
    this.clearTimeouts();
    this.isAnimating = false;
    this.crackedGroup.select('#buttonText').text('Animer');
  }
}

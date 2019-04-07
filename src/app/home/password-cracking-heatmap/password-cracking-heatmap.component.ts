import { Component, OnInit, ChangeDetectionStrategy, Input, ViewChild, ElementRef } from '@angular/core';
import { D3Service } from 'src/app/core/services/d3.service';
import { Margin } from 'src/app/shared/models/margin';
import d3Tip from 'd3-tip';

interface LinechartPropreties {
  color: d3.ScaleLogarithmic<string, string>;
  x: d3.ScaleLinear<string, string>;
  y: d3.ScaleLinear<string, string>;
  xAxis: d3.Axis<string>;
  yAxis: d3.Axis<string>;
  width: number;
  Graph: any;
  Legend: any;
}

@Component({
  selector: 'pp-password-cracking-heatmap',
  templateUrl: './password-cracking-heatmap.component.html',
  styleUrls: ['./password-cracking-heatmap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordCrackingHeatmapComponent implements OnInit {

  @Input() private data: any;
  @ViewChild('linechart') private linechartElement: ElementRef;
  private density: any;
  private cumulatif: any;
  private linechartSvg: any;
  private colors = ['#69b3a2', '#6900a2'];
  private graphProps: LinechartPropreties =
    {color: undefined, width: 0, Graph: undefined, Legend: undefined, x: undefined, y: undefined, xAxis: undefined, yAxis: undefined};

  // Variables utilisés dans les actions
  private cumulativePoints: any;
  private densityPoints: any;
  private bars: any;
  private txt_cumulatif: any;
  private txt_density: any;

  constructor(private d3Service: D3Service) { }

  ngOnInit() {
    this.density = this.data[0];
    this.cumulatif = this.data[1];

    this.initialize();
    this.createGraph();
  }

  private initialize(): void {
    // On défini les attributs général du graphique
    const margin: Margin = {top: 60, right: 100, bottom: 50, left: 50};
    this.graphProps.Graph = {
        top: margin.top,
        right: margin.right,
        bottom: margin.bottom,
        left: margin.left,
        width: 1000,
        height: 600
    };
    this.graphProps.Legend = {
        left: this.graphProps.Graph.width - 60,
        top: margin.top
    };

    // On ajoute le svg au div
    this.linechartSvg = this.d3Service.d3.select(this.linechartElement.nativeElement)
      .append('svg')
      .attr('width', this.graphProps.Graph.width + margin.left + margin.right)
      .attr('height', this.graphProps.Graph.height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.graphProps.Graph.left},${this.graphProps.Graph.top})`);

    // Titre de l'axe y
    this.linechartSvg.append('text')
      .attr('class', 'axisTitle')
      .attr('transform', `translate(${-margin.left}, ${-30})`)
      .text('Pourcentage de mots de passes déchiffrés');

    // Titre de l'axe x
    this.linechartSvg.append('text')
      .attr('class', 'axisTitle')
      .attr('transform', `translate(${(this.graphProps.Graph.width) / 2}, ${this.graphProps.Graph.height + 40})`)
      .text('minutes');

    // Définition des axes
    // Axe x
    this.graphProps.x = this.d3Service.d3.scaleLinear()
        .range([0, this.graphProps.Graph.width ]);
    const min = this.d3Service.d3.min(this.cumulatif.data, d => d.t);
    const max = this.d3Service.d3.max(this.cumulatif.data, d => d.t);
    this.graphProps.x.domain([min, max]);
    this.graphProps.xAxis = this.d3Service.d3.axisBottom()
        .scale(this.graphProps.x)
        .tickFormat((d: any) => this.formatMinutes(d))
        .ticks(16);
    // Axe y
    this.graphProps.y = this.d3Service.d3.scaleLinear()
        .domain([0, 1])
        .range([this.graphProps.Graph.height, 0]);
    this.graphProps.yAxis = this.d3Service.d3.axisLeft()
        .scale(this.graphProps.y)
        .tickFormat((d) => this.d3Service.getFormattedPercent(d));

    // Création des graphs
    this.linechartSvg.append('g')
        .attr('transform', `translate(0,${this.graphProps.Graph.height})`)
        .call(this.graphProps.xAxis);
    this.linechartSvg.append('g')
        .call(this.graphProps.yAxis);
  }

  public createGraph(): void {
    const barWidth = this.graphProps.Graph.width / this.d3Service.d3.max(this.cumulatif.data, d => d.t) + 1;
    // Création des barres
    this.bars = this.linechartSvg.append('g')
      .selectAll('rect')
      .data(this.cumulatif.data)
      .enter().append('rect')
      .attr('fill', 'lightgray')
      .attr('opacity', 0)
      .attr('stroke-width', 0)
      .attr('x', 1)
      .attr('transform', d => `translate(${+this.graphProps.x(d.t) - barWidth / 2}, ${this.graphProps.y(d.n)})`)
      .attr('width', barWidth)
      .attr('height', d => this.graphProps.Graph.height - +this.graphProps.y(d.n) )
      .on('mouseover', (d) => this.mouseover(d))
      .on('mouseleave', (d) => this.mouseout(d));

    this.createCumulative();
    this.createDensity();
    this.addLegend();
  }

  private createCumulative(): void {
    // Création de la courbe cumulative
    this.linechartSvg.append('path')
      .datum(this.cumulatif.data)
      .attr('fill', 'none')
      .attr('stroke', this.colors[0])
      .attr('stroke-width', 2)
      .attr('d', this.d3Service.d3.line()
        .curve(this.d3Service.d3.curveMonotoneX)
        .x((d) => this.graphProps.x(d.t))
        .y((d) => this.graphProps.y(d.n)));

    // Ajout des points associés à la courbe cumulative
    this.cumulativePoints = this.linechartSvg.append('g')
      .selectAll('dot')
      .data(this.cumulatif.data)
      .enter()
      .append('circle')
      .attr('cx', (d) => this.graphProps.x(d.t))
      .attr('cy', (d) => this.graphProps.y(d.n))
      .attr('pointer-events', 'none')
      .attr('r', 0)
      .attr('fill', this.colors[0])
      .on('mouseover', (d) => this.mouseover(d))
      .on('mouseleave', (d) => this.mouseout(d));

    // Ajout de la ligne indiquant le 95%
    this.linechartSvg.append('line')
      .attr('x1', 0)
      .attr('y1', this.graphProps.y(0.95))
      .attr('x2', this.graphProps.Graph.width )
      .attr('y2', this.graphProps.y(0.95))
      .attr('stroke-width', 0.5)
      .attr('stroke', 'black');
      // Text associé à la limite 95%
    this.linechartSvg.append('text')
      .attr('transform', () => `translate(${this.graphProps.Graph.width + 10}, ${this.graphProps.y(0.95)})`)
      .text('95% ');

    // Fait saillant
    this.txt_cumulatif = this.linechartSvg.append('text')
      .attr('class', 'highlight')
      .attr('transform', d => `translate(${this.graphProps.Graph.width / 2}, ${this.graphProps.Graph.height / 2})`)
    this.txt_density = this.linechartSvg.append('text')
        .attr('class', 'highlight')
        .attr('transform', d => `translate(${this.graphProps.Graph.width / 2}, ${this.graphProps.Graph.height / 2 + 30})`)
  }

  private createDensity(): void {
    // courbe
    this.linechartSvg.append('path')
    .datum(this.density.data)
    .attr('fill', 'none')
    .attr('stroke', this.colors[1])
    .attr('stroke-width', 2)
    .attr('d', this.d3Service.d3.line()
        .curve(this.d3Service.d3.curveMonotoneX)
        .x((d) => this.graphProps.x(d.t))
        .y((d) => this.graphProps.y(d.n))
        );
    // Point
    this.densityPoints = this.linechartSvg.append('g')
        .selectAll('dot')
        .data(this.density.data)
        .enter()
        .append('circle')
        .attr('cx', (d) => this.graphProps.x(d.t))
        .attr('cy', (d) => this.graphProps.y(d.n))
        .attr('pointer-events', 'none')
        .attr('r', 0)
        .attr('fill', this.colors[1])
        .on('mouseover', (d) => this.mouseover(d))
        .on('mouseleave', (d) => this.mouseout(d));
  }

  private addLegend(): void {
    // Finalement, on ajoute une légende
    const legend = this.linechartSvg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${this.graphProps.Legend.left - 100}, ${this.graphProps.Legend.top})`);
    legend.append('rect')
        .attr('width', '140px')
        .attr('height', '70px')
        .attr('fill', '#fff')
        .attr('stroke-width', '0.5px')
        .attr('stroke', 'gray');

    // Légende pour le cumulatif
    const cumulativeLegend = legend.append('g')
        .attr('transform', `translate(${10}, ${10})`);
    cumulativeLegend.append('rect')
        .attr('class', 'legend')
        .attr('width', '10px')
        .attr('height', '10px')
        .attr('fill', this.colors[0])
        .attr('stroke-width', '0.5px')
        .attr('stroke', 'gray')
        .attr('transform', `translate(${10}, ${10})`);
    cumulativeLegend.append('text')
        .text('Cumulatif')
        .attr('transform', `translate(${30}, ${20})`);

    // Légende pour la densité
    const density = legend.append('g')
        .attr('transform', `translate(${10}, ${30})`);
    density.append('rect')
        .attr('class', 'legend')
        .attr('width', '10px')
        .attr('height', '10px')
        .attr('fill', this.colors[1])
        .attr('stroke-width', '0.5px')
        .attr('stroke', 'gray')
        .attr('transform', `translate(${10}, ${10})`);
    cumulativeLegend.append('text')
            .text('Densité')
            .attr('transform', `translate(${30}, ${40})`);
  }

  // Formattage
  private formatMinutes(secondes): string {
      const decimalFormat = this.d3Service.d3.format('02');
      const minutes = secondes % 60;
      return `${Math.floor(secondes / 60)}:${decimalFormat(secondes % 60)}`;
  }

  /**
   * Affiche les cercles et la barre associé à l'élément survoler
   * @param {*} d
   */
  private mouseover(d): void {
    const cumulative = this.cumulativePoints.filter(p => p.t === d.t);
    const density = this.densityPoints.filter(p => p.t === d.t);
    const bar = this.bars.filter(p => p.t === d.t);
    bar.attr('opacity', 1);
    cumulative.attr('r', 6);
    density.attr('r', 6);
    this.txt_cumulatif.text(`${this.d3Service.getFormattedPercent(d.n)} des mots de passes
      sont déchiffés en moins de ${this.formatMinutes(d.t)} minutes!`);
    this.txt_density.text(`Contribution de ${this.d3Service.getFormatted4Percent(density.datum().n)} à cet instant précis.`);
  }
  /**
   *  Fait disparaitre les cercles et la barre associé à l'élément survoler
   * @param {*} d
   */
  private mouseout(d) {
      const cumulative = this.cumulativePoints.filter(p => p.t === d.t);
      const bar = this.bars.filter(p => p.t === d.t);
      cumulative.attr('r', 0);
      const density = this.densityPoints.filter(p => p.t === d.t);
      density.attr('r', 0);
      bar.attr('opacity', 0);
      this.txt_cumulatif.text(``);
      this.txt_density.text(``);
  }
}

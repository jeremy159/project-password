import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { PasswordTreemap } from 'src/app/shared/models/password-treemap';
import { D3Service } from 'src/app/core/services/d3.service';
import { PreProcessService } from 'src/app/core/services/pre-process.service';
import { Margin } from 'src/app/shared/models/margin';

interface TreemapPropreties {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  xAxis: d3.Axis<string>;
  yAxis: d3.Axis<number>;
  color: d3.ScaleOrdinal<string, string>;
  height: number;
}

interface BarChartProperties {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleBand<string>;
  yAxis: d3.Axis<string>;
}

@Component({
  selector: 'pp-password-treemap',
  templateUrl: './password-treemap.component.html',
  styleUrls: ['./password-treemap.component.scss']
})
export class PasswordTreemapComponent implements OnInit {

  @Input() private data: PasswordTreemap;
  @ViewChild('treemap') private treemapElement: ElementRef;
  @ViewChild('barChart') private barChartElement: ElementRef;
  private barChartSvg: any;
  private treemapSvg: any;
  private treemap: d3.TreemapLayout<PasswordTreemap>;
  private treemapProps: TreemapPropreties = {x: undefined, y: undefined, xAxis: undefined, yAxis: undefined, color: undefined, height: 0};
  private barChartProps: BarChartProperties = {x: undefined, y: undefined, yAxis: undefined};
  private barChartBarsGroup: any;
  private barChartAxisGroup: any;
  private g1: any;
  private grandparent: any;
  private transitioning = false;
  private tip: any;

  constructor(private d3Service: D3Service,
              private preProcessService: PreProcessService) { }

  ngOnInit() {
    for (let i = 0; i < this.data.children.length; i++) {
      this.preProcessService.convertNumbers(this.data.children[i].children, ['value']);
    }

    this.initialize();
    this.createTreemap();
  }

  public mouseover(): void {
    this.tip.style("display", "inline");
  }
  public mousemove(d): void {
    this.tip.html(
      `
        <p class="name"> ${d.data.name}</p>
        <p class="count">${this.d3Service.getFormattedNumber(d.value)}</p>
      `
      )
      .style("left", (this.d3Service.d3.event.pageX + 10) + "px")
      .style("top", (this.d3Service.d3.event.pageY - 50) + "px");
  }
  public mouseout(): void {
    this.tip.style("display", "none");
  }

  private initialize(): void {

    const width = 750;
    const height = 500;
    const SVGMargin: Margin = { top: 50, right: 0, bottom: 20, left: 150 };
    const treemapMargin: Margin = { top: SVGMargin.top, right: 0, bottom: 0, left: SVGMargin.left };
    const navMargin = { top: treemapMargin.top - 30, right: 0, bottom: 0, left: treemapMargin.left };
    const barChartMargin: Margin = { top: SVGMargin.top, right: 0, bottom: 0, left: width + treemapMargin.left + 75 };

    this.treemapProps.x = this.d3Service.d3.scaleLinear()
      .domain([0, width])
      .range([0, width]);
    this.treemapProps.y = this.d3Service.d3.scaleLinear()
      .domain([0, height])
      .range([0, height]);

    this.treemapProps.color = this.d3Service.d3.scaleOrdinal(this.d3Service.d3.schemeCategory10);

    //Tooltip
    this.tip = this.d3Service.d3.select("#treemapDiv")
      .append("div")
      .attr("class", "tooltip")
      .style("display", "none");

    /***** Création du treemap *****/
    this.treemap = this.d3Service.d3.treemap()
      .tile(this.d3Service.d3['treemapBinary'])
      .size([width, height])
      .paddingInner(0)
      .round(false);

    // On ajoute un clipPath pour pas que l'animation du treemap sorte de ses dimensions
    this.d3Service.d3.select('#treemapSvg')
      .attr('width', '100%')
      .attr('height', height + treemapMargin.bottom + treemapMargin.top);

    this.d3Service.d3.select('#treemapSvg')
      .append('defs')
      .append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('transform', `translate(${treemapMargin.left}, ${treemapMargin.top - (treemapMargin.top - navMargin.top)})`)
      .attr('width', width)
      .attr('height', height - treemapMargin.bottom + (treemapMargin.top - navMargin.top));

    // Treemap
    this.treemapSvg = this.d3Service.d3.select(this.treemapElement.nativeElement)
      .attr('clip-path', 'url(#clip)')
      .attr('width', width + treemapMargin.left + treemapMargin.right)
      .attr('height', height + treemapMargin.bottom + treemapMargin.top)
      .attr('margin-left', -treemapMargin.left + 'px')
      .attr('margin-right', -treemapMargin.right + 'px')
      .append('g')
        .attr('transform', `translate(${treemapMargin.left}, ${treemapMargin.top})`)
        .style('shape-rendering', 'crispEdges');

    // Navigation
    this.grandparent = this.treemapSvg.append('g')
      .attr('class', 'grandparent');
    this.grandparent.append('rect')
      .attr('transform', `translate(${0}, ${navMargin.top - treemapMargin.top})`)
      .attr('width', width)
      .attr('height', treemapMargin.top - navMargin.top)
      .attr('fill', '#bbbbbb');
    this.grandparent.append('text')
      .attr('transform', `translate(${6}, ${2*(navMargin.top - treemapMargin.top)/3})`)
      //.attr('x', 6)
      //.attr('y', (navMargin.top - treemapMargin.top)/2)
      .attr('dy', '.75em');

    /***** BARCHART *****/
    const barChartWidth = 200;
    const barChartHeight = 125;

    /***** Création des éléments du diagramme à barres *****/
    this.barChartSvg = this.d3Service.d3.select(this.barChartElement.nativeElement)
      .attr('width', barChartWidth)
      .attr('height', barChartHeight)
      .attr('transform', `translate(${barChartMargin.left}, ${barChartMargin.top})`);
    this.barChartSvg.append('text')
      .attr('transform', `translate(${0}, ${-10})`)
      .text('Top 5');

    const barChartGroup = this.barChartSvg.append('g');

    this.barChartBarsGroup = barChartGroup.append('g');
    this.barChartAxisGroup = barChartGroup.append('g')
      .attr('class', 'axis y');

    this.barChartProps.x = this.d3Service.d3.scaleLinear()
      .range([0, barChartWidth * 3 / 4]);
    this.barChartProps.y = this.d3Service.d3.scaleBand()
      .range([0, barChartHeight])
      .padding(0.1);

    this.barChartProps.yAxis = this.d3Service.d3.axisLeft(this.barChartProps.y);
    this.barChartAxisGroup.call(this.barChartProps.yAxis);

  }

  public createTreemap(): void {
    const root = this.d3Service.d3.hierarchy(this.data);
    this.treemap(root.sum(function (d) {
                return d.value;
            })
            .sort(function (a, b) {
                return b.height - a.height || b.value - a.value;
            }));
    this.display(root);
  }

  /**
  * Crée ou met à jour le treemap en fonction du noeud d
  * @param {Node} node
  */
  private display(node): any {
    // Bar chart
    this.updateBarChart(node);
    this.barChartSvg.attr('visibility', 'visible');

    // Barre de navigation
    this.grandparent.datum(node)
      .on('click', d => this.transition(d.parent, true))
      .select('text')
      .text(d => this.name(d))
      .attr('fill', d => {if (d.data.name !== 'catégories') {return '#fff'; }});
    this.grandparent.datum(node)
        .select('rect')
        .attr('fill', d => {
          const alt = d.data.name.match(/\((.*)\)/); // Au cas où le nom est 'restants (*)'
          const name = alt ? alt[1] : d.data.name;
          return name === 'catégories' ? '#fff' : this.treemapProps.color(name);
        });

    // Ajoute les éléments du treemap au même niveau que la balise de la barre de navigation
    this.g1 = this.treemapSvg.insert('g', '.grandparent')
      .datum(node)
      .attr('class', 'depth');

    // Ajoute les enfants de chaque éléments du treemap
    const g = this.g1.selectAll('g')
      .data(node.children)
      .enter()
      .append('g');
    g.filter(d => d.children) //On ajoute les enfants aux éléments qui ont des enfants
      .selectAll('.child')
      .data(d => d.children)
      .enter()
      .append('rect')
      .attr('class', 'child')
      .on("mouseover", d => this.mouseover())
      .on("mousemove", d => this.mousemove(d))
      .on("mouseout", d => this.mouseout())
      .call((d) => this.rect(d));
    g.append('rect')
      .attr('class', 'parent')
      .call((d) => this.rect(d));
    g.append('foreignObject')
      .call((d) => this.rect(d))
      .attr('class', 'foreignobj')
      .filter(d => d.data.name.split(' ')[0] != 'restants')
      .append('xhtml:div')
      .html((d) => `<p class="title"> ${d.data.name}</p>
                    <p>${this.d3Service.getFormattedNumber(d.value)}</p>`)
      .attr('class', 'textdiv'); // textdiv class allows us to style the text easily with CSS

    // Si on est pas à la racine de l'arbre, chaque élément est un 'children'
    g.filter(d => d.children)
      .classed('children', true)
      .on('click', (d) => this.transition(d))
      //Si on est pas au noeud catégories, on permet l'affichage des valeurs de la case restante
      .filter(d => d.parent.data.name != 'catégories')
      .classed('hoverable', true);

    return g;
  }

  /**
    * Transition entre les parents/enfants
    * @param {*} node
    */
   private transition(node, navigationBar: boolean = false): void {
    if (this.transitioning || !node) {
      return;
    }
    this.transitioning = true;
    const previousG1 = this.g1;
    const g2 = this.display(node),
        t1 = previousG1.transition().duration(650),
        t2 = g2.transition().duration(650);
    // Update the domain only after entering new elements.
    this.treemapProps.x.domain([node.x0, node.x1]);
    this.treemapProps.y.domain([node.y0, node.y1]);
    // Enable anti-aliasing during the transition.
    this.treemapSvg.style('shape-rendering', null);
    // Draw child nodes on top of parent nodes.
    this.treemapSvg.selectAll('.depth').sort(function (a, b) {
        return a.depth - b.depth;
    });
    // Fade-in entering text.
    g2.selectAll('text').style('fill-opacity', 0);
    g2.selectAll('foreignObject div').style('display', 'none');
    /*added*/
    // Transition to the new view.
    t1.selectAll('text').call((d) => this.text(d)).style('fill-opacity', 0);
    t2.selectAll('text').call((d) => this.text(d)).style('fill-opacity', 1);
    t1.selectAll('rect').call((d) => this.rect(d));
    t2.selectAll('rect').call((d) => this.rect(d));
    /* Foreign object */
    t1.selectAll('.textdiv').style('display', 'none');
    /* added */
    t1.selectAll('.foreignobj').call((d) => this.foreign(d));
    /* added */
    t2.selectAll('.textdiv').style('display', 'inline-block');
    /* added */
    t2.selectAll('.foreignobj').call((d) => this.foreign(d));
    /* added */
    // Remove the old node when the transition is finished.
    const _this = this;
    t1.on('end.remove', function() {
      this.remove();
      _this.transitioning = false;
    });
    t2.selectAll('.textdiv').on('end.remove', function(thisnode) {
        var height = this.clientHeight;
        var width = this.clientWidth;
        var parentHeight = this.parentNode.clientHeight;
        var parentWidth = this.parentNode.clientWidth;
        if(height > parentHeight || width > parentWidth) {
          var parent = _this.d3Service.d3.select(this.parentNode);
          g2.selectAll('rect')
            .filter(d => {
              return d.data.name == thisnode.data.name;
            })
            .classed("notext", true)         
            .on("mouseover", d => _this.mouseover())
            .on("mousemove", d => _this.mousemove(d))
            .on("mouseout", d => _this.mouseout());
            parent.remove();
        }
    });
  }

  private updateBarChart(node): void {
    let data = node.children.map(x => x);
    data = data.filter((x) => node.data.name === 'catégories' ? true : x.children === undefined);
    data = data.slice(0, 5);

    this.barChartProps.x.domain([0, this.d3Service.d3.max(data, x => x.value)]);
    this.barChartProps.y.domain(data.map(x => x.data.name));

    this.barChartAxisGroup.call(this.barChartProps.yAxis);

    const bars = this.barChartBarsGroup
      .selectAll('g')
      .remove()
      .exit()
      .data(data);

    bars.enter()
      .append('g')
      .append('rect')
      .attr('class', 'bar')
      .attr('y', (d, i) => this.barChartProps.y(d.data.name))
      .attr('height', () => this.barChartProps.y.bandwidth())
      .transition().duration(650)
      .attr('width', d => this.barChartProps.x(d.value))
      .attr('fill', d => {
          while (d.depth > 1) { d = d.parent; }
          return this.treemapProps.color(d.data.name);
      });

    bars.enter()
      .append('g').append('text')
      .attr('class', 'label')
      .attr('y', d => this.barChartProps.y(d.data.name) + this.barChartProps.y.bandwidth() / 2 + 4)
      .transition().duration(650)
      .attr('x', d => this.barChartProps.x(d.value) + 3)
      .text(d => this.d3Service.getFormattedNumber(d.value));
  }

  private text(t): void {
    t.attr('x', (d) => this.treemapProps.x(d.x) + 6)
      .attr('y', (d) => this.treemapProps.y(d.y) + 6);
  }

  private rect(r): void {
    r.attr('x', (d) => this.treemapProps.x(d.x0))
      .attr('y', (d) => this.treemapProps.y(d.y0))
      .attr('width', (d) => this.treemapProps.x(d.x1) - this.treemapProps.x(d.x0))
      .attr('height', (d) => this.treemapProps.y(d.y1) - this.treemapProps.y(d.y0))
      .attr('fill', (d) => {
        while (d.depth > 1) { d = d.parent; }
        return this.treemapProps.color(d.data.name);
      });
  }

  private foreign(f): void { /* added */
    f.attr('x', (d) => this.treemapProps.x(d.x0))
      .attr('y', (d) => this.treemapProps.y(d.y0))
      .attr('width', (d) => this.treemapProps.x(d.x1) - this.treemapProps.x(d.x0))
      .attr('height', (d) => this.treemapProps.y(d.y1) - this.treemapProps.y(d.y0));
  }

  private name(d): string {
    return this.breadcrumbs(d) +
        (d.parent
        ? ' - Cliquez ici pour revenir'
        : ' - Sélectionner une catégorie' );
  }

  private breadcrumbs(d): string {
    let res = '';
    const sep = ' > ';
    d.ancestors().reverse().forEach((i) => {
        res += i.data.name + sep;
    });
    return res.split(sep)
      .filter((i) => i !== '')
      .join(sep);
  }
}

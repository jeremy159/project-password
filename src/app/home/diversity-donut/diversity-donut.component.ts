import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Diversity } from 'src/app/shared/models/diversity';
import { D3Service } from 'src/app/core/services/d3.service';
import { PreProcessService } from 'src/app/core/services/pre-process.service';

interface DonutPropreties {
  pie: d3.Pie<DonutPropreties, number>;
  arc: d3.Arc<DonutPropreties, number>;
  outerRadius: number;
  innerRadius: number;
  donutXPos: number;
}

interface MatriceElement {
  tag: string;
  count: number;
}

const repartition_colors = ['#000075', '#133918',  '#450817', '#ffe119', 'white', 'white'];
const repartition_passwords = ['PASSWORDS', 'PASSWORDS', 'PASSWORDS', 'PASSWORDS'];

const color_matrix = [
  ['#00004d', '#0000b3', '#4d4dff',  '#b3b3ff', 'white', 'white'],
  ['#133918', '#2d8638', '#53c661', '#9fdfa7', '#c6ecca', 'white'],
  ['#450817', '#a11235', '#e8305d', '#f28ca5', 'white', 'white'],
  ['#ffe119', 'white', 'white', 'white', 'white', 'white']
];

const passwords_matrix = [
  ['passwords', '9455W0735', 'PASSWORDS', '¶@$$Ш0Я[)$'],
  ['pa55w0rd5', 'pAsSwOrDs', 'P4SSW0RD5', 'p@ssword$', '9@55Ш0Я[)5', 'P@$$WORD$'],
  ['Pa55w0rd5', 'pa$$w0rd5',  'pA$$wOrd$', 'PA$$W0RD5'],
  ['p@$5W0rD$']
];

@Component({
  selector: 'pp-diversity-donut',
  templateUrl: './diversity-donut.component.html',
  styleUrls: ['./diversity-donut.component.scss']
})
export class DiversityDonutComponent implements OnInit {

  @Input() private dada: Diversity[];
  @ViewChild('donut') private donutElement: ElementRef;
  private svgElement: any;
  private donutProps: DonutPropreties = {pie: undefined, arc: undefined, innerRadius: 200, outerRadius: 300, donutXPos: 400};
  private repartition: number[] = [];
  private repartition_tags: number[] = [];
  private repartition_matrix: number[][] = [[], [], [], []];
  private tag_matrix: string[][] = [[], [], [], []];

  constructor(private d3Service: D3Service,
              private preProcessService: PreProcessService) { }

  ngOnInit() {
    this.preProcessService.convertNumbers(this.dada, ['quantity']);

    this.formatData();
    this.initialize();
    this.createDonutChart();
  }

  private formatData(): void {
    const alphabet = ['a', 'A', '7', '$'];
    const matrice: MatriceElement[][] = [[], [], [], []];

    this.dada.forEach((d: Diversity) => {
      const indices: number[] = [];
      const array: number[] = [];
      let temp = 1000;

      for (let j = 0 ; j < 4 ; j++) {
        const idx = d.nom.indexOf('1', j);
        if ((j === 0 || temp !== idx) && idx !== -1) {
          indices.push(idx);
        }
        temp = idx;
        array.push(+d.nom[j]);
      }

      const sum = array.reduce((a, b) => a + b, 0);

      const elementTemp: MatriceElement = {tag: '', count: d.quantity};
      indices.forEach((i: number) => {
        elementTemp.tag += alphabet[i];
      });
      matrice[sum - 1].push(elementTemp);

    });

    matrice.forEach((d) => {
      d.sort((a, b) => this.d3Service.d3.descending(a.count, b.count));
    });

    matrice.forEach((d, i) => {
      d.forEach(j => {
        this.repartition_matrix[i].push(j.count);
        this.tag_matrix[i].push(j.tag);
      });
    });

    this.repartition_matrix.forEach((d) => {
      for (let j = 0 ; j < 6 - d.length ; j++) {
        d.push(0);
      }
    });

    this.repartition_matrix.forEach((d) => {
      const sum = d.reduce((a, b) => a + b, 0);
      this.repartition.push(sum);
    });

    for (let j = 0 ; j < this.repartition.length ; j++) {
      this.repartition_tags.push(j + 1);
    }

    while (6 - this.repartition.length > 0) {
      this.repartition.push(0);
    }
  }

  private initialize(): void {
    /* SVG ELEMENT */
    const width = 1000;
    const height = 650;

    this.svgElement = this.d3Service.d3.select(this.donutElement.nativeElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    /* INITIALISATION DU DONUT ET DE LA LÉGENDE */
    this.donutProps.pie = this.d3Service.d3.pie();

    this.donutProps.arc = this.d3Service.d3.arc()
                .innerRadius(this.donutProps.innerRadius)
                .outerRadius(this.donutProps.outerRadius);

    this.donutProps.arc = this.d3Service.d3.arc()
              .innerRadius(this.donutProps.innerRadius)
              .outerRadius(this.donutProps.outerRadius);
  }

  public createDonutChart(): void {
    const arcs = this.svgElement.selectAll('g.arc')
                .data(() => this.donutProps.pie(this.repartition))
                .enter()
                .append('g')
                .attr('class', 'arc')
                .attr('id', (d, i: number) => 'g' + i)
                .attr('transform', `translate(${this.donutProps.donutXPos}, 320)`)
                .on('click', (d, i: number) => this.changeDonut(i))
                .on('mouseover', (d, i: number) => this.mouseOver(d.value, i))
                .on('mouseout', (d, i: number) => this.mouseOut(d.value, i));

    arcs.append('path')
      .attr('d', (d) => this.donutProps.arc(d))
      .attr('id', (d, i: number) => 'path' + i)
      .attr('fill', (d, i: number) => repartition_colors[i]);

    const _this = this;
    // Rectangles
    this.svgElement.selectAll('rect.legende')
      .data(this.repartition)
      .enter()
      .append('rect')
      .attr('id', (d, i: number) => 'rect' + i)
      .attr('class', 'legende')
      .attr('fill', (d, i: number) => repartition_colors[i])
      .style('stroke', (d, i: number) => i < 4 ? 'black' : 'white')
      .attr('height', 50)
      .attr('width', 50)
      .attr('x', () => this.donutProps.donutXPos + 350)
      .attr('y', (d, i: number) => 150 + 53 * i)
      .on('click', (d, i: number) => {
        if (i < 4) {
          this.mouseOut(d, i);
          this.changeDonut(i);
        }
      })
      .on('mouseover', (d, i: number) => {
        if (i < 4) {
          this.mouseOver(d, i);
        }
      })
      .on('mouseout', function(d, i: number) {
        if (i < 4) {
          _this.mouseOut(d, i);
          _this.d3Service.d3.select(this).classed('selected', true);
        }
      });

    // Texte
    this.svgElement.selectAll('text.legendeInit')
      .data(this.repartition_tags)
      .enter()
      .append('text')
      .attr('class', 'legendeInit')
      .text((d, i: number) => i < 1 ? d + ' alphabet' : d + ' alphabets')
      .attr('x', () => this.donutProps.donutXPos + 410)
      .attr('y', (d, i: number) => 182 + 53 * i)
      .attr('font-size', '25px');
  }

  /* RETOUR À 0 */
  private reInitialize(): void {
    this.svgElement.selectAll('text.legende').remove();
    this.svgElement.selectAll('g.arc').remove();

    // Donut
    const arcs = this.svgElement.selectAll('g.arc')
      .data(() => this.donutProps.pie(this.repartition))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .attr('id', (d, i: number) => 'g' + i)
      .attr('transform', `translate(${this.donutProps.donutXPos}, 320)`)
      .on('click', (d, i: number) => this.changeDonut(i))
      .on('mouseover', (d, i: number) => {
        if (d.value !== 0) {
          this.mouseOver(d.value, i);
        }
      })
      .on('mouseout', (d, i: number) => this.mouseOut(d.value, i));

    arcs.append('path')
      .attr('d', (d) => this.donutProps.arc(d))
      .attr('id', (d, i: number) => 'path' + i)
      .attr('fill', (d, i: number) => repartition_colors[i]);

    // Rectangles
    this.svgElement.selectAll('rect.legende')
      .data(this.repartition)
      .transition('rectInit')
      .duration(500)
      .style('stroke', (d) => d === 0 ? 'white' : 'black')
      .attr('fill', (d, i: number) => repartition_colors[i]);

    this.svgElement.selectAll('rect.legende')
      .data(this.repartition)
      .on('mouseover', (d, i: number) => {
        if (d !== 0) {
          this.mouseOver(d, i);
        }
      })
      .on('mouseout', (d, i: number) => {
        if (d !== 0) {
          this.mouseOut(d, i);
        }
      })
      .on('click', (d, i: number) => {
        if (i < 4) {
          this.mouseOut(d, i);
          this.changeDonut(i);
        }
      });

    // Texte
    this.svgElement.selectAll('text.legendeInit')
      .data(this.repartition_tags)
      .transition()
      .duration(500)
      .attr('fill', 'black')
      .attr('x', () => this.donutProps.donutXPos + 410)
      .attr('y', (d, i: number) => 182 + 53 * i);
  }

  /* MISE-À-JOUR DU DONUT CHART ET DE LA LÉGENDE */
  private changeDonut(indice: number): void {
    this.svgElement.selectAll('text.legende').remove();
    this.svgElement.selectAll('g.arc').remove();

    // Titre
    this.svgElement.selectAll('text.legendeInit')
      .data(this.repartition_tags)
      .transition()
      .duration(300)
      .attr('fill', (d, i: number) => indice === i ? 'black' : 'white')
      .attr('x', (d, i: number) => indice === i ? this.donutProps.donutXPos + 310 : 1500)
      .attr('y', (d, i: number) => indice === i ? 100 : 182 + 53 * i);

    // Donut
    const arcs = this.svgElement.selectAll('g.arc')
      .data(() => this.donutProps.pie(this.repartition_matrix[indice]))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .attr('id', (d, i: number) => 'g' + i)
      .attr('transform', `translate(${this.donutProps.donutXPos}, 320)`)
      .on('mouseover', (d, i: number) => this.mouseOver(d.value, i))
      .on('mouseout', (d, i: number) => this.mouseOut(d.value, i))
      .on('click', () => this.reInitialize());

    arcs.append('path')
      .attr('id', (d, i: number) => 'path' + i)
      .attr('fill', (d, i: number) => color_matrix[indice][i])
      .attr('d', (d) => this.donutProps.arc(d));

    // Rectangles
    this.svgElement.selectAll('rect.legende')
      .data(this.repartition_matrix[indice])
      .on('mouseover', (d, i: number) => {
        if (d !== 0) {
          this.mouseOver(d, i);
        }
      })
      .on('mouseout', (d, i: number) => {
        if (d !== 0) {
          this.mouseOut(d, i);
        }
      })
      .on('click', (d, i: number) => {
        if (d !== 0) {
          this.mouseOut(d, i);
          this.reInitialize();
        }
      });

    this.svgElement.selectAll('rect.legende')
      .data(this.repartition_matrix[indice])
      .transition('rect')
      .duration(500)
      .style('stroke', (d) => d === 0 ? 'white' : 'black')
      .attr('fill', (d, i: number) => color_matrix[indice][i]);

    // Texte
    this.svgElement.selectAll('text.legende')
      .data(this.tag_matrix[indice])
      .enter()
      .append('text')
      .attr('class', 'legende')
      .text((d) => d)
      .attr('x', () => this.donutProps.donutXPos + 410)
      .attr('y', (d, i: number) => 182 + 53 * i)
      .attr('font-size', '25px');
  }

  /* FONCTIONS MOUSEOVER/MOUSEOUT*/
  // Mouseover
  private mouseOver(data, id: number): void {
    this.svgElement.selectAll('rect.legende')
      .attr('x', () => this.donutProps.donutXPos + 350)
      .attr('y', (d, i: number) => 150 + 53 * i)
      .attr('height', 50)
      .attr('width', 50);

    const newArc = this.d3Service.d3.arc()
      .innerRadius(this.donutProps.innerRadius - 5)
      .outerRadius(this.donutProps.outerRadius + 5);

    this.svgElement.selectAll('#path' + id)
        .transition('mouseOverPath')
        .duration(200)
        .attr('d', newArc);

    this.svgElement.selectAll('#rect' + id)
        .transition('mouseOverRect')
        .duration(200)
        .attr('height', 52)
        .attr('width', 52)
        .attr('x', () => this.donutProps.donutXPos + 349)
        .attr('y', 149 + 53 * id);

    this.svgElement.selectAll('#g' + id)
      .append('g')
      .append('text')
      .attr('class', 'mouse-text')
      .text((d) => d.value.toLocaleString('en'))
      .attr('font-size', '50px')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Verdana');

    this.svgElement.selectAll('#g' + id)
      .append('g')
      .append('text')
      .attr('class', 'mouse-text')
      .text(() => {
        if (this.repartition_matrix[3].indexOf(data) !== -1 && id === 0) {
          return passwords_matrix[3][0];
        }
        if (this.repartition.indexOf(data) !== -1) {
          return repartition_passwords[id];
        }
        else {
          let index = 0;
          this.repartition_matrix.forEach((d) => {
            if (d.indexOf(data) !== -1 ) {
              index = this.repartition_matrix.indexOf(d);
            }
          });
          return passwords_matrix[index][id];
        }
      })
      .attr('font-size', '25px')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Verdana')
      .attr('dy', '1.3em');

    let sum = 1;
    let row = 1000;
    const total = this.repartition.reduce((a, b) => a + b, 0);

    this.repartition_matrix.forEach((d) => {
      if (d.indexOf(data) !== -1) {
        row = this.repartition_matrix.indexOf(d);
      }
    });

    if (row === 3 && id === 3) {
      row = 1000;
    }

    if (row !== 1000) {
      sum = this.repartition_matrix[row].reduce((a, b) => a + b, 0);
    }
    else {
      sum = total;
    }

    this.svgElement.selectAll('#g' + id)
      .append('g')
      .append('text')
      .attr('class', 'mouse-text')
      .text((d) => (100 * d.value / total).toFixed(2) + '% du total')
      .attr('font-size', '15px')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Verdana')
      .attr('dy', '3.7em');

    if (sum !== total) {
      this.svgElement.selectAll('#g' + id)
        .append('g')
        .append('text')
        .attr('class', 'mouse-text')
        .text((d) => (100 * d.value / sum).toFixed(2) + '% de la catégorie')
        .attr('font-size', '15px')
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Verdana')
        .attr('dy', '4.9em');
    }
  }

  // Mouseout
  private mouseOut(data, id: number): void {
    // Donut
    this.svgElement.selectAll('#path' + id)
      .transition('mouseOutPath')
      .duration(200)
      .attr('d', (d) => this.donutProps.arc(d));

    // Rectangles
    this.svgElement.selectAll('#rect' + id)
      .transition('mouseOutRect')
      .duration(200)
      .attr('height', 50)
      .attr('width', 50)
      .attr('x', () => this.donutProps.donutXPos + 350)
      .attr('y', () => 150 + 53 * id);

    this.svgElement.selectAll('.mouse-text').remove();
  }
}

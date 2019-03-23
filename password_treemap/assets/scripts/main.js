//http://bl.ocks.org/guglielmo/16d880a6615da7f502116220cb551498

(async function(d3, localization) {
  "use strict";

  var margin = { top:30, right:0, bottom:20, left:0 };
  var width = 900;
  var height = 650;
  var transitioning; 
  var formatNumber = d3.format(",");

  var x = d3.scaleLinear()
    .domain([0, width])
    .range([0, width]);
  var y = d3.scaleLinear()
    .domain([0, height])
    .range([0, height]);

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  /***** Création du treemap *****/
  var treemap = d3.treemap()
   .tile(d3["treemapBinary"])
   .size([width, height])
   .paddingInner(0)
   .round(false);

  /***** Chargement des données synchrone *****/
  var json = {}
  await new Promise((resolve, reject) => {
      d3.json("data_100.json").then(function(data) {
        json = data;
        resolve();
    });
  });

  /***** BARCHART *****/
  var barChartMargin = {
    top: 0,
    right: 40,
    bottom: 0,
    left: 40
  };
  var barChartWidth = 300 - barChartMargin.left - barChartMargin.right;
  var barChartHeight = 150 - barChartMargin.top - barChartMargin.bottom;

  /***** Création des éléments du diagramme à barres *****/
  var barChartSvg = d3.select("#bar-chart")
    .attr("width", barChartWidth + barChartMargin.left + barChartMargin.right)
    .attr("height", barChartHeight + barChartMargin.top + barChartMargin.bottom)
    .attr("transform", `translate(${width + 50}, ${30})`)
  

  var barChartGroup = barChartSvg.append("g")
    .attr("transform", "translate(" + barChartMargin.left + "," + barChartMargin.top + ")");

  var barChartBarsGroup = barChartGroup.append("g");
  var barChartAxisGroup = barChartGroup.append("g")
    .attr("class", "axis y");

  // On ajoute un clipPath pour pas que l'animation du treemap sorte de ses dimensions
  d3.select("svg")  
    .attr("width", "100%")
    .attr("height", height + margin.bottom + margin.top);
  d3.select("svg")
    .append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom + margin.top)
    
  // Treemap
  var svg = d3.select("#treemap")
    .attr("clip-path", "url(#clip)")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom + margin.top)
    .attr("margin-left", -margin.left + "px")
    .attr("margin-right",-margin.right + "px")
    .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .style("shape-rendering", "crispEdges");

  //Navigation
  var grandparent = svg.append("g")
    .attr("class", "grandparent");  
  grandparent.append("rect")
    .attr("y", -margin.top)
    .attr("width", width)
    .attr("height", margin.top)
    .attr("fill", '#bbbbbb');
  grandparent.append("text")
    .attr("x", 6)
    .attr("y", 6 - margin.top)
    .attr("dy", ".75em");  

  var root = d3.hierarchy(json);
  treemap(root.sum(function (d) {
              return d.value;
          })
          .sort(function (a, b) {
              return b.height - a.height || b.value - a.value
          }));
  display(root);

  /**
   * Crée ou met à jour le treemap en fonction du noeud d
   * @param {Node} d 
   */
  function display(d) {
    //Bar chart
    updateBarChart(d);
    d3.select("#bar-chart")
      .attr("visibility", () => {
        if (d.data.name == 'catégories')
          return 'hidden';
        return 'visible';
      });

    // Barre de navigation
    grandparent.datum(d)
      .on("click", d => transition(d.parent))
      .select("text")
      .text(d => name(d))
      .attr("fill", d => {if(d.data.name !== "catégories") return "#fff"})
    grandparent.datum(d)
        .select("rect")
        .attr("fill", d => {
          var alt = d.data.name.match(/\((.*)\)/) // Au cas où le nom est 'restants (*)'
          var name = ""
          if (alt)
            name = alt[1]
          else
            name = d.data.name
          if(name === "catégories") return "#fff";
          else return color(name)
        });        

    //Ajoute les éléments du treemap au même niveau que la balise de la barre de navigation
    var g1 = svg.insert("g", ".grandparent")
      .datum(d)
      .attr("class", "depth");

    // Ajoute les enfants de chaque éléments du treemap
    var g = g1.selectAll("g")
      .data(d.children)
      .enter()
      .append("g")
    g.selectAll(".child")
      .data(d => d.children || [d])
      .enter()
      .append("rect")
      .attr("class", "child")
      .call(rect);
    g.append("rect")
      .attr("class", "parent")
      .call(rect)
      .append("title")
      .text(d => d.data.name);
    g.append("foreignObject")
      .call(rect)
      .attr("class", "foreignobj")
      .append("xhtml:div")
      .attr("dy", ".5em")
      .html(function (d) {
          return '' +
              '<p class="title"> ' + d.data.name + '</p>' +
              '<p>' + formatNumber(d.value) + '</p>';
      })
      .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS

    //Si on est pas à la racine de l'arbre et qu'il y a des enfants qu'il est possible de cliquer on les fait clignoter
    g.filter(d => d.children)
      .classed("children", true)      
      .classed("blink", (d)=> {
        return d.parent.data.name != "catégories" && d.parent.data.name != "significations"
      })
      .on("click", transition);

    /**
     * Transition entre les parents/enfants
     * @param {*} d 
     */
    function transition(d) {
      if (transitioning || !d) return;
      transitioning = true;
      var g2 = display(d),
          t1 = g1.transition().duration(650),
          t2 = g2.transition().duration(650);
      // Update the domain only after entering new elements.
      x.domain([d.x0, d.x1]);
      y.domain([d.y0, d.y1]);
      // Enable anti-aliasing during the transition.
      svg.style("shape-rendering", null);
      // Draw child nodes on top of parent nodes.
      svg.selectAll(".depth").sort(function (a, b) {
          return a.depth - b.depth;
      });
      // Fade-in entering text.
      g2.selectAll("text").style("fill-opacity", 0);
      g2.selectAll("foreignObject div").style("display", "none");
      /*added*/
      // Transition to the new view.
      t1.selectAll("text").call(text).style("fill-opacity", 0);
      t2.selectAll("text").call(text).style("fill-opacity", 1);
      t1.selectAll("rect").call(rect);
      t2.selectAll("rect").call(rect);
      /* Foreign object */
      t1.selectAll(".textdiv").style("display", "none");
      /* added */
      t1.selectAll(".foreignobj").call(foreign);
      /* added */
      t2.selectAll(".textdiv").style("display", "block");
      /* added */
      t2.selectAll(".foreignobj").call(foreign);
      /* added */
      // Remove the old node when the transition is finished.
      t1.on("end.remove", function(){
          this.remove();
          transitioning = false;
      });
    }
    return g;
  }
  function text(text) {
    text.attr("x", function (d) {
        return x(d.x) + 6;
      })
      .attr("y", function (d) {
          return y(d.y) + 6;
      });
  }
  function rect(rect) {
  rect
      .attr("x", function (d) {
          return x(d.x0);
      })
      .attr("y", function (d) {
          return y(d.y0);
      })
      .attr("width", function (d) {
          return x(d.x1) - x(d.x0);
      })
      .attr("height", function (d) {
          return y(d.y1) - y(d.y0);
      })
      .attr("fill", function (d) {
        while (d.depth > 1) d = d.parent; 
        return color(d.data.name); 
      });
  }
  function foreign(foreign) { /* added */
    foreign
        .attr("x", function (d) {
            return x(d.x0);
        })
        .attr("y", function (d) {
            return y(d.y0);
        })
        .attr("width", function (d) {
            return x(d.x1) - x(d.x0);
        })
        .attr("height", function (d) {
            return y(d.y1) - y(d.y0);
        });
  }
  function name(d) {
    return breadcrumbs(d) +
        (d.parent
        ? " - Cliquez ici pour revenir"
        : " - Sélectionner une catégorie" );
  }
  function breadcrumbs(d) {
    var res = "";
    var sep = " > ";
    d.ancestors().reverse().forEach(function(i){
        res += i.data.name + sep;
    });
    return res
        .split(sep)
        .filter(function(i){
            return i!== "";
        })
        .join(sep);
    }
  function updateBarChart(d) {
    
    var data = d.children.map(x => x);
    data = data.filter((x) => {
      return x.children === undefined
    })
    data = data.slice(0,5);

    var x_bar = d3.scaleLinear()
      .range([0, barChartWidth*3/4])
      .domain([0, d3.max(data, x => x.value)])
    var y_bar = d3.scaleBand()
      .range([0, barChartHeight])
      .domain(data.map(x => x.data.name))
      .padding(0.1)

    var yAxis = d3.axisLeft(y_bar);

    var bars = barChartBarsGroup.selectAll("g")
      .remove()
      .exit()
      .data(data);
    
    barChartAxisGroup.call(yAxis);
      
    bars = bars.enter().append("g");
    bars.append("rect")
      .attr("class", "bar")
      .attr("y", (d, i) => y_bar(d.data.name))
      .attr("width", d => x_bar(d.value))
      .attr("height", d => y_bar.bandwidth())
      .attr("fill", d => {
          while (d.depth > 1) d = d.parent; 
          return color(d.data.name); 
      });
    bars.append("text")
      .attr("class", "label")
      .attr("y", d => y_bar(d.data.name) + y_bar.bandwidth() / 2 + 4)
      .attr("x", d => x_bar(d.value) + 3)
      .text(d => formatNumber(d.value));
  }

})(d3, localization);
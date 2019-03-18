//http://bl.ocks.org/guglielmo/16d880a6615da7f502116220cb551498

(async function(d3, localization) {
  "use strict";

  var files = [
    "./data/annees.csv",
    "./data/brands.csv",
    "./data/cities.csv",
    "./data/countries.csv",
    "./data/famous.csv",
    "./data/names.csv",
    "./data/shows.csv",
    "./data/words.csv"
  ];

  var margin = { top:30, right:0, bottom:20, left:0 };
  var width = 1000;
  var height = 600;
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

  /***** Chargement des données *****/
  var json = {"name": "Catégories", "children": []}
  await new Promise((resolve, reject) => {
    var counter = 0; 
    files.forEach(async (file) => {     
      d3.csv(file).then(function(data) {
        //var col = data.columns;
        //var perc = 0.05*data.length;
        //data = data.slice(0, 200);
        //data.columns = col;
        weight(data);
        json.children.push(hierarchy(data));
        counter++;
        if(counter === files.length)
          resolve("done!");
      });
    });
  });
 
  var meaning = await meanings();
  json.children.push(hierarchy(meaning));

  var svg = d3.select("#treemap")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom + margin.top)
    .attr("margin-left", -margin.left + "px")
    .attr("margin-right",-margin.right + "px")
    .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .style("shape-rendering", "crispEdges");

  //Titre
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

  function display(d) {
    grandparent.datum(d)
      .on("click", d => transition(d.parent))
      .select("text")
      .text(d => name(d))
      .attr("fill", d => {if(d.data.name !== "Catégories") return "#fff"})
    grandparent.datum(d)
        .select("rect")
        .attr("fill", d => {
          if(d.data.name === "Catégories") return "#fff";
          else return color(d.data.name)
        });        

    //Layout top
    var g1 = svg.insert("g", ".grandparent")
      .datum(d)
      .attr("class", "depth");
    //Catégories
    var g = g1.selectAll("g")
      .data(d.children)
      .enter()
      .append("g");
    g.filter(d => d.children)
      .classed("children", true)
      .on("click", transition);
    //Sous-catégories
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

})(d3, localization);
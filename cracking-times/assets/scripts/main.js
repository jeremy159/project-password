// https://bl.ocks.org/d3noob/119a138ef9bd1d8f0a8d57ea72355252

(async function(d3) {
  "use strict";

    var fichier_cumulatif = "./data/cumulatif_0_to_95.json"
    var fichier_densite = "./data/density_0_to_95.json";

    // set the dimensions and margins of the graph
    var colors = ["#69b3a2", "#6900a2"]
    var margin = {top: 60, right: 100, bottom: 50, left: 50};
    var Graph = {
        top: margin.top,
        right: margin.right,
        bottom: margin.bottom,
        left: margin.left,
        width: 1000,
        height: 600
    }
    var Legend = {
        left: Graph.width - 60,
        top: margin.top
    }

    var cumulatifPoints, densityPoints;
    var bars, text;

    var formatPercent4Decimal = d3.format(".4%");
    var formatPercent = d3.format(".2%");
    var formatMinutes = function(secondes) {
        var decimalFormat = d3.format("02");
        var minutes = secondes % 60;
        return `${Math.floor(secondes/60)}:${decimalFormat(secondes % 60)}`;
    }

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", Graph.width + margin.left + margin.right)
    .attr("height", Graph.height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",`translate(${Graph.left},${Graph.top})`);

   svg.append("text")
        .attr("class", "axisTitle")
        .attr("transform", `translate(${-margin.left}, ${-30})`)
        .text("Pourcentage de mots de passes décryptés")

    svg.append("text")
        .attr("class", "axisTitle")
        .attr("transform", `translate(${(Graph.width)/2}, ${Graph.height + 40})`)
        .text("minutes")

    //Tooltip
    /*var tooltip = d3.select("#my_dataviz")
        .append("div")
        .attr("class", "tooltip")
        .style("display", "none");*/

    /*var mouseover = function() {
        tooltip.style("display", "inline");
    }*/
    
    var mousemove = function(d) {
        var cumulatif = cumulatifPoints.filter(p => p.t == d.t);
        var bar = bars.filter(p => p.t == d.t);
        cumulatif.transition()
            .duration(.1)
            .ease(d3.easeExpInOut)
            .attr("r", 6);
        var density = densityPoints.filter(p => p.t == d.t);
        var contribution = density.data();       
        density.transition()
            .duration(.1)
            .ease(d3.easeExpInOut)
            .attr("r", 6);
        bar.attr("opacity", 1);
        /*tooltip.html(
            `
            <p>${formatPercent(d.n)} mots de passe décryptés en ${formatMinutes(d.t)} minutes</p>
            <p> ${formatPercent4Decimal(contribution[0].n)} des mots de passes sont décryptés à cet instant précis </p>
            `
            )
            .style("left", (d3.event.pageX + 20) + "px")
            .style("top", (d3.event.pageY - 100) + "px");*/
        text.text(`${formatPercent(d.n)} des mots de passes sont déchiffés en moins de ${formatMinutes(d.t)} minutes!`)
    }
    var mouseout = function(d) {
        var cumulatif = cumulatifPoints.filter(p => p.t == d.t);
        var bar = bars.filter(p => p.t == d.t); 
        cumulatif.transition()
            .duration(.1)
            .ease(d3.easeExpInOut)
            .attr("r", 0);
        var density = densityPoints.filter(p => p.t == d.t);   
        density.transition()
            .duration(.1)
            .ease(d3.easeExpInOut)
            .attr("r", 0);
        bar.attr("opacity", 0);
        //tooltip.style("display", "none");
    }

    // get the data
    d3.json(fichier_cumulatif).then(function(cumulatif) {

        // Add X axis --> it is a date format
        var x = d3.scaleLinear()
            .domain([d3.min(cumulatif.data, d => d.t), d3.max(cumulatif.data, d => d.t)])
            .range([0, Graph.width ]);
        var xAxis = d3.axisBottom()
            .scale(x)
            .tickFormat(formatMinutes)
        var graph = svg.append("g")
            .attr("transform", `translate(0,${Graph.height})`)
            .call(xAxis);
        
        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, 1])
            // .domain([d3.min(cumulatif.data, d => d.n), 1])
            .range([Graph.height, 0]);
        var yAxis = d3.axisLeft()
            .scale(y)
            .tickFormat(formatPercent);
        svg.append("g")
            .call(yAxis);

        var barWidth = Graph.width / d3.max(cumulatif.data, d => d.t) + 1;

        // append the bar rectangles to the svg element
        bars = svg.append("g")
            .selectAll("rect")
            .data(cumulatif.data)
            .enter().append("rect")
            .attr("fill", "lightgray")
            .attr("opacity", 0)
            .attr("stroke-width", 0)
            .attr("x", 1)
            .attr("transform", d => `translate(${x(d.t) - barWidth/2}, ${y(d.n)})`)
            .attr("width", barWidth)
            .attr("height", d => Graph.height - y(d.n) )
            //.on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseout);

        svg.append("path")
            .datum(cumulatif.data)
            .attr("fill", "none")
            .attr("stroke", colors[0])
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                //http://bl.ocks.org/d3indepth/b6d4845973089bc1012dec1674d3aff8
                .curve(d3.curveMonotoneX)
                .x(function(d) { return x(d.t) })
                .y(function(d) { return y(d.n) })
                );
         // Add the points
        cumulatifPoints = svg.append("g")
            .selectAll("dot")
            .data(cumulatif.data)
            .enter()
            .append("circle")
            .attr("cx", function(d) { return x(d.t) } )
            .attr("cy", function(d) { return y(d.n) } )
            .attr("r", 0)
            .attr("fill", colors[0])
            //.on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseout);

        svg.append('line')
            .attr("x1", 0)
            .attr("y1", y(0.95))
            .attr("x2", Graph.width )
            .attr("y2", y(0.95))
            .attr("stroke-width", 0.5)
            .attr("stroke", "black")
        
            svg.append('text')
            .attr("transform", d => `translate(${Graph.width + 10}, ${y(0.95)})`)
            .text("95% ")

        //Fait saillant
        text = svg.append("text")
            .attr("class", "highlight")
            .attr("transform", d => `translate(${Graph.width/2}, ${Graph.height / 2})`)
            .text(`95% des mots de passes sont décryptés en moins de ${formatMinutes(d3.max(cumulatif.data, d => d.t))} minutes!`)

        // Add the line
        d3.json(fichier_densite).then(function(density) {
            svg.append("path")
                .datum(density.data)
                .attr("fill", "none")
                .attr("stroke", colors[1])
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    //http://bl.ocks.org/d3indepth/b6d4845973089bc1012dec1674d3aff8
                    .curve(d3.curveMonotoneX)
                    .x(function(d) { return x(d.t) })
                    .y(function(d) { return y(d.n) })
                    );
            // Add the points
            densityPoints = svg.append("g")
                .selectAll("dot")
                .data(density.data)
                .enter()
                .append("circle")
                .attr("cx", function(d) { return x(d.t) } )
                .attr("cy", function(d) { return y(d.n) } )
                .attr("r", 0)
                .attr("fill", colors[1])
                //.on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseout);

            var legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${Legend.left - 100}, ${Legend.top})`);
            
            legend.append("rect")
                .attr("width", "140px")
                .attr("height", "70px")
                .attr("fill", "#fff")
                .attr("stroke-width", "0.5px")
                .attr("stroke", "gray");
        
            var cumulatifLegend = legend.append("g")
                .attr("transform", `translate(${10}, ${10})`);
            cumulatifLegend.append("rect")
                .attr("class", "legend")
                .attr("width", "10px")
                .attr("height", "10px")
                .attr("fill", colors[0])
                .attr("stroke-width", "0.5px")
                .attr("stroke", "gray")
                .attr("transform", `translate(${10}, ${10})`);
            cumulatifLegend.append("text")
                .text("Cumulatif")
                .attr("transform", `translate(${30}, ${20})`);

            var density = legend.append("g")
                .attr("transform", `translate(${10}, ${30})`);
            density.append("rect")
                .attr("class", "legend")
                .attr("width", "10px")
                .attr("height", "10px")
                .attr("fill", colors[1])
                .attr("stroke-width", "0.5px")
                .attr("stroke", "gray")
                .attr("transform", `translate(${10}, ${10})`);
            cumulatifLegend.append("text")
                    .text("Densité")
                    .attr("transform", `translate(${30}, ${40})`);
        });
    });

})(d3, localization);
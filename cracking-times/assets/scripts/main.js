// https://bl.ocks.org/d3noob/119a138ef9bd1d8f0a8d57ea72355252

(async function(d3) {
  "use strict";

    var fichier_cumulatif = "./data/cumulatif_0_to_95.json"
    var fichier_densite = "./data/density_0_to_95.json";

    // On défini les attributs général du graphique
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

    //Variables utilisés dans les actions
    var cumulatifPoints, densityPoints;
    var bars, text;

    // Formattage
    var formatPercent = d3.format(".2%");
    var formatMinutes = function(secondes) {
        var decimalFormat = d3.format("02");
        var minutes = secondes % 60;
        return `${Math.floor(secondes/60)}:${decimalFormat(secondes % 60)}`;
    }

    // On ajoute le svg au div
    var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", Graph.width + margin.left + margin.right)
        .attr("height", Graph.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",`translate(${Graph.left},${Graph.top})`);

    // Titre de l'axe y
    svg.append("text")
        .attr("class", "axisTitle")
        .attr("transform", `translate(${-margin.left}, ${-30})`)
        .text("Pourcentage de mots de passes décryptés")

    // Titre de l'axe x
    svg.append("text")
        .attr("class", "axisTitle")
        .attr("transform", `translate(${(Graph.width)/2}, ${Graph.height + 40})`)
        .text("minutes")
    
    /**
     * Affiche les cercles et la barre associé à l'élément survoler
     * @param {*} d 
     */
    var mouseover = function(d) {
        var cumulatif = cumulatifPoints.filter(p => p.t == d.t);
        var density = densityPoints.filter(p => p.t == d.t);  
        var bar = bars.filter(p => p.t == d.t);
        bar.attr("opacity", 1);
        cumulatif.attr("r", 6);
        density.attr("r", 6);
        text.text(`${formatPercent(d.n)} des mots de passes sont déchiffés en moins de ${formatMinutes(d.t)} minutes!`)
    }
    /**
     *  Fait disparaitre les cercles et la barre associé à l'élément survoler
     * @param {*} d 
     */
    var mouseout = function(d) {
        var cumulatif = cumulatifPoints.filter(p => p.t == d.t);
        var bar = bars.filter(p => p.t == d.t); 
        cumulatif.attr("r", 0);
        var density = densityPoints.filter(p => p.t == d.t);   
        density.attr("r", 0);
        bar.attr("opacity", 0);
    }

    // get the data
    d3.json(fichier_cumulatif).then(function(cumulatif) {

        // Définition des axes
        // Axe x
        var x = d3.scaleLinear()
            .domain([d3.min(cumulatif.data, d => d.t), d3.max(cumulatif.data, d => d.t)])
            .range([0, Graph.width ]);
        var xAxis = d3.axisBottom()
            .scale(x)
            .tickFormat(formatMinutes)   
            .ticks(16)     
        // Axe y
        var y = d3.scaleLinear()
            .domain([0, 1])
            // .domain([d3.min(cumulatif.data, d => d.n), 1])
            .range([Graph.height, 0]);
        var yAxis = d3.axisLeft()
            .scale(y)
            .tickFormat(formatPercent);

        // Création des graphs
        svg.append("g")
            .attr("transform", `translate(0,${Graph.height})`)
            .call(xAxis);       
        svg.append("g")
            .call(yAxis);

        var barWidth = Graph.width / d3.max(cumulatif.data, d => d.t) + 1;

        // Création des barres
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
            .on("mouseover", mouseover)
            .on("mouseleave", mouseout);

        // Création de la courbe cumulative
        svg.append("path")
            .datum(cumulatif.data)
            .attr("fill", "none")
            .attr("stroke", colors[0])
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .curve(d3.curveMonotoneX)
                .x(function(d) { return x(d.t) })
                .y(function(d) { return y(d.n) })
                );

         // Ajout des points associés à la courbe cumulative
        cumulatifPoints = svg.append("g")
            .selectAll("dot")
            .data(cumulatif.data)
            .enter()
            .append("circle")
            .attr("cx", function(d) { return x(d.t) } )
            .attr("cy", function(d) { return y(d.n) } )
            .attr("pointer-events", "none")
            .attr("r", 0)
            .attr("fill", colors[0])
            .on("mouseover", mouseover)
            .on("mouseleave", mouseout);

        // Ajout de la ligne indiquant le 95%
        svg.append('line')
            .attr("x1", 0)
            .attr("y1", y(0.95))
            .attr("x2", Graph.width )
            .attr("y2", y(0.95))
            .attr("stroke-width", 0.5)
            .attr("stroke", "black")
        //Text associé à la limite 95%
        svg.append('text')
            .attr("transform", d => `translate(${Graph.width + 10}, ${y(0.95)})`)
            .text("95% ")

        //Fait saillant
        text = svg.append("text")
            .attr("class", "highlight")
            .attr("transform", d => `translate(${Graph.width/2}, ${Graph.height / 2})`)
            .text(`95% des mots de passes sont décryptés en moins de ${formatMinutes(d3.max(cumulatif.data, d => d.t))} minutes!`)

        // On répète le même processus, mais seulement pour la courbe de densité et ses points
        d3.json(fichier_densite).then(function(density) {
            // courbe
            svg.append("path")
                .datum(density.data)
                .attr("fill", "none")
                .attr("stroke", colors[1])
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .curve(d3.curveMonotoneX)
                    .x(function(d) { return x(d.t) })
                    .y(function(d) { return y(d.n) })
                    )
            // Point
            densityPoints = svg.append("g")
                .selectAll("dot")
                .data(density.data)
                .enter()
                .append("circle")
                .attr("cx", function(d) { return x(d.t) } )
                .attr("cy", function(d) { return y(d.n) } )
                .attr("pointer-events", "none")
                .attr("r", 0)
                .attr("fill", colors[1])
                .on("mouseover", mouseover)
                .on("mouseleave", mouseout);

            // Finalement, on ajoute une légende
            var legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${Legend.left - 100}, ${Legend.top})`);
            legend.append("rect")
                .attr("width", "140px")
                .attr("height", "70px")
                .attr("fill", "#fff")
                .attr("stroke-width", "0.5px")
                .attr("stroke", "gray");

            // Légende pour le cumulatif
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

            // Légende pour la densité
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
//http://bl.ocks.org/tjdecke/5558084

(async function(d3, localization) {
  "use strict";

    var margin = { top: 50, right:0, bottom:100, left:30 };
    var width = 960 - margin.left - margin.right;
    var height = 225 - margin.top - margin.bottom;
    var gridSize = Math.floor(width / 60);
    var legendElementWidth = gridSize*4;
    var buckets = 9;
    var colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"]; // alternatively colorbrewer.YlGnBu[9]
    var days = ["day"];
    var times = [];
    var format = d3.format(",");

    for(var i=0; i < 60; i++) {
        times.push(i);
    }
    var datasets = ["data/crackingTimes.csv"];

    var svg = d3.select("#heatmap").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    var dayLabels = svg.selectAll(".dayLabel")
        .data(days)
        .enter()
        .text(d => d)
        .append("text")
        .text(d => d)
        .attr("x", 0)
        .attr("y", (d,i) =>  {
            return i*gridSize
        })
        .style("text-anchor", "end")
        .attr("transform", `translate(-6, ${gridSize/1.5})`)
        .attr("class", (d,i) => ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"));

    var timeLabels = svg.selectAll(".timeLabel")
        .data(times)
        .enter()
        .append("text")
        .text(d => d)
        .attr("x", (d, i) => {
            return i*gridSize
        })
        .attr("y", 0)
        .style("text-anchor", "middle")
        .attr("transform", `translate(${gridSize / 2}, -6)`)
        .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

    var heatmap = function(file) {
        return new Promise((resolve) => {
            d3.csv(file).then(function(data) {
                data = data.slice(0,60);
                var max = d3.max(data, d => parseInt(d.t));
                var colorScale = d3.scaleQuantile()
                    .domain([0, buckets - 1, max])
                    .range(colors);

                var cards = svg.selectAll(".hour")
                    .data(data, function(d) {
                        return parseInt(d.t);
                    });

                //cards.append("title");

                cards.enter().append("rect")
                    .attr("x", function(d, i) { 
                        return i * gridSize; 
                    })
                    .attr("y", function(d, i) { 
                        //return i * gridSize;
                        return 0;
                    })
                    //.attr("rx", 4)
                    //.attr("ry", 4)
                    .attr("class", "hour bordered")
                    .attr("width", gridSize)
                    .attr("height", gridSize*3)
                    .transition().duration(1000)
                    .style("fill", d => colorScale(parseInt(d.t)));
                
                cards.exit().remove();

               var legend = svg.selectAll(".legend")
                    .data([0].concat(colorScale.quantiles()), function(d) { 
                        return d; 
                    });

                legend.enter().append("g")
                    .attr("class", "legend")
                    .append("rect")
                    .attr("x", function(d, i) { 
                        return legendElementWidth * i; 
                    })
                    .attr("y", height)
                    .attr("width", legendElementWidth)
                    .attr("height", gridSize)
                    .style("fill", function(d, i) { 
                        return colors[i]; 
                    });

                legend.enter().append("text")
                    .attr("class", "mono")
                    .text(function(d) { 
                        return "≥ " + Math.round(d); 
                    })
                    .style("text-anchor", "start")
                    .attr("x", function(d, i) { 
                        return legendElementWidth * i; 
                    })
                    .attr("y", height + gridSize*2)

                legend.exit().remove();
                resolve("Done!");
            });
        });
    }

    await heatmap(datasets[0]);
    
    /*var datasetpicker = d3.select("#dataset-picker").selectAll(".dataset-button")
        .data(datasets);

    datasetpicker.enter()
        .append("input")
        .attr("value", function(d){ return "Dataset " + d })
        .attr("type", "button")
        .attr("class", "dataset-button")
        .on("click", function(d) {
            heatmapChart(d);
        });*/

})(d3, localization);
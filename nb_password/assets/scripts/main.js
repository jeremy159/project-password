//http://bl.ocks.org/tjdecke/5558084

(async function(d3, localization) {
  "use strict";

    var json = {}
    await new Promise((resolve) => {
        d3.json('data.json').then(function(data) {
            json = data;
            resolve('done!');
        })
    });

    var datasets = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'];
    var domain = [10, 100, 1000, 10000, 100000, 1000000, 10000000]
    var colors = ["#5858e9", "#49bb36", "#3ae396", "#4de02c", "#cbdd1e", "#da5911", "#d70450"]
    const colorScaleLog = d3.scaleLog().domain(domain).range(colors);
    var format = d3.format(",");
    var tip = d3.tip().attr('class', 'd3-tip').html(d => format(d.value));
    var margin = { top: 100, right:0, bottom:50, left:100 };
    var width = 1300 + margin.left + margin.right;
    var height = 300 + margin.top + margin.bottom;

    var SVG = {
        top: margin.top,
        right: margin.right,
        bottom: margin.bottom,
        left: margin.left
    }
    var Legend = {
        top: SVG.top,
        right: SVG.right,
        bottom: SVG.bottom,
        left: SVG.left,
        barHeight: (height - SVG.top - margin.bottom)/(domain.length),
        barWidth: 15
    }
    var Heatmap = {
        top: Legend.top + Legend.barHeight*domain.length/2 - 55/2,
        right: SVG.right + 50,
        bottom: Legend.bottom,
        left: Legend.left + 150,
        barHeight: 55,
        barWidth: 0 //Est utilisé plus bas
    }
    var Buttons = {
        top: Heatmap.top - 40,
        right: 0,
        bottom: 0,
        left:Heatmap.left,
        buttonWidth:75,
        buttonHeight: 30,
        space: 7
    }
    var Cracked = {
        top: Heatmap.top + Heatmap.barHeight + 50,
        right: 0,
        bottom: 0,
        left: Heatmap.left,
        animate: {
            position: {
                top: 0,
                right: 0,
                botton: 0,
                left: 0
            }
        }
    }

    //heatmap svg
    var svg = d3.select("#heatmap")
        .append("svg")
        .attr("width", width)
        .attr("height", height)

    var buttonGroup = svg.append("g")
        .attr("id", "buttons")
        .attr("transform", `translate(${Buttons.left}, ${Buttons.top})`);
    buttonGroup.selectAll('rect')
        .data(datasets)
        .enter()
        .append('rect')
        .attr("class", "button")
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("transform", (d,i) => `translate(${i*(Buttons.buttonWidth + Buttons.space)}, ${0})`)
        .attr("width", Buttons.buttonWidth)
        .attr("height", Buttons.buttonHeight);
    buttonGroup.selectAll('text')
        .data(datasets)
        .enter()
        .append('text')
        .attr("transform", (d,i) => `translate(${i*(Buttons.buttonWidth + Buttons.space) + Buttons.buttonWidth/2}, ${Buttons.buttonHeight/2 + 4})`)
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .text(d => d)
    
    var crackedGroup = svg.append("g")
        .attr("id", "cracked")
        .attr("transform", (d,i) => `translate(${Cracked.left}, ${Cracked.top})`);
    crackedGroup.append('text')
        .attr("id", "count")
        .attr("transform", (d,i) => `translate(${Cracked.animate.position.left}, ${Cracked.animate.position.top + 50})`);
    crackedGroup.append('rect')
        .attr("class", "button")
        .attr("width", Buttons.buttonWidth + 30)
        .attr("height", Buttons.buttonHeight)
        //.attr("transform", (d,i) => `translate(${Cracked.animate.position.left}, ${Cracked.animate.position.top})`);
    crackedGroup.append("text")
        .attr("id", "buttonText")
        .attr("transform", (d,i) => `translate(${Cracked.animate.position.left + (Buttons.buttonWidth+30)/2}, ${Cracked.animate.position.top + Buttons.buttonHeight/2 + 4})`)
        .attr("text-anchor", "middle")
        .attr("pointer-events", "none")
        .text("Animer")

    var heatmapGroup = svg.append("g")
        .attr("id", "heatmap")
        .attr("transform", `translate(${Heatmap.left}, ${Heatmap.top})`);
        
    var legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", (d, i) => `translate(${Legend.left}, ${Legend.top})`);
    legend.append("text")
        .text("Légende")
        .attr("transform", (d, i) => `translate(${0}, ${-15})`);

    legend.append("g").selectAll(".legendBar")
        .data(domain)
        .enter()
        .append('rect')
        .attr("class", "legendBar")
        .attr("transform", (d, i) => `translate(${0}, ${(colors.length-i-1)*Legend.barHeight})`)
        .attr("width", Legend.barWidth)
        .attr("height", Legend.barHeight)
        .attr('fill', colorScaleLog);
    
    legend.append("g").selectAll("text")
        .data(domain)
        .enter()
        .append("text")
        .attr("transform", (d, i) => `translate(${Legend.barWidth + 5}, ${(colors.length-i-1)*Legend.barHeight + Legend.barHeight/2 + 5})`)
        .text((d) => `≤ ${format(d)}`)
        
    /*var count = d3.select("body")
        .append("div");*/

    var setunits = function(data, unit) {
        heatmapGroup.selectAll(".timeLabel")
            .remove()
            .exit()
            .data(data)
            .enter()
            .filter((d,i) => i % 5 == 0)
            .append("text")
            .text(d => `${d.t}`)
            .style("text-anchor", "left")
            .attr("transform", (d, i) => `translate(${(Heatmap.barWidth / 2) + i*5*Heatmap.barWidth - 5}, ${Heatmap.barHeight + 15})`)
            .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });
        
        /*heatmapGroup.select('text')
            //.attr("transform", (d, i) => `translate(${width}, ${-15})`)
            //.transition()
            //.duration(650)
            .text(d => unit)
            .attr("transform", (d, i) => `translate(${0}, ${-15})`)*/
    }

    var bars;
    var timeouts = []

    var clearTimeouts = function() {
        timeouts.forEach(t => {
            clearTimeout(t)
        });
    }

    var isAnimating = false;

    var reset = function() {
        clearTimeouts();
        isAnimating = false;
        crackedGroup.select("#buttonText")
            .text("Animer");
    }

    var animate = function(data, unit) {

        reset();
        isAnimating = true;
        crackedGroup.select("#buttonText")
            .text("Arrêter l'animation");
        // Mise à jour des barres
        var c = 0
        bars.enter().append("rect")
            .attr("transform", (d, i) => `translate(${i*Heatmap.barWidth}, ${0}) rotate(0)`)
            .attr("class", "bordered")
            .attr("width", Heatmap.barWidth)
            .attr("height", Heatmap.barHeight) 
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .style("fill", colorScaleLog(1))
            .transition().duration((d, i) => 300)
            .delay((d,i) => {
                var delay = i*100;
                timeouts.push(setTimeout(() => {
                    c += d.value;
                    crackedGroup.select('#count').text(d => `Nombre de mot de passe déchiffré : ${format(c)} après ${i} ${unit}`)
                    if(i == data.length) isAnimating = false;
                }, delay));
                return delay;
            })
            .style("fill", d => {
                return colorScaleLog(d.value)
            })
        heatmapGroup.call(tip);
    }
    
    var heatmap = function(data, unit) {

        reset();
        var MaxBarWidth = 20;
        var space = (width - Heatmap.left - Heatmap.right);

        if(space/data.length > MaxBarWidth)
            Heatmap.barWidth = MaxBarWidth;
        else
            Heatmap.barWidth = space/data.length;

        //Suppression des rectangles
        heatmapGroup.selectAll(".bordered").remove();

        // update heatmap 1D
        bars = heatmapGroup.selectAll(".bar").data(data);
        //Mise à jour des unités
        setunits(data, unit)

        bars.enter().append("rect")
            .attr("transform", (d, i) => `translate(${i*Heatmap.barWidth}, ${0}) rotate(0)`)
            .attr("class", "bordered")
            .attr("width", Heatmap.barWidth)
            .attr("height", Heatmap.barHeight) 
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .style("fill", d => {
                return colorScaleLog(d.value)
            });
        crackedGroup.select('#count').text(d => `Nombre de mot de passe déchiffré : ${format(d3.sum(data, d => d.value))} après ${data.length-1} ${unit}`)
        heatmapGroup.call(tip);
    };

    var data_init = 'seconds';
    buttonGroup.selectAll('.button')
        .filter(d => d == data_init)
        .attr('class', "button selected");
    heatmap(json.data[data_init], data_init);

    var lastSelection = data_init;
    buttonGroup.selectAll('.button')
        .on("click", d => {
            lastSelection = d;
            buttonGroup.selectAll('.button')
                .attr('class', e => {
                    if(d == e) return "button selected"
                    else return "button"
                })
            heatmap(json.data[d], d)
        });

    crackedGroup.select('.button')
        .on("click", function() {
            if(isAnimating) {            
                heatmap(json.data[lastSelection], lastSelection);
            }
            else {
                animate(json.data[lastSelection], lastSelection);
            }
        });

    

})(d3, localization);
"use strict";

/**
 * Pondère chaque élément de la liste
 * @param {*} data : Liste de donnée
 */
function weight(data) {
  //sum
  var sum = 0;
  data.forEach(d => {
    sum += parseInt(d.count);
  });

  //weight
  data.forEach(d => {
    d.weight = parseInt(d.count) / sum;
  });

  //sort by weight
  data.sort((a,b) => b.weight - a.weight);
}

/**
 * Construit de manière récursif une structure de données contenant maximum 20 éléments par niveau de l'arbre
 * @param {*} data 
 */
function hierarchy(data) {
  var h = {"name": data.columns[0], "children": [] };
  for(var i=0; i < data.length; i++) {
    var d = data[i];
    if(i === 20) {
      var recursive = data.slice(i,data.length);
      recursive.columns = data.columns;
      //On ajoute un enfant avec les éléments restants
      h.children.push(hierarchy(recursive));
      break;
    }
    h.children.push({"name": d[data.columns[0]], "value": d[data.columns[1]], "weight": d.weight });
  };
  return h;
}

function meanings() {
  var files = [
    "./data/allMeanings/adj-all.csv",
    "./data/allMeanings/adj-pert.csv",
    "./data/allMeanings/adj-ppl.csv",
    "./data/allMeanings/adv-all.csv",
    "./data/allMeanings/noun-act.csv",
    "./data/allMeanings/noun-animal.csv",
    "./data/allMeanings/noun-artifact.csv",
    "./data/allMeanings/noun-attribute.csv",
    "./data/allMeanings/noun-body.csv",
    "./data/allMeanings/noun-cognition.csv",
    "./data/allMeanings/noun-communication.csv",
    "./data/allMeanings/noun-event.csv",
    "./data/allMeanings/noun-feeling.csv",
    "./data/allMeanings/noun-food.csv",
    "./data/allMeanings/noun-group.csv",
    "./data/allMeanings/noun-location.csv",
    "./data/allMeanings/noun-motive.csv",
    "./data/allMeanings/noun-object.csv",
    "./data/allMeanings/noun-person.csv",
    "./data/allMeanings/noun-phenomenon.csv",
    "./data/allMeanings/noun-plant.csv",
    "./data/allMeanings/noun-possession.csv",
    "./data/allMeanings/noun-process.csv",
    "./data/allMeanings/noun-quantity.csv",
    "./data/allMeanings/noun-relation.csv",
    "./data/allMeanings/noun-shape.csv",
    "./data/allMeanings/noun-state.csv",
    "./data/allMeanings/noun-substance.csv",
    "./data/allMeanings/noun-time.csv",
    "./data/allMeanings/noun-Tops.csv",
    "./data/allMeanings/verb-body.csv",
    "./data/allMeanings/verb-change.csv",
    "./data/allMeanings/verb-cognition.csv",
    "./data/allMeanings/verb-communication.csv",
    "./data/allMeanings/verb-competition.csv",
    "./data/allMeanings/verb-consumption.csv",
    "./data/allMeanings/verb-contact.csv",
    "./data/allMeanings/verb-creation.csv",
    "./data/allMeanings/verb-emotion.csv",
    "./data/allMeanings/verb-motion.csv",
    "./data/allMeanings/verb-perception.csv",
    "./data/allMeanings/verb-possession.csv",
    "./data/allMeanings/verb-social.csv",
    "./data/allMeanings/verb-stative.csv",
    "./data/allMeanings/verb-weather.csv",
  ];
  var json = {};
  var counter = 0;
  return new Promise((resolve, reject) => {
    files.forEach(async (f) => {
      var filename = f.split("/")[3];
      var type = filename.split("-")[0];
      var name = filename.split("-")[1].split(".")[0];
      if(json[type] === undefined) json[type] = [];
        d3.text(f).then((d) => {
          json[type][name] = d3.csvParseRows(d).map((d) => d[0]);
          counter++;
          if(counter === files.length)
            resolve(json);
        });
    });
  });
}



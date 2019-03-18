"use strict";

/**
 * Fichier permettant de gérer l'affichage du panneau d'informations pour une circonscription.
 */


/**
 * Met à jour les domaines X et Y utilisés par le diagramme à bandes horizontales lorsque les données sont modifiées.
 *
 * @param districtSource    Les données associées à une circonscription.
 * @param x                 L'échelle X.
 * @param y                 L'échelle Y.
 */
function updateDomains(districtSource, x, y) {
  /* Mettre à jour les domaines selon les spécifications suivantes:
       - Le domaine X varie entre le minimum et le maximum de votes obtenus pour les candidats de la circonscription;
       - Le domaine Y correspond au nom des partis politiques associés aux candidats qui se sont présentés. Assurez-vous
         que les partis sont triés en ordre décroissant de votes obtenus (le parti du candidat gagnant doit se retrouver
         en premier).
   */
  //var votes = districtSource.result.map(d => d.votes);
  x.domain(d3.extent(districtSource.result.map(d => d.votes)));
  y.domain(districtSource.result.map(d => d.party));
}

/**
 * Met à jour les informations textuelles se trouvant dans le panneau à partir des nouvelles données fournies.
 *
 * @param panel             L'élément D3 correspondant au panneau.
 * @param districtSource    Les données associées à une circonscription.
 * @param formatNumber      Fonction permettant de formater correctement des nombres.
 */
function updatePanelInfo(panel, districtSource, formatNumber) {
  /* Mettre à jour les informations textuelles suivantes:
       - Le nom de la circonscription ainsi que le numéro;
       - La nom du candidat gagnant ainsi que son parti;
       - Le nombre total de votes pour tous les candidats (utilisez la fonction "formatNumber" pour formater le nombre).
   */
  panel.select("#district-name").text(districtSource.name + " [" + formatNumber(districtSource.id) + "]");
  panel.select("#elected-candidate").text(districtSource.result[0].candidate);
  panel.select("#votes-count").text(formatNumber(d3.sum(districtSource.result, (d) => d.votes)) + " votes")
}

/**
 * Met à jour le diagramme à bandes horizontales à partir des nouvelles données de la circonscription sélectionnée.
 *
 * @param gBars             Le groupe dans lequel les barres du graphique doivent être créées.
 * @param gAxis             Le groupe dans lequel l'axe des Y du graphique doit être créé.
 * @param districtSource    Les données associées à une circonscription.
 * @param x                 L'échelle X.
 * @param y                 L'échelle Y.
 * @param yAxis             L'axe des Y.
 * @param color             L'échelle de couleurs qui est associée à chacun des partis politiques.
 * @param parties           Les informations à utiliser sur les différents partis.
 *
 * @see https://bl.ocks.org/hrecht/f84012ee860cb4da66331f18d588eee3
 */
function updatePanelBarChart(gBars, gAxis, districtSource, x, y, yAxis, color, parties) {
  /* Créer ou mettre à jour le graphique selon les spécifications suivantes:
       - Le nombre de votes des candidats doit être affiché en ordre décroissant;
       - Le pourcentage obtenu par chacun des candidat doit être affiché à droite de le barre;
       - La couleur de la barre doit correspondre à la couleur du parti du candidat. Si le parti du candidat n'est pas
         dans le domaine de l'échelle de couleurs, la barre doit être coloriée en gris;
       - Le nom des partis doit être affiché sous la forme abrégée. Il est possible d'obtenir la forme abrégée d'un parti
         via la liste "parties" passée en paramètre. Il est à noter que si le parti ne se trouve pas dans la liste "parties",
         vous devez indiquer "Autre" comme forme abrégée.
   */
 
  //Notes: Les résultats sont déjà triés en ordre décroissant. Il n'est donc pas nécéssaire de remanipuler
  //les données
  
  var bars = gBars.selectAll("g")
  .remove()
  .exit()
  .data(districtSource.result);

  //Abbreviation
  gAxis.call(yAxis);
  gAxis.selectAll("g")
  .select("text")
  .text(d => {
    var party = parties.find(party => d === party.name);
    if(party === undefined) return "Autre";
    else return party.abbreviation
  });

  //Bars
  bars = bars.enter()
  .append("g");

  bars.append("rect")
  .attr("class", "bar")
  .attr("y", d => y(d.party))
  .attr("width", d => x(d.votes))
  .attr("height", y.bandwidth())
  .attr("fill", d => color(d.party));

  //Pourcentage
  bars.append("text")
  .attr("class", "label")
  .attr("y", d => {
    return y(d.party) + y.bandwidth() - 5;
  })
  .attr("x", d => {
    return x(d.votes) + 5;
  })
  .text(d => d.percent);

}

/**
 * Réinitialise l'affichage de la carte lorsque la panneau d'informations est fermé.
 *
 * @param g     Le groupe dans lequel les tracés des circonscriptions ont été créés.
 */
function reset(g) {
  // Réinitialiser l'affichage de la carte en retirant la classe "selected" de tous les éléments.
 g.selectAll("path").classed("selected", false);

}

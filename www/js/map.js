/* Draw map according to page extension */
var primary = false;
var states = ["ny", "pa"];
var page = window.location.href.split("/").pop().split(".")[0];

if (page == 'national' || page == 'local') {
  var map_loc = states; 
} else {
  var map_loc = [page];
}

var margin = {top: 10, left: 10, bottom: 10, right: 10},
  aspect_width = 16,
  aspect_height = 6,
  width = parseInt(d3.select('.table-wrapper').style('width')) - margin.left - margin.right,
  height = Math.ceil((width * aspect_height) / aspect_width);

var projection = d3.geo.equirectangular()
    .center([-71.5, 42.2])
    .rotate([4.4, 0])
    .translate([width/2, height/2])
    .scale([width/640*9000]);

if (page == 'ny') {
  var aspect_height = 5,
    height = Math.ceil((width * aspect_height) / aspect_width);
}

else if (page == 'pa') {
  var aspect_height = 4,
    height = Math.ceil((width * aspect_height) / aspect_width);

  projection.center([-71.5, 41.4]);
}

var path = d3.geo.path()
  .projection(projection);

var q = queue();
q.defer(d3.json, 'js/stnat.json');

var tasks = [],
  paths = [];
for (var i = 0; i < map_loc.length; i++) {
    paths[i] = 'js/counties-wskg-'.concat(map_loc[i]).concat('.json');
}

paths.forEach(function(fileName){
    q.defer(d3.json, fileName);
});

q.awaitAll(drawSvg);

function drawSvg(error, json) {

  var resultsData = json[0];
  var boundaryData = [];

  for (var i = 1; i < json.length; i++) {
    boundaryData.push(json[i]);
  }

  jQuery('.map-container').each(function() {
    var race = $(this).attr('race');
    var sheet;

    if (page == 'national') {
      sheet = 'nat';
    } else {
      sheet = page;
    }

    var hasData = true;

    if (resultsData[sheet][race].hasOwnProperty('no-county-data')) {
        hasData = false;
      } 
      if (hasData) {
        $(this).addClass("map-visible");
      } else {
        $(this).find(".table-wrapper").removeClass("col-md-6")
          .addClass("col-md-12");
      }
  });

  var svg = d3.selectAll(".map-container.map-visible").append("svg")
    .attr("class", "col-md-6 col-sm-12")
    .attr("height", height);

  $('.map-container').each(function() {
    $(this).children('svg').attr("race", $(this).attr("race"))
    .attr("state", $(this).attr("state"));
  });

  for (var i = 0; i < boundaryData.length; i++) {

    svg.selectAll("path")
      .data(boundaryData[i].features, function(d){return d.properties.NAME;})
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "map-counties")
      .attr("fill", function(d) { return coloring(
        d.properties.NAME,
        d3.select(this.parentNode).attr("race"),
        d3.select(this.parentNode).attr("state"));
      });
  }

  $(".map-container.map-visible").each(function() {
    $(this).append(makeKey($(this).attr("race"), $(this).attr("state")))
  })

  function coloring(county, race, state) {
    county = county.toLowerCase();
    if (resultsData[state][race].hasOwnProperty(county)) {
      var maj_perc = resultsData[state][race][county]['maj-perc'];
      var maj_cand = resultsData[state][race][county]['maj-cand']
      var color = resultsData[state][race]['candidates'][maj_cand]['color'];

      if (primary) {
        return '#' + color;
      } else {
        var scale = d3.scale.linear().range(['white', '#' + color])
          .domain([0, 70])
          .clamp(true);

        var shade = scale(parseFloat(maj_perc));

        return shade;
      }
    } else { return "#999"}
  }

  function makeKey(race, state) {
    var swatches = '';
    for (var c in resultsData[state][race]['candidates']) {
      var newSwatch = '<div class="swatch" style="background: #' +
      resultsData[state][race]['candidates'][c]['color'] +
      '"></div><span class="cand-name">' +
      resultsData[state][race]["candidates"][c]['name'] +
      '</span>';
      swatches = swatches.concat(newSwatch);
    }

    if (primary) {
      return '<div class="map-key col-md-6 col-sm-12"><div class="key-swatches">' + 
        swatches +
        '</div></div>';
    } else {
      return '<div class="map-key col-md-6 col-sm-12"><div class="key-swatches">' + 
      swatches +
      '</div>' +
      '<div class="key-scale"><img src="assets/scale.gif"></div>' +
      '</div>';
    }
    
  }
}



d3.select(window).on('resize', resize);

function resize() {
    // adjust things when the window size changes
    width = parseInt(d3.select('.table-wrapper').style('width'));
    width = width - margin.left - margin.right;
    height = Math.ceil((width * aspect_height) / aspect_width);

    // update projection
    projection
        .translate([width / 2, height / 2])
        .scale(width/640*9000);

    // resize the map container
    $('svg').attr('width', width + 'px')
      .attr('height', height + 'px');

    // resize the map key
    $('.map-key').attr('style', 'width: ' + width + 'px');

    // resize the map
    d3.selectAll("path").attr('d', path);
}
const d3 = require("d3"),
      topoSimplify = require("topojson-simplify"),
      topoServer = require("topojson-server"),
      topoClient = require("topojson-client"),
      fs = require("fs");

fs.readFile("./areas.geojson", "utf8", function(error, data) {
  if (error) throw error;

  geoData = JSON.parse(data)
    .features
    .filter(function(d) {
      return d3.geoArea(d) > 0;
    })
    .map(function(d) {
      let i = d.properties.name.indexOf("(");
      if (i > -1) {
        d.properties.name = d.properties.name.slice(0, i - 1);
      }
      if (d.properties.code == "89399") {
        d.properties.name = "ACT";
      }
      return d;
    });

  fs.readFile("./cases.csv", "utf8", function(error, data) {
    if (error) throw error;

    caseData = d3.csvParse(data)
      .map(function(d) {
        return {
          date: d.date,
          code: d.code,
          recent: Math.round(+d.recent)
        };
      });

    finalData = {
      type: "FeatureCollection",
      features: []
    };

    codes = Array.from(new Set(caseData.map(function(d) { return d.code; })));
    codes.forEach(function(d) {
      let dataMatch = caseData
        .filter(function(e) {
          return e.code == d;
        });
      let geoMatch = geoData
        .filter(function(e) {
          return e.properties.code == d;
        });
      if (geoMatch.length == 1) {
        finalData.features.push({
          type: "Feature",
          geometry: geoMatch[0].geometry,
          properties: {
            name: geoMatch[0].properties.name,
            data: dataMatch.map(function(e) {
              return e.recent;
            })
          }
        });
      }
    });

    heightRange = d3.scaleSqrt()
      .range([0, 300000])
      .domain([0, d3.max(finalData.features, function(d) {
        return d3.max(d.properties.data);
      })]);

    console.log(heightRange.domain());

    // colourRange = d3.scaleThreshold(d3.schemeReds[9])
    //   .domain(d3.range(0, 10).map(function(d) { return d * heightRange.domain()[1] / 9; }));

    abcColours = ["#EAF2DC", "#BFECCF", "#9BDED3", "#7ACFD4", "#5EC0CE", "#3FB2C6", "#23A3BC", "#188CAD", "#0E75A0", "#085B96", "#02408D", "#002775", "#00104B"];
    colourRange = d3.scaleQuantize()
      .range(abcColours)
      .domain(heightRange.range());

    mapData = {
      type: "FeatureCollection",
      features: []
    };

    finalData.features.map(function(d) {
      let heights = d.properties.data.map(function(e) { return Math.round(heightRange(e)); });
      let colours = d.properties.data.map(function(e) { return (e == 0) ? 0 : colourRange(heightRange(e)); });
      mapData.features.push({
        type: "Feature",
        geometry: d.geometry,
        properties: {
          // name: d.properties.name,
          // area: d.properties.area,
          heights: heights,
          colours: colours
        }
      });
    });

    // topology = topoServer.topology({ areas: mapData });
    // topology = topoSimplify.presimplify(topology);
    // topology = topoSimplify.simplify(topology, 1e-3);
    // topology = topoClient.quantize(topology, 1e4);

    fs.writeFile("./lga.geojson", JSON.stringify(mapData), function(error) {
      console.log("lga.geojson written");
    });

    distanceData = [];
    geoData.forEach(function(d) {
      d.properties.location = d3.geoCentroid(d);
      distanceData.push(d.properties);
    });

    fs.writeFile("./dataDistance.csv", d3.csvFormat(distanceData), function(error) {
      console.log("dataDistance.csv written");
    });
  });
});

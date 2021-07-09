const d3 = require("d3"),
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

    fs.writeFile("./lga.geojson", JSON.stringify(finalData), function(error) {
      console.log("lga.geojson written");
    });
  });
});

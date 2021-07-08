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
      return d;
    });

  geoData.forEach(function(d) {
    console.log(d.properties);    
  });

  fs.readFile("./cases.csv", "utf8", function(error, data) {
    if (error) throw error;

    caseData = d3.csvParse(data);

  });
});

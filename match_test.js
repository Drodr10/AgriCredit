const fs = require('fs');

const geojson = JSON.parse(fs.readFileSync('frontend/public/india-districts.json', 'utf8'));
const geojsonDistricts = geojson.features.map(f => f.properties.NAME_2);

Promise.all([
  fetch('http://localhost:8000/data/crop-yield?crop=wheat&year=2015').then(r => r.json()),
  fetch('http://localhost:8000/data/rainfall').then(r => r.json())
]).then(([cropRes, rainRes]) => {
  const cropDistricts = Object.keys(cropRes.data);
  const rainDistricts = Object.keys(rainRes.data);
  
  function getMatch(name, dataKeys) {
      const lowerName = name.toLowerCase();
      // exact match
      let match = dataKeys.find(k => k.toLowerCase() === lowerName);
      if (match) return match;
      // name includes data key
      match = dataKeys.find(k => lowerName.includes(k.toLowerCase()) || k.toLowerCase().includes(lowerName));
      return match;
  }
  
  let cropMatches = 0;
  let rainMatches = 0;
  for (const name of geojsonDistricts) {
      if (getMatch(name, cropDistricts)) cropMatches++;
      if (getMatch(name, rainDistricts)) rainMatches++;
  }
  
  console.log(`GeoJSON districts: ${geojsonDistricts.length}`);
  console.log(`Crop matches: ${cropMatches}`);
  console.log(`Rain matches: ${rainMatches}`);
});

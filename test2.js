const res = {
  data: {
    "Nicobar": 100,
    "Andaman Islands": 200,
    "Ahmedabad": 50,
    "Punch": 40
  }
};
const geojsonDistricts = ["Nicobar Islands", "Andaman", "Ahmadabad", "Poonch"];

const normalizedData = {};
for (const [k, v] of Object.entries(res.data)) {
  normalizedData[k.toLowerCase()] = v;
}

function getVal(name) {
  if (!name) return undefined;
  const lowerName = name.toLowerCase();
  if (normalizedData[lowerName] !== undefined) return normalizedData[lowerName];
  
  // Try substring match
  const matchKey = Object.keys(normalizedData).find(k => k.includes(lowerName) || lowerName.includes(k));
  if (matchKey) return normalizedData[matchKey];
  return undefined;
}

for (const name of geojsonDistricts) {
  console.log(name, getVal(name));
}

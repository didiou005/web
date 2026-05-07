const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/fr33dz/Algeria-geojson/master/all-wilayas.geojson';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const geojson = JSON.parse(data);
      const bouira = geojson.features.find(f => 
        f.properties.name === "Bouira" || 
        f.properties.nom === "Bouira" ||
        f.properties.id == 10 ||
        f.properties.code == 10
      );

      if (bouira && bouira.geometry) {
        let coords = [];
        if (bouira.geometry.type === 'Polygon') {
          coords = bouira.geometry.coordinates[0].map(c => [c[1], c[0]]);
        } else if (bouira.geometry.type === 'MultiPolygon') {
          coords = bouira.geometry.coordinates[0][0].map(c => [c[1], c[0]]);
        }
        
        // Simple simplification: keep only every 10th point to avoid heavy UI
        const simplified = coords.filter((_, i) => i % 10 === 0);
        
        fs.writeFileSync('bouira_coords.json', JSON.stringify(simplified));
        console.log('Successfully saved ' + simplified.length + ' simplified points');
      } else {
        console.error('Bouira not found');
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
});

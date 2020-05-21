import { feature } from 'topojson';
import { csv, json } from 'd3';

const row = d => {
  d.coords = [d['Lat'], d['Long'] ].map(d => +d).reverse();
  return d;
};



export const loadAndProcessData = k => {

  const csvpath = './csv/' + k + '.csv'

  return Promise
    .all([ 
      json('https://unpkg.com/visionscarto-world-atlas@0.0.4/world/50m.json'),
      csv(csvpath, row)
    ])
    .then(([topoJSONdata, covidData]) => {
      

      const countries = feature(topoJSONdata, topoJSONdata.objects.countries);
      

      // console.log(confirmed);
      
      return {
        features: countries.features,
        covidData
      };
    });
}

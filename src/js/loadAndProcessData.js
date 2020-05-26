import { feature } from 'topojson';
import { csv, json } from 'd3';

const row = d => {
  d.coords = [d['Lat'], d['Long'] ].map(d => +d).reverse();
  return d;
};



export const loadAndProcessData = k => {

  // const csvpath = './csv/' + k + '.csv';
  const regex = /(.*) \+ (.*)/;
  if(k.match(regex)) {
    const csvpath1 = `./csv/${k.replace(regex, "$1")}.csv`;
    const csvpath2 = `./csv/${k.replace(regex, "$2")}.csv`;
    
    return Promise
      .all([
        json('https://unpkg.com/visionscarto-world-atlas@0.0.4/world/50m.json'),
        csv(csvpath1, row),
        csv(csvpath2, row)
      ])
      .then(([topoJSONdata, covidData, covidData2]) => {
        
  
        const countries = feature(topoJSONdata, topoJSONdata.objects.countries);
        
  
        // console.log(confirmed);
        
        return {
          features: countries.features,
          name: [k.replace(regex, "$1"), k.replace(regex, "$2")],
          covidData,
          covidData2
        };
      });
  }

  else {
    const csvpath = `./csv/${k}.csv`;
    
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
          name: [k],
          covidData
        };
      });
  }

}

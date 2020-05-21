import * as d3 from "d3";
import * as topojson from 'topojson-client';

export default (function bundle (d3$1, topojson) {
   'use strict';

  const row = d => {
    d.coords = [d['Lat'], d['Long'] ].map(d => +d).reverse();
    return d;
  };

  const loadAndProcessData = () => 
    Promise
      .all([  
        d3$1.csv('https://gist.githubusercontent.com/curran/e7ed69ac1528ff32cc53b70fdce16b76/raw/61f3c156efd532ae6ed84b38102cf9a0b3b1d094/data.csv'),
        d3$1.json('https://unpkg.com/visionscarto-world-atlas@0.0.4/world/50m.json'),
        d3$1.csv('./csv/confirmed.csv', row),
        d3$1.csv('./csv/deaths.csv', row),
      ])
      .then(([unData, topoJSONdata, confirmedData, deathsData]) => {
        
        // console.log(covidData);
        
        const rowById = unData.reduce((accumulator, d) => {
          accumulator[d['Country code']] = d;      
          return accumulator;
        }, {});

        const countries = topojson.feature(topoJSONdata, topoJSONdata.objects.countries);

        countries.features.forEach(d => {
          Object.assign(d.properties, rowById[+d.id]);
        });
        
        
        const confirmed = confirmedData.map( d => {
          return d
        });

        const deaths = deathsData.map( d => {
          return d
        });
        
        // console.log(confirmed);

        const featuresWithPopulation = countries.features
          .filter(d => d.properties['2018'])
          .map(d => {
            d.properties['2018'] = +d.properties['2018'].replace(/ /g, '') * 1000;
            return d;
          });

        
        return {
          features: countries.features,
          featuresWithPopulation,
          confirmed,
          deaths
        };
      });

  const svg = d3$1.select('svg');

  const projection = d3$1.geoNaturalEarth1();
  const pathGenerator = d3$1.geoPath().projection(projection);
  const start = '01/22/20';
  let radiusValue = d => +d[start];

  let filteredData = null;

  const g = svg.append('g');


//   const colorLegendG = svg.append('g').attr('transform', `translate(40,310)`);

  g.append('path')
    .attr('class', 'sphere')
    .attr('d', pathGenerator({ type: 'Sphere' }));

  svg.call(
    d3$1.zoom().on('zoom', () => {
      g.attr('transform', d3$1.event.transform);
    })
  );

//   const populationFormat = d3$1.format(',');

  const processed = loadAndProcessData();

  const Maprender = data => {
    g.selectAll('path .country')
      .data(data.features)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', pathGenerator)
      .attr('fill', '#e8e8e8');
  };

  processed.then(Maprender);


  const render = data => {
     
    const sizeScale_confirmed = d3$1.scaleSqrt()
      .domain([0, d3$1.max(data.confirmed, radiusValue)])
      .range([0, 33]);
    
    data.confirmed.forEach(d => {
      d.pos = projection(d.coords);
    });

    // const sizeScale_deaths = d3$1.scaleSqrt()
    //   .domain([0, d3$1.max(data.deaths, radiusValue)])
    //   .range([0, 33]);
    
    // data.deaths.forEach(d => {
    //   d.pos = projection(d.coords);
    // });

    const circles = g.selectAll('circle')
      .data(data.confirmed);
      
    circles
    	.enter()
      .append('circle')
      .attr('class', 'country-confirmed-circle')
      .attr('cx', d => d.pos[0])
      .attr('cy', d => d.pos[1])
      .attr('r',  d => sizeScale_confirmed(radiusValue(d)))
      .append('title')
      .text(d =>
          d['Province/State'] ?
          [  
            [
              d['Country/Region'],
              d['Province/State']
            ].join(', '),
      		 		radiusValue(d)
    			].join(': ') 
            :
          [
            d['Country/Region'],
      			radiusValue(d)
    			].join(': ')
      );
    
    circles
      .transition().duration(100)
      .attr('r', d => sizeScale_confirmed(radiusValue(d)));

    
    circles.selectAll('title')
        .text(d =>
          d['Province/State'] ?
          [  
            [
              d['Country/Region'],
              d['Province/State']
            ].join(', '),
      		 		radiusValue(d)
    			].join(': ') 
            :
          [
            d['Country/Region'],
      			radiusValue(d)
    			].join(': ')
      );
    
    
  	circles.exit().remove();
    
  };

  processed.then(data => {
    filteredData = data;
    render(filteredData);
  });



//   var formatDateIntoYear = d3.timeFormat("%Y");
  var formatDate = d3.timeFormat("%m/%d");
  var formatDateY = d3.timeFormat("%m/%d/%y");
  var parseDate = d3.timeParse("%m/%d/%y");

  console.log(parseDate('3/12/20'));

  var startDate = new Date("2020-01-22"),
      endDate = new Date("2020-03-28");

  var margin = {top:0, right:50, bottom:0, left:50},
      width = 960 - margin.left - margin.right,
      height = 100 - margin.top - margin.bottom;

  ////////// slider //////////

  var svgSlider = d3.select("#slider")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height);
      
  var x = d3.scaleTime()
      .domain([startDate, endDate])
      .range([0, width])
      .clamp(true);

  var slider = svgSlider.append("g")
      .attr("class", "slider")
      .attr("transform", "translate(" + margin.left + "," + 50 + ")");

  slider.append("line")
      .attr("class", "track")
      .attr("x1", x.range()[0])
      .attr("x2", x.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
      .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
      .attr("class", "track-overlay")
      .call(d3.drag()
          .on("start.interrupt", function() { slider.interrupt(); })
          .on("start drag", function() { update(x.invert(d3.event.x)); }));

  slider.insert("g", ".track-overlay")
      .attr("class", "ticks")
      .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
      .data(x.ticks(10))
      .enter()
      .append("text")
      .attr("x", x)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .text(function(d) { return formatDate(d); });

  var handle = slider.insert("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("r", 9);

  var label = slider.append("text")  
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .text(formatDate(startDate))
      .attr("transform", "translate(0," + (-25) + ")");

  function update(h) {
    // update position and text of label according to slider scale
    handle.attr("cx", x(h));
    label
      .attr("x", x(h))
      .text(formatDate(h));
    
    console.log(formatDateY(h));
    
    
    processed.then(data => {
      radiusValue = d => +d[formatDateY(h)];
      filteredData = data;
      render(filteredData);
    });
  }
  /*
  loadAndProcessData().then(countries => {
    const sizeScale = scaleSqrt()
      .domain([0, max(countries.confirmed, radiusValue)])
      .range([0, 33]);

    
    g.selectAll('path .country')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', pathGenerator)
      .attr('fill', '#e8e8e8');
      //
      .attr('fill', d => (d.properties['2018'] ? '#e8e8e8' : '#fecccc'))
      .append('title')
      .text(d =>
        isNaN(radiusValue(d))
          ? 'Missing data'
          : [
              d.properties['Region, subregion, country or area *'],
              populationFormat(radiusValue(d))
            ].join(': ')
      );
      //
    countries.featuresWithPopulation.forEach(d => {
      d.properties.projected = projection(geoCentroid(d));
    });
    
    const parsed = countries.confirmed;
    
    countries.confirmed.forEach(d => {
      d.pos = projection(d.coords);
    });
    
    
    const sample = countries.confirmed[0];
    console.log(sample);
    g.selectAll('circle')
      .data(countries.confirmed)
      .enter()
      .append('circle')
      .attr('class', 'country-circle')
      .attr('cx', d => d.pos[0])
      .attr('cy', d => d.pos[1])
      .attr('r', d => sizeScale(radiusValue(d)))
      .append('title')
      .text(d =>
          d['Province/State'] ?
          [  
            [
              d['Country/Region'],
              d['Province/State']
            ].join(', '),
      		 		radiusValue(d)
    			].join(': ') 
            :
          [
            d['Country/Region'],
      			radiusValue(d)
    			].join(': ')
      );
      
    //
    g.selectAll('circle')
      .data(countries.featuresWithPopulation)
      .enter()
      .append('circle')
      .attr('class', 'country-circle')
      .attr('cx', d => d.properties.projected[0])
      .attr('cy', d => d.properties.projected[1])
      .attr('r', d => sizeScale(radiusValue(d)))
      .append('title')
      .text(d =>
        isNaN(radiusValue(d))
          ? 'Missing data'
          : [
              d.properties['Region, subregion, country or area *'],
              populationFormat(radiusValue(d))
            ].join(': ')
      );

    g.append('g')
      .attr('transform', `translate(45,215)`)
      .call(sizeLegend, {
        sizeScale,
        spacing: 45,
        textOffset: 10,
        numTicks: 5,
        tickFormat: populationFormat
      })
      .append('text')
      .attr('class', 'legend-title')
      .text('Population')
      .attr('y', -45)
      .attr('x', -30);
    //
  });
  */

}(d3, topojson));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImxvYWRBbmRQcm9jZXNzRGF0YS5qcyIsImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZlYXR1cmUgfSBmcm9tICd0b3BvanNvbic7XG5pbXBvcnQgeyBjc3YsIGpzb24gfSBmcm9tICdkMyc7XG5cbmNvbnN0IHJvdyA9IGQgPT4ge1xuICBkLmNvb3JkcyA9IFtkWydMYXQnXSwgZFsnTG9uZyddIF0ubWFwKGQgPT4gK2QpLnJldmVyc2UoKTtcbiAgcmV0dXJuIGQ7XG59O1xuXG5leHBvcnQgY29uc3QgbG9hZEFuZFByb2Nlc3NEYXRhID0gKCkgPT4gXG4gIFByb21pc2VcbiAgICAuYWxsKFsgY3N2KCdodHRwczovL2dpc3QuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2N1cnJhbi9lN2VkNjlhYzE1MjhmZjMyY2M1M2I3MGZkY2UxNmI3Ni9yYXcvNjFmM2MxNTZlZmQ1MzJhZTZlZDg0YjM4MTAyY2Y5YTBiM2IxZDA5NC9kYXRhLmNzdicpLFxuICAgICAganNvbignaHR0cHM6Ly91bnBrZy5jb20vdmlzaW9uc2NhcnRvLXdvcmxkLWF0bGFzQDAuMC40L3dvcmxkLzUwbS5qc29uJyksXG4gICAgICAgICAgY3N2KCdjb25maXJtZWQuY3N2Jywgcm93KVxuICAgIF0pXG4gICAgLnRoZW4oKFt1bkRhdGEsIHRvcG9KU09OZGF0YSwgY292aWREYXRhXSkgPT4ge1xuICAgICAgXG4gICAgICAvLyBjb25zb2xlLmxvZyhjb3ZpZERhdGEpO1xuICAgICAgXG4gICAgICBjb25zdCByb3dCeUlkID0gdW5EYXRhLnJlZHVjZSgoYWNjdW11bGF0b3IsIGQpID0+IHtcbiAgICAgICAgYWNjdW11bGF0b3JbZFsnQ291bnRyeSBjb2RlJ11dID0gZDsgICAgICBcbiAgICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICAgICAgfSwge30pO1xuXG4gICAgICBjb25zdCBjb3VudHJpZXMgPSBmZWF0dXJlKHRvcG9KU09OZGF0YSwgdG9wb0pTT05kYXRhLm9iamVjdHMuY291bnRyaWVzKTtcblxuICAgICAgY291bnRyaWVzLmZlYXR1cmVzLmZvckVhY2goZCA9PiB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZC5wcm9wZXJ0aWVzLCByb3dCeUlkWytkLmlkXSk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgXG4gICAgICBjb25zdCBjb25maXJtZWQgPSBjb3ZpZERhdGEubWFwKCBkID0+IHtcbiAgICAgICAgcmV0dXJuIGRcbiAgICAgIH0pXG4gICAgICBcbiAgICAgIC8vIGNvbnNvbGUubG9nKGNvbmZpcm1lZCk7XG5cbiAgICAgIGNvbnN0IGZlYXR1cmVzV2l0aFBvcHVsYXRpb24gPSBjb3VudHJpZXMuZmVhdHVyZXNcbiAgICAgICAgLmZpbHRlcihkID0+IGQucHJvcGVydGllc1snMjAxOCddKVxuICAgICAgICAubWFwKGQgPT4ge1xuICAgICAgICAgIGQucHJvcGVydGllc1snMjAxOCddID0gK2QucHJvcGVydGllc1snMjAxOCddLnJlcGxhY2UoLyAvZywgJycpICogMTAwMDtcbiAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgfSk7XG5cbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZmVhdHVyZXM6IGNvdW50cmllcy5mZWF0dXJlcyxcbiAgICAgICAgZmVhdHVyZXNXaXRoUG9wdWxhdGlvbixcbiAgICAgICAgY29uZmlybWVkXG4gICAgICB9O1xuICAgIH0pO1xuIiwiaW1wb3J0IHtcbiAgc2VsZWN0LFxuICBnZW9QYXRoLFxuICBnZW9DZW50cm9pZCxcbiAgZ2VvTmF0dXJhbEVhcnRoMSxcbiAgem9vbSxcbiAgZXZlbnQsXG4gIHNjYWxlT3JkaW5hbCxcbiAgc2NoZW1lU3BlY3RyYWwsXG4gIHNjYWxlU3FydCxcbiAgbWF4LFxuICBmb3JtYXRcbn0gZnJvbSAnZDMnO1xuaW1wb3J0IHsgbG9hZEFuZFByb2Nlc3NEYXRhIH0gZnJvbSAnLi9sb2FkQW5kUHJvY2Vzc0RhdGEnO1xuaW1wb3J0IHsgc2l6ZUxlZ2VuZCB9IGZyb20gJy4vc2l6ZUxlZ2VuZCc7XG5cblxuY29uc3Qgc3ZnID0gc2VsZWN0KCdzdmcnKTtcblxuY29uc3QgcHJvamVjdGlvbiA9IGdlb05hdHVyYWxFYXJ0aDEoKTtcbmNvbnN0IHBhdGhHZW5lcmF0b3IgPSBnZW9QYXRoKCkucHJvamVjdGlvbihwcm9qZWN0aW9uKTtcbmNvbnN0IHN0YXJ0ID0gJzAxLzIyLzIwJztcbmxldCByYWRpdXNWYWx1ZSA9IGQgPT4gK2Rbc3RhcnRdO1xuXG5sZXQgZmlsdGVyZWREYXRhID0gbnVsbDtcblxuY29uc3QgZyA9IHN2Zy5hcHBlbmQoJ2cnKTtcblxuXG5jb25zdCBjb2xvckxlZ2VuZEcgPSBzdmcuYXBwZW5kKCdnJykuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSg0MCwzMTApYCk7XG5cbmcuYXBwZW5kKCdwYXRoJylcbiAgLmF0dHIoJ2NsYXNzJywgJ3NwaGVyZScpXG4gIC5hdHRyKCdkJywgcGF0aEdlbmVyYXRvcih7IHR5cGU6ICdTcGhlcmUnIH0pKTtcblxuc3ZnLmNhbGwoXG4gIHpvb20oKS5vbignem9vbScsICgpID0+IHtcbiAgICBnLmF0dHIoJ3RyYW5zZm9ybScsIGV2ZW50LnRyYW5zZm9ybSk7XG4gIH0pXG4pO1xuXG5jb25zdCBwb3B1bGF0aW9uRm9ybWF0ID0gZm9ybWF0KCcsJyk7XG5cbmNvbnN0IHByb2Nlc3NlZCA9IGxvYWRBbmRQcm9jZXNzRGF0YSgpO1xuXG5jb25zdCBNYXByZW5kZXIgPSBkYXRhID0+IHtcbiAgZy5zZWxlY3RBbGwoJ3BhdGggLmNvdW50cnknKVxuICAgIC5kYXRhKGRhdGEuZmVhdHVyZXMpXG4gICAgLmVudGVyKClcbiAgICAuYXBwZW5kKCdwYXRoJylcbiAgICAuYXR0cignY2xhc3MnLCAnY291bnRyeScpXG4gICAgLmF0dHIoJ2QnLCBwYXRoR2VuZXJhdG9yKVxuICAgIC5hdHRyKCdmaWxsJywgJyNlOGU4ZTgnKVxufVxuXG5wcm9jZXNzZWQudGhlbihNYXByZW5kZXIpO1xuXG5cbmNvbnN0IHJlbmRlciA9IGRhdGEgPT4ge1xuICAgXG4gIGNvbnN0IHNpemVTY2FsZSA9IHNjYWxlU3FydCgpXG4gICAgLmRvbWFpbihbMCwgbWF4KGRhdGEuY29uZmlybWVkLCByYWRpdXNWYWx1ZSldKVxuICAgIC5yYW5nZShbMCwgMzNdKTtcbiAgXG4gIGRhdGEuY29uZmlybWVkLmZvckVhY2goZCA9PiB7XG4gICAgZC5wb3MgPSBwcm9qZWN0aW9uKGQuY29vcmRzKTtcbiAgfSk7XG4gIFxuXG4gIGNvbnN0IGNpcmNsZXMgPSBnLnNlbGVjdEFsbCgnY2lyY2xlJylcbiAgICAuZGF0YShkYXRhLmNvbmZpcm1lZCk7XG4gIGNpcmNsZXNcbiAgXHQuZW50ZXIoKVxuICAgIC5hcHBlbmQoJ2NpcmNsZScpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2NvdW50cnktY2lyY2xlJylcbiAgICAuYXR0cignY3gnLCBkID0+IGQucG9zWzBdKVxuICAgIC5hdHRyKCdjeScsIGQgPT4gZC5wb3NbMV0pXG4gICAgLmF0dHIoJ3InLCAgZCA9PiBzaXplU2NhbGUocmFkaXVzVmFsdWUoZCkpKVxuICAgIC5hcHBlbmQoJ3RpdGxlJylcbiAgICAudGV4dChkID0+XG4gICAgICAgIGRbJ1Byb3ZpbmNlL1N0YXRlJ10gP1xuICAgICAgICBbICBcbiAgICAgICAgICBbXG4gICAgICAgICAgICBkWydDb3VudHJ5L1JlZ2lvbiddLFxuICAgICAgICAgICAgZFsnUHJvdmluY2UvU3RhdGUnXVxuICAgICAgICAgIF0uam9pbignLCAnKSxcbiAgICBcdFx0IFx0XHRyYWRpdXNWYWx1ZShkKVxuICBcdFx0XHRdLmpvaW4oJzogJykgXG4gICAgICAgICAgOlxuICAgICAgICBbXG4gICAgICAgICAgZFsnQ291bnRyeS9SZWdpb24nXSxcbiAgICBcdFx0XHRyYWRpdXNWYWx1ZShkKVxuICBcdFx0XHRdLmpvaW4oJzogJylcbiAgICApO1xuICBcbiAgY2lyY2xlc1xuICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24oMTAwKVxuICAgIC5hdHRyKCdyJywgZCA9PiBzaXplU2NhbGUocmFkaXVzVmFsdWUoZCkpKVxuXG4gIFxuICBjaXJjbGVzLnNlbGVjdEFsbCgndGl0bGUnKVxuICAgICAgLnRleHQoZCA9PlxuICAgICAgICBkWydQcm92aW5jZS9TdGF0ZSddID9cbiAgICAgICAgWyAgXG4gICAgICAgICAgW1xuICAgICAgICAgICAgZFsnQ291bnRyeS9SZWdpb24nXSxcbiAgICAgICAgICAgIGRbJ1Byb3ZpbmNlL1N0YXRlJ11cbiAgICAgICAgICBdLmpvaW4oJywgJyksXG4gICAgXHRcdCBcdFx0cmFkaXVzVmFsdWUoZClcbiAgXHRcdFx0XS5qb2luKCc6ICcpIFxuICAgICAgICAgIDpcbiAgICAgICAgW1xuICAgICAgICAgIGRbJ0NvdW50cnkvUmVnaW9uJ10sXG4gICAgXHRcdFx0cmFkaXVzVmFsdWUoZClcbiAgXHRcdFx0XS5qb2luKCc6ICcpXG4gICAgKTtcbiAgXG4gIFxuXHRjaXJjbGVzLmV4aXQoKS5yZW1vdmUoKTtcbiAgXG59O1xuXG5wcm9jZXNzZWQudGhlbihkYXRhID0+IHtcbiAgZmlsdGVyZWREYXRhID0gZGF0YTtcbiAgcmVuZGVyKGZpbHRlcmVkRGF0YSk7XG59KTtcblxuXG5cbnZhciBmb3JtYXREYXRlSW50b1llYXIgPSBkMy50aW1lRm9ybWF0KFwiJVlcIik7XG52YXIgZm9ybWF0RGF0ZSA9IGQzLnRpbWVGb3JtYXQoXCIlbS8lZFwiKTtcbnZhciBmb3JtYXREYXRlWSA9IGQzLnRpbWVGb3JtYXQoXCIlbS8lZC8leVwiKTtcbnZhciBwYXJzZURhdGUgPSBkMy50aW1lUGFyc2UoXCIlbS8lZC8leVwiKTtcblxuY29uc29sZS5sb2cocGFyc2VEYXRlKCczLzEyLzIwJykpXG5cbnZhciBzdGFydERhdGUgPSBuZXcgRGF0ZShcIjIwMjAtMDEtMjJcIiksXG4gICAgZW5kRGF0ZSA9IG5ldyBEYXRlKFwiMjAyMC0wMy0yOFwiKTtcblxudmFyIG1hcmdpbiA9IHt0b3A6MCwgcmlnaHQ6NTAsIGJvdHRvbTowLCBsZWZ0OjUwfSxcbiAgICB3aWR0aCA9IDk2MCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxuICAgIGhlaWdodCA9IDEwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xuXG4vLy8vLy8vLy8vIHNsaWRlciAvLy8vLy8vLy8vXG5cbnZhciBzdmdTbGlkZXIgPSBkMy5zZWxlY3QoXCIjc2xpZGVyXCIpXG4gICAgLmFwcGVuZChcInN2Z1wiKVxuICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodClcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpO1xuICAgIFxudmFyIHggPSBkMy5zY2FsZVRpbWUoKVxuICAgIC5kb21haW4oW3N0YXJ0RGF0ZSwgZW5kRGF0ZV0pXG4gICAgLnJhbmdlKFswLCB3aWR0aF0pXG4gICAgLmNsYW1wKHRydWUpO1xuXG52YXIgc2xpZGVyID0gc3ZnU2xpZGVyLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwic2xpZGVyXCIpXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgNTAgKyBcIilcIik7XG5cbnNsaWRlci5hcHBlbmQoXCJsaW5lXCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInRyYWNrXCIpXG4gICAgLmF0dHIoXCJ4MVwiLCB4LnJhbmdlKClbMF0pXG4gICAgLmF0dHIoXCJ4MlwiLCB4LnJhbmdlKClbMV0pXG4gIC5zZWxlY3QoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5jbG9uZU5vZGUodHJ1ZSkpOyB9KVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0cmFjay1pbnNldFwiKVxuICAuc2VsZWN0KGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5wYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMuY2xvbmVOb2RlKHRydWUpKTsgfSlcbiAgICAuYXR0cihcImNsYXNzXCIsIFwidHJhY2stb3ZlcmxheVwiKVxuICAgIC5jYWxsKGQzLmRyYWcoKVxuICAgICAgICAub24oXCJzdGFydC5pbnRlcnJ1cHRcIiwgZnVuY3Rpb24oKSB7IHNsaWRlci5pbnRlcnJ1cHQoKTsgfSlcbiAgICAgICAgLm9uKFwic3RhcnQgZHJhZ1wiLCBmdW5jdGlvbigpIHsgdXBkYXRlKHguaW52ZXJ0KGQzLmV2ZW50LngpKTsgfSkpO1xuXG5zbGlkZXIuaW5zZXJ0KFwiZ1wiLCBcIi50cmFjay1vdmVybGF5XCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tzXCIpXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIDE4ICsgXCIpXCIpXG4gIC5zZWxlY3RBbGwoXCJ0ZXh0XCIpXG4gICAgLmRhdGEoeC50aWNrcygxMCkpXG4gICAgLmVudGVyKClcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgIC5hdHRyKFwieFwiLCB4KVxuICAgIC5hdHRyKFwieVwiLCAxMClcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZm9ybWF0RGF0ZShkKTsgfSk7XG5cbnZhciBoYW5kbGUgPSBzbGlkZXIuaW5zZXJ0KFwiY2lyY2xlXCIsIFwiLnRyYWNrLW92ZXJsYXlcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwiaGFuZGxlXCIpXG4gICAgLmF0dHIoXCJyXCIsIDkpO1xuXG52YXIgbGFiZWwgPSBzbGlkZXIuYXBwZW5kKFwidGV4dFwiKSAgXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcImxhYmVsXCIpXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgIC50ZXh0KGZvcm1hdERhdGUoc3RhcnREYXRlKSlcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgKC0yNSkgKyBcIilcIilcblxuZnVuY3Rpb24gdXBkYXRlKGgpIHtcbiAgLy8gdXBkYXRlIHBvc2l0aW9uIGFuZCB0ZXh0IG9mIGxhYmVsIGFjY29yZGluZyB0byBzbGlkZXIgc2NhbGVcbiAgaGFuZGxlLmF0dHIoXCJjeFwiLCB4KGgpKTtcbiAgbGFiZWxcbiAgICAuYXR0cihcInhcIiwgeChoKSlcbiAgICAudGV4dChmb3JtYXREYXRlKGgpKTtcbiAgXG4gIGNvbnNvbGUubG9nKGZvcm1hdERhdGVZKGgpKTtcbiAgXG4gIFxuICBwcm9jZXNzZWQudGhlbihkYXRhID0+IHtcbiAgICByYWRpdXNWYWx1ZSA9IGQgPT4gK2RbZm9ybWF0RGF0ZVkoaCldO1xuICAgIGZpbHRlcmVkRGF0YSA9IGRhdGE7XG4gICAgcmVuZGVyKGZpbHRlcmVkRGF0YSk7XG4gIH0pO1xufTtcblxuLypcbmxvYWRBbmRQcm9jZXNzRGF0YSgpLnRoZW4oY291bnRyaWVzID0+IHtcbiAgY29uc3Qgc2l6ZVNjYWxlID0gc2NhbGVTcXJ0KClcbiAgICAuZG9tYWluKFswLCBtYXgoY291bnRyaWVzLmNvbmZpcm1lZCwgcmFkaXVzVmFsdWUpXSlcbiAgICAucmFuZ2UoWzAsIDMzXSk7XG5cbiAgXG4gIGcuc2VsZWN0QWxsKCdwYXRoIC5jb3VudHJ5JylcbiAgICAuZGF0YShjb3VudHJpZXMuZmVhdHVyZXMpXG4gICAgLmVudGVyKClcbiAgICAuYXBwZW5kKCdwYXRoJylcbiAgICAuYXR0cignY2xhc3MnLCAnY291bnRyeScpXG4gICAgLmF0dHIoJ2QnLCBwYXRoR2VuZXJhdG9yKVxuICAgIC5hdHRyKCdmaWxsJywgJyNlOGU4ZTgnKTtcbiAgICAvL1xuICAgIC5hdHRyKCdmaWxsJywgZCA9PiAoZC5wcm9wZXJ0aWVzWycyMDE4J10gPyAnI2U4ZThlOCcgOiAnI2ZlY2NjYycpKVxuICAgIC5hcHBlbmQoJ3RpdGxlJylcbiAgICAudGV4dChkID0+XG4gICAgICBpc05hTihyYWRpdXNWYWx1ZShkKSlcbiAgICAgICAgPyAnTWlzc2luZyBkYXRhJ1xuICAgICAgICA6IFtcbiAgICAgICAgICAgIGQucHJvcGVydGllc1snUmVnaW9uLCBzdWJyZWdpb24sIGNvdW50cnkgb3IgYXJlYSAqJ10sXG4gICAgICAgICAgICBwb3B1bGF0aW9uRm9ybWF0KHJhZGl1c1ZhbHVlKGQpKVxuICAgICAgICAgIF0uam9pbignOiAnKVxuICAgICk7XG4gICAgLy9cbiAgY291bnRyaWVzLmZlYXR1cmVzV2l0aFBvcHVsYXRpb24uZm9yRWFjaChkID0+IHtcbiAgICBkLnByb3BlcnRpZXMucHJvamVjdGVkID0gcHJvamVjdGlvbihnZW9DZW50cm9pZChkKSk7XG4gIH0pO1xuICBcbiAgY29uc3QgcGFyc2VkID0gY291bnRyaWVzLmNvbmZpcm1lZDtcbiAgXG4gIGNvdW50cmllcy5jb25maXJtZWQuZm9yRWFjaChkID0+IHtcbiAgICBkLnBvcyA9IHByb2plY3Rpb24oZC5jb29yZHMpO1xuICB9KTtcbiAgXG4gIFxuICBjb25zdCBzYW1wbGUgPSBjb3VudHJpZXMuY29uZmlybWVkWzBdO1xuICBjb25zb2xlLmxvZyhzYW1wbGUpO1xuICBnLnNlbGVjdEFsbCgnY2lyY2xlJylcbiAgICAuZGF0YShjb3VudHJpZXMuY29uZmlybWVkKVxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZCgnY2lyY2xlJylcbiAgICAuYXR0cignY2xhc3MnLCAnY291bnRyeS1jaXJjbGUnKVxuICAgIC5hdHRyKCdjeCcsIGQgPT4gZC5wb3NbMF0pXG4gICAgLmF0dHIoJ2N5JywgZCA9PiBkLnBvc1sxXSlcbiAgICAuYXR0cigncicsIGQgPT4gc2l6ZVNjYWxlKHJhZGl1c1ZhbHVlKGQpKSlcbiAgICAuYXBwZW5kKCd0aXRsZScpXG4gICAgLnRleHQoZCA9PlxuICAgICAgICBkWydQcm92aW5jZS9TdGF0ZSddID9cbiAgICAgICAgWyAgXG4gICAgICAgICAgW1xuICAgICAgICAgICAgZFsnQ291bnRyeS9SZWdpb24nXSxcbiAgICAgICAgICAgIGRbJ1Byb3ZpbmNlL1N0YXRlJ11cbiAgICAgICAgICBdLmpvaW4oJywgJyksXG4gICAgXHRcdCBcdFx0cmFkaXVzVmFsdWUoZClcbiAgXHRcdFx0XS5qb2luKCc6ICcpIFxuICAgICAgICAgIDpcbiAgICAgICAgW1xuICAgICAgICAgIGRbJ0NvdW50cnkvUmVnaW9uJ10sXG4gICAgXHRcdFx0cmFkaXVzVmFsdWUoZClcbiAgXHRcdFx0XS5qb2luKCc6ICcpXG4gICAgKTtcbiAgICBcbiAgLy9cbiAgZy5zZWxlY3RBbGwoJ2NpcmNsZScpXG4gICAgLmRhdGEoY291bnRyaWVzLmZlYXR1cmVzV2l0aFBvcHVsYXRpb24pXG4gICAgLmVudGVyKClcbiAgICAuYXBwZW5kKCdjaXJjbGUnKVxuICAgIC5hdHRyKCdjbGFzcycsICdjb3VudHJ5LWNpcmNsZScpXG4gICAgLmF0dHIoJ2N4JywgZCA9PiBkLnByb3BlcnRpZXMucHJvamVjdGVkWzBdKVxuICAgIC5hdHRyKCdjeScsIGQgPT4gZC5wcm9wZXJ0aWVzLnByb2plY3RlZFsxXSlcbiAgICAuYXR0cigncicsIGQgPT4gc2l6ZVNjYWxlKHJhZGl1c1ZhbHVlKGQpKSlcbiAgICAuYXBwZW5kKCd0aXRsZScpXG4gICAgLnRleHQoZCA9PlxuICAgICAgaXNOYU4ocmFkaXVzVmFsdWUoZCkpXG4gICAgICAgID8gJ01pc3NpbmcgZGF0YSdcbiAgICAgICAgOiBbXG4gICAgICAgICAgICBkLnByb3BlcnRpZXNbJ1JlZ2lvbiwgc3VicmVnaW9uLCBjb3VudHJ5IG9yIGFyZWEgKiddLFxuICAgICAgICAgICAgcG9wdWxhdGlvbkZvcm1hdChyYWRpdXNWYWx1ZShkKSlcbiAgICAgICAgICBdLmpvaW4oJzogJylcbiAgICApO1xuXG4gIGcuYXBwZW5kKCdnJylcbiAgICAuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSg0NSwyMTUpYClcbiAgICAuY2FsbChzaXplTGVnZW5kLCB7XG4gICAgICBzaXplU2NhbGUsXG4gICAgICBzcGFjaW5nOiA0NSxcbiAgICAgIHRleHRPZmZzZXQ6IDEwLFxuICAgICAgbnVtVGlja3M6IDUsXG4gICAgICB0aWNrRm9ybWF0OiBwb3B1bGF0aW9uRm9ybWF0XG4gICAgfSlcbiAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAuYXR0cignY2xhc3MnLCAnbGVnZW5kLXRpdGxlJylcbiAgICAudGV4dCgnUG9wdWxhdGlvbicpXG4gICAgLmF0dHIoJ3knLCAtNDUpXG4gICAgLmF0dHIoJ3gnLCAtMzApO1xuICAvL1xufSk7XG4qL1xuIl0sIm5hbWVzIjpbImNzdiIsImpzb24iLCJmZWF0dXJlIiwic2VsZWN0IiwiZ2VvTmF0dXJhbEVhcnRoMSIsImdlb1BhdGgiLCJ6b29tIiwiZXZlbnQiLCJmb3JtYXQiLCJzY2FsZVNxcnQiLCJtYXgiXSwibWFwcGluZ3MiOiI7OztFQUdBLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSTtJQUNmLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3pELE9BQU8sQ0FBQyxDQUFDO0dBQ1YsQ0FBQzs7RUFFSyxNQUFNLGtCQUFrQixHQUFHO0lBQ2hDLE9BQU87T0FDSixHQUFHLENBQUMsRUFBRUEsUUFBRyxDQUFDLGtJQUFrSSxDQUFDO1FBQzVJQyxTQUFJLENBQUMsaUVBQWlFLENBQUM7WUFDbkVELFFBQUcsQ0FBQyxlQUFlLEVBQUUsR0FBRyxDQUFDO09BQzlCLENBQUM7T0FDRCxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsU0FBUyxDQUFDLEtBQUs7Ozs7UUFJM0MsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUs7VUFDaEQsV0FBVyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztVQUNuQyxPQUFPLFdBQVcsQ0FBQztTQUNwQixFQUFFLEVBQUUsQ0FBQyxDQUFDOztRQUVQLE1BQU0sU0FBUyxHQUFHRSxnQkFBTyxDQUFDLFlBQVksRUFBRSxZQUFZLENB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
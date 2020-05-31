import {
  select,
  geoPath,
  geoNaturalEarth1,
  zoom,
  event,
  scaleSqrt,
  max,
  extent,
  format,
  timeFormat,
  timeParse,
  scaleTime,
  drag,
  line,
  scaleLinear,
  axisBottom,
  axisLeft,
  axisRight
} from 'd3';
import { loadAndProcessData } from './loadAndProcessData';


export const main = () => {

  let alldata = {};
  const colorScheme = {
                        'confirmed': 
                          {'default': "#ea0606", 'hover': "#9a0101"},
                        'deaths':
                          {'default': "#414040", 'hover': "black"},
                        'recovered':
                          {'default': "#25ec28", 'hover': "#2cc715"}
                      };
  const keys = ['confirmed', 'deaths', 'recovered', 'confirmed + deaths', 'confirmed + recovered'];


  keys.forEach(k => {
    alldata[k] = loadAndProcessData(k);
  })

  // console.log(alldata);
  
  let current = 'confirmed';

  let selectedRegion = null;
  let selectedDate = '01/22/20';
  const parseID = d => d["Country/Region"] + '/' + d["Province/State"];
  let DateKeys;

  const svg = select('svg');

  const projection = geoNaturalEarth1();
  const pathGenerator = geoPath().projection(projection);
  const start = '01/22/20'; //TODO: infer from data
  let radiusValue = d => +d[start];

  let filteredData = null;

  const g = svg.append('g');

  g.append('path')
    .attr('class', 'sphere')
    .attr('d', pathGenerator({ type: 'Sphere' }));

  svg.call(
    zoom().on('zoom', () => {
      g.attr('transform', event.transform);
    })
  );

  // const processed = loadAndProcessData();
  // console.log(processed);

  let processed = alldata[current];

  const Maprender = data => {
    g.selectAll('path .country')
      .data(data.features)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', pathGenerator)
      .attr('fill', '#e8e8e8');
  }

  processed.then(Maprender);
  processed.then(d => {
    DateKeys = d.covidData.columns.filter(k => {
      return timeParse("%m/%d/%y")(k);
    });
  })

  //selectbox
  const dropdownChange = function(){
    current = select(this).property('value');

    processed = alldata[current];
    // console.log(processed);

    processed.then(data => {
      filteredData = data;
      // console.log(data);
      newDatarender(filteredData);
    });
  }

  const dropdown = select("#selectbox")
    .insert("select", "svg")
    .on("change", dropdownChange);
  
  dropdown.selectAll("option")
        .data(keys)
        .enter().append("option")
          .attr("value", d => d)
          .text(d => d);


  const newDatarender = data => {

  // const factor = current === "deaths" ? 1/2.5 : 1/3.5;
  //  const sizeScale = d => Math.pow(d, factor);
    console.log(data);
    selectedRegion = null;

    const sizeScale = d => Math.pow(d/50, 1/2);

    data.covidData.forEach(d => {
      d.pos = projection(d.coords);
      // d.state = data.name[0];
    });   

    function handleMouseover(d, i){
      select(this)
        .attr("fill", colorScheme[data.name[0]]['hover']);
    }

    function handleMouseout(d, i){
      select(this)
        .attr("fill", colorScheme[data.name[0]]['default'])
    }

    g.selectAll('circle').remove();

    const circles = g.selectAll('.country-circle')
      .data(data.covidData);    
    
    circles.enter()
      .append('circle')
      .attr('class', 'country-circle')
      .attr('cx', d => +d.pos[0])
      .attr('cy', d => +d.pos[1])
      .attr('r',  d => sizeScale(radiusValue(d)))
      .attr("fill", colorScheme[data.name[0]]['default'])
      .attr("fill-opacity", "0.489216")
      .on('mouseover', handleMouseover)
      .on('mouseout', handleMouseout)
      .on('click', d => updateByClick(d))
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
      .attr('r', d => sizeScale(radiusValue(d)))
    
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

    if(data.covidData2) {
      console.log("두번째 데이터");

      data.covidData2.forEach(d => {
        d.pos = projection(d.coords);
        // d.state = data.name[1];
      });   

      function handleMouseover2(d, i){
        select(this)
          .attr("fill", colorScheme[data.name[1]]['hover']);
      }
  
      function handleMouseout2(d, i){
        select(this)
          .attr("fill", colorScheme[data.name[1]]['default'])
      }

      const circles2 = g.selectAll(".country-circle2")
                        .data(data.covidData2);
    
      circles2.enter()
        .append('circle')
        .attr('class', 'country-circle2')
        .attr('cx', d => +d.pos[0])
        .attr('cy', d => +d.pos[1])
        .attr('r',  d => sizeScale(radiusValue(d)))
        .attr("fill", colorScheme[data.name[1]]['default'])
        .attr("fill-opacity", "0.489216")
        .on('mouseover', handleMouseover2)
        .on('mouseout', handleMouseout2)
        .on('click', d => updateByClick(d))
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

      circles2
        .transition().duration(100)
        .attr('r', d => sizeScale(radiusValue(d)))
    
      circles2.selectAll('title')
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

      circles2.exit().remove();
    }
    
    circles.exit().remove();
    
  };


  const updateDatarender = data => {

    // const factor = current === "deaths" ? 1/2.5 : 1/3.5;
    // const sizeScale = d => Math.pow(d, factor);
    const sizeScale = d => Math.pow(d/50, 1/2);

    data.covidData.forEach(d => {
      d.pos = projection(d.coords);
      // d.state = data.name[0];
    });
    
    const circles = g.selectAll('.country-circle')
      .data(data.covidData);

    // console.log(circles);

    circles
      .transition().duration(100)
      .attr('r',  d => sizeScale(radiusValue(d)))


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
    
      if(data.covidData2) {  
        /*
        data.covidData2.forEach(d => {
          d.pos = projection(d.coords);
          d.state = data.name[1];
        });

        function handleMouseover(d, i){
          select(this)
            .attr("fill", colorScheme[data.name[1]]['hover']);
        }
    
        function handleMouseout(d, i){
          select(this)
            .attr("fill", colorScheme[data.name[1]]['default'])
        }
        */
  
        const circles2 = g.selectAll(".country-circle2")
                          .data(data.covidData2);
        // console.log(circles2);
        /*
        circles2.enter()
          .append('circle')
          .attr('class', `country-circle2`)
          .attr('cx', d => +d.pos[0])
          .attr('cy', d => +d.pos[1])
          .attr('r',  d => sizeScale(radiusValue(d)))
          .attr("fill", colorScheme[data.name[1]]['default'])
          .attr("fill-opacity", "0.489216")
          .on('mouseover', handleMouseover)
          .on('mouseout', handleMouseout)
          .on('click', d => updateByClick(d))
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
        */
        circles2
          .transition().duration(100)
          .attr('r', d => sizeScale(radiusValue(d)))
      
        circles2.selectAll('title')
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
  
        circles2.exit().remove();
      }

    circles.exit().remove();
  };


  const formatDate = timeFormat("%m/%d");
  const formatDateY = timeFormat("%m/%d/%y");
  const parseDate = timeParse("%m/%d/%y");

  // TODO: infer from data
  const startDate = new Date("2020-01-22"),
      endDate = new Date("2020-03-28");

  const margin = {top:0, right:50, bottom:0, left:50},
      width = 960 - margin.left - margin.right,
      height = 100 - margin.top - margin.bottom;

  ////////// slider //////////

  const svgSlider = select("#slider")
      .append("svg")
      .attr('id', "slider")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height);
      
  const x = scaleTime()
      .domain([startDate, endDate])
      .range([0, width])
      .clamp(true);

  const slider = svgSlider.append("g")
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
      .call(drag()
          .on("start.interrupt", function() { slider.interrupt(); })
          .on("start drag", function() { updateByslider(x.invert(event.x)); }));

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

  const handle = slider.insert("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("r", 9);

  const label = slider.append("text")  
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .text(formatDate(startDate))
      .attr("transform", "translate(0," + (-25) + ")")

  let currentDate = formatDateY(startDate);
  // 라인차트에 현재 날짜를 표시하기 위해 현재 날짜의 x 마진을 담을 변수
  let currentDate_x = 0;

  function updateByslider(h) {
    // update position and text of label according to slider scale
    handle.attr("cx", x(h));
    label
      .attr("x", x(h))
      .text(formatDate(h));

    // console.log(formatDate(h));
    currentDate = formatDateY(h);
    
    radiusValue = d => +d[formatDateY(h)];
    selectedDate = formatDateY(h);

    processed.then(data => {
      // radiusValue = d => +d[formatDateY(h)];
      filteredData = data;
      updateDatarender(filteredData);
    });
  };

  processed.then(data => {
    filteredData = data;
    newDatarender(filteredData);
  });

  /// line graph
  const plot = select(".plot")
                .append("svg")
                .attr("width", 500)
                .attr("height", 500);
  
  function updateByClick(d) {
    const temp = parseID(d);
    selectedRegion = temp === selectedRegion ? null : temp;
    // selectedRegion = temp;
    // console.log(selectedRegion)
    // console.log(d);

    const circles = g.selectAll('circle')
    circles.classed("highlighted", d => selectedRegion && selectedRegion === parseID(d))


    const highlightedMain = g.selectAll('circle.country-circle.highlighted').data()
    const highlightedSub = g.selectAll('circle.country-circle2.highlighted').data()


    if(selectedRegion === null){
      plot.selectAll('g').remove();
      plot.selectAll('path').remove();
    }
    else{
      plot.selectAll('g').remove();
      plot.selectAll('path').remove();

      const plotWidth = plot.attr("width");
      const plotHeight = plot.attr("height");
      const graphMargin = {top: 40, right: 60, bottom: 80, left: 60};
      const innerWidth = plotWidth - graphMargin.right - graphMargin.left;
      const innerHeight = plotHeight - graphMargin.top - graphMargin.bottom;

      const plotg = plot.append('g')
                          .attr("transform", `translate(${graphMargin.left},${graphMargin.top})`);

      const value = DateKeys.reduce((prev, cur) => {
        prev.push(d[cur]);
        return prev;
      }, []);

      const MainValues = highlightedMain.length !== 0 ? DateKeys.reduce((prev, cur) => {
        prev.push(highlightedMain[0][cur]);
        return prev;
      }, []) : null;

      const SubValues = highlightedSub.length !== 0 ? DateKeys.reduce((prev, cur) => {
        prev.push(highlightedSub[0][cur]);
        return prev;
      }, []) : null;

      if(MainValues && SubValues){
        const regex = /(.*) \+ (.*)/;
        const [_, main, sub] = current.match(regex);

        const x = scaleTime()
        .domain(extent(DateKeys, timeParse("%m/%d/%y")))
        .range([ 0, innerWidth ]);
        plotg.append("g")
          .attr("transform", `translate(0,${innerHeight})`)
          .call(axisBottom(x).tickFormat(formatDate));

        // Add Y axis
        const y = scaleLinear()
          .domain([0, max([max(MainValues, d => +d), max(SubValues, d => +d)])])
          .range([ innerHeight, 0 ]);
        plotg.append("g")
          .call(axisLeft(y));

        // Add the line
        plotg.append("path")
          .datum(MainValues)
          .attr("fill", "none")
          .attr("stroke", colorScheme[main]['default'])
          //.attr("stroke", colorScheme[highlightedMain[0].state]['default'])
          .attr("stroke-width", 1.5)
          .attr("d", line()
            .x((d, i) => {
              if (DateKeys[i] == currentDate) {
                currentDate_x = x(timeParse("%m/%d/%y")(DateKeys[i]));
              }
              return x(timeParse("%m/%d/%y")(DateKeys[i]));
            })
            .y(d => y(+d))
            );
        
        console.log(currentDate_x);

        // Add the line
        plotg.append("path")
          .datum(SubValues)
          .attr("fill", "none")
          .attr("stroke", colorScheme[sub]['default'])
          //.attr("stroke", colorScheme[highlightedSub[0].state]['default'])
          .attr("stroke-width", 1.5)
          .attr("d", line()
            .x((d, i) => x(timeParse("%m/%d/%y")(DateKeys[i])))
            .y(d => y(+d))
            );

        plotg.append("text")
            .attr("y", -20)
            .attr("x", innerWidth / 2)
            .attr("text-anchor", "middle")
            .text(`${selectedRegion.endsWith('/') ? selectedRegion.slice(0, -1): selectedRegion} (${current})`);

        plotg.append("line")
            .attr("x1", currentDate_x)
            .attr("y1", 0)
            .attr("x2", currentDate_x)
            .attr("y2", innerHeight)
            .attr("stroke", 'black')
            .attr("stroke-width", 1.5)
            .style("stroke-dasharray", "3, 3");

        // console.log(DateKeys);

        // 범례 추가
        const LineChartLabels = plotg.append("g")
                                      .attr("transform", `translate(${graphMargin.left},${0})`);
        const LineChartLabels_main = LineChartLabels.append("g");
        const LineChartLabels_sub = LineChartLabels.append("g")
                                                    .attr("transform", `translate(${200},${0})`);

        const LabelSquareLength = 15;

        LineChartLabels_main.append("rect")
          .attr("y", plotHeight - 65 - LabelSquareLength)
          .attr("width", LabelSquareLength)
          .attr("height", LabelSquareLength)
          .attr("fill", colorScheme[main]['default']);

        LineChartLabels_main.append("text")
          .attr("y", plotHeight - 65)
          .attr("x", LabelSquareLength + 10)
          .attr("text-anchor", "left")
          .text(main);

        LineChartLabels_sub.append("rect")
          .attr("y", plotHeight - 65 - LabelSquareLength)
          .attr("width", LabelSquareLength)
          .attr("height", LabelSquareLength)
          .attr("fill", colorScheme[sub]['default']);

        LineChartLabels_sub.append("text")
          .attr("y", plotHeight - 65)
          .attr("x", LabelSquareLength + 10)
          .attr("text-anchor", "left")
          .text(sub);
      }
      else{

        const x = scaleTime()
        .domain(extent(DateKeys, timeParse("%m/%d/%y")))
        .range([ 0, innerWidth ]);
        plotg.append("g")
          .attr("transform", `translate(0,${innerHeight})`)
          .call(axisBottom(x).tickFormat(formatDate));

        // Add Y axis
        const y = scaleLinear()
          .domain([0, max(value, d => +d)])
          .range([ innerHeight, 0 ]);
        plotg.append("g")
          .call(axisLeft(y));

        // Add the line

        console.log(current);
        
        plotg.append("path")
          .datum(value)
          .attr("fill", "none")
          .attr("stroke", colorScheme[current]['default'] )
          .attr("stroke-width", 1.5)
          .attr("d", line()
            .x((d, i) => {
              if (DateKeys[i] == currentDate) {
                currentDate_x = x(timeParse("%m/%d/%y")(DateKeys[i]));
              }
              return x(timeParse("%m/%d/%y")(DateKeys[i]));
            })
            .y(d => y(+d))
            )
        
        plotg.append("text")
          .attr("y", -20)
          .attr("x", innerWidth / 2)
          .attr("text-anchor", "middle")
          .text(`${selectedRegion.endsWith('/') ? selectedRegion.slice(0, -1): selectedRegion} (${current})`);

        plotg.append("line")
          .attr("x1", currentDate_x)
          .attr("y1", 0)
          .attr("x2", currentDate_x)
          .attr("y2", innerHeight)
          .attr("stroke", 'black')
          .attr("stroke-width", 1.5)
          .style("stroke-dasharray", "3, 3");

      }
    }
  }
}
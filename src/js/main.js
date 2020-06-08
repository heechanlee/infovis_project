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
  axisRight,
  easeSin
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

  //console.log(alldata);
  
  let current = 'confirmed';

  let selectedRegion = null;
  let selectedDate = '01/22/20';
  const predDays = 3;
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
    //console.log(data);
    selectedRegion = null;

    const sizeScale = d => Math.pow(d/250, 1/2);

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
      //console.log("두번째 데이터");

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
    const sizeScale = d => Math.pow(d/250, 1/2);

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

  
        const circles2 = g.selectAll(".country-circle2")
                          .data(data.covidData2);

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
      endDate = new Date("2020-06-04");

  const offsetPred = (endDate - startDate) / (24*3600*1000) + 1;

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
      .attr("font-size", 10)
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

    currentDate = formatDateY(h);
    
    radiusValue = d => +d[formatDateY(h)];
    selectedDate = formatDateY(h);

    processed.then(data => {
      // radiusValue = d => +d[formatDateY(h)];
      filteredData = data;
      updateDatarender(filteredData);
    });

    if(selectedRegion){
      const xChart = scaleTime()
      .domain(extent(DateKeys, timeParse("%m/%d/%y")))
      .range([ 0, innerWidth ]);

      const verticalLine = plot.select('.verticalLine')
      verticalLine
      .attr("x1", xChart(timeParse("%m/%d/%y")(currentDate)))
      .attr("y1", 0)
      .attr("x2", xChart(timeParse("%m/%d/%y")(currentDate)))
      .attr("y2", innerHeight)
      
    }


  };

  processed.then(data => {
    filteredData = data;
    newDatarender(filteredData);
  });

  /// line graph
  const plot = select(".plot")
                .append("svg")
                .attr("width", 800)
                .attr("height", 500);
  
  const plotWidth = plot.attr("width");
  const plotHeight = plot.attr("height");
  const graphMargin = {top: 40, right: 20, bottom: 80, left: 70};
  const innerWidth = plotWidth - graphMargin.right - graphMargin.left;
  const innerHeight = plotHeight - graphMargin.top - graphMargin.bottom;

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

        const realMain = MainValues.slice(0,-predDays);
        const predMain = MainValues.slice(-predDays);
        const realSub = SubValues.slice(0,-predDays);
        const predSub = SubValues.slice(-predDays);

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
        
        const pathMain = plotg.append("path")
          .datum(realMain)
          .attr("fill", "none")
          .attr("stroke", colorScheme[main]['default'])
          //.attr("stroke", colorScheme[highlightedMain[0].state]['default'])
          .attr("stroke-width", 1.5)
          .attr("d", line()
              .x((d, i) =>  x(timeParse("%m/%d/%y")(DateKeys[i])))
              .y(d => y(+d))
          )
        const pathPredMain = plotg.append("path")
          .datum(predMain)
          .attr("fill", "none")
          .attr("stroke", colorScheme[main]['default'])
          //.attr("stroke", colorScheme[highlightedMain[0].state]['default'])
          .attr("stroke-width", 1.5)
          .attr("d", line()
              .x((d, i) =>  x(timeParse("%m/%d/%y")(DateKeys[offsetPred+i])))
              .y(d => y(+d))
          )
        
        const pathSub = plotg.append("path")
          .datum(realSub)
          .attr("fill", "none")
          .attr("stroke", colorScheme[sub]['default'])
          //.attr("stroke", colorScheme[highlightedSub[0].state]['default'])
          .attr("stroke-width", 1.5)
          .attr("d", line()
            .x((d, i) => x(timeParse("%m/%d/%y")(DateKeys[i])))
            .y(d => y(+d))
            )

        const pathPredSub = plotg.append("path")
          .datum(predSub)
          .attr("fill", "none")
          .attr("stroke", colorScheme[sub]['default'])
          //.attr("stroke", colorScheme[highlightedSub[0].state]['default'])
          .attr("stroke-width", 1.5)
          .attr("d", line()
            .x((d, i) => x(timeParse("%m/%d/%y")(DateKeys[offsetPred+i])))
            .y(d => y(+d))
            )
            

        const pathLengthMain = pathMain.node().getTotalLength();
        const pathLengthSub = pathSub.node().getTotalLength();
        const pathLengthMainPred = pathPredMain.node().getTotalLength();
        const pathLengthSubPred = pathPredSub.node().getTotalLength();

        pathPredMain
          .attr('stroke-dasharray', pathLengthMainPred)
          .attr('stroke-dashoffset', pathLengthMainPred)

        pathPredSub
          .attr('stroke-dasharray', pathLengthSubPred)
          .attr('stroke-dashoffset', pathLengthSubPred)

        pathMain
          .attr('stroke-dasharray', pathLengthMain)
          .attr('stroke-dashoffset', pathLengthMain)
          .transition()
          .ease(easeSin)
          .duration(1000)
          .attr('stroke-dashoffset', 0)
          .on('end', () => {
            pathPredMain
              .transition()
              .duration(1000)
              .attr('stroke-dashoffset', 0)
              .attr('stroke-dasharray', '2')        
          })


        pathSub
          .attr('stroke-dasharray', pathLengthSub)
          .attr('stroke-dashoffset', pathLengthSub)
          .transition()
          .ease(easeSin)
          .duration(1000)
          .attr('stroke-dashoffset', 0)
          .on('end', () => {
            pathPredSub
              .transition()
              .duration(1000)
              .attr('stroke-dashoffset', 0)
              .attr('stroke-dasharray', '2')        
          })


        plotg.append("text")
            .attr("y", -20)
            .attr("x", innerWidth / 2)
            .attr("text-anchor", "middle")
            .text(`${selectedRegion.endsWith('/') ? selectedRegion.slice(0, -1): selectedRegion} (${current})`);
        
        plotg.append("line")
          .attr('class', 'verticalLine')
          .attr("x1", x(timeParse("%m/%d/%y")(currentDate)))
          .attr("y1", 0)
          .attr("x2", x(timeParse("%m/%d/%y")(currentDate)))
          .attr("y2", innerHeight)
          .attr("stroke", 'black')
          .attr("stroke-width", 1.5)
          .style("stroke-dasharray", "3, 3");

        // 범례 추가
        const legendG = plotg.append("g")
                             .attr("transform", `translate(${graphMargin.left},${0})`);
        const legendMain = legendG.append("g");
        const legendSub = legendG.append("g")
                                 .attr("transform", `translate(${150},${0})`);
        const rate = legendG.append("g")
                                 .attr("transform", `translate(${300},${0})`);

        const LabelSquareLength = 15;

        legendMain.append("rect")
          .attr("y", plotHeight - 65 - LabelSquareLength)
          .attr("width", LabelSquareLength)
          .attr("height", LabelSquareLength)
          .attr("fill", colorScheme[main]['default']);

        legendMain.append("text")
          .attr("y", plotHeight - 65)
          .attr("x", LabelSquareLength + 10)
          .attr("text-anchor", "left")
          .text(main);

        legendSub.append("rect")
          .attr("y", plotHeight - 65 - LabelSquareLength)
          .attr("width", LabelSquareLength)
          .attr("height", LabelSquareLength)
          .attr("fill", colorScheme[sub]['default']);

        legendSub.append("text")
          .attr("y", plotHeight - 65)
          .attr("x", LabelSquareLength + 10)
          .attr("text-anchor", "left")
          .text(sub);

        const MainEnd = MainValues.slice(-1)
        const SubEnd = SubValues.slice(-1)

        rate.append("text")
          .attr("y", plotHeight - 65)
          .attr("x", LabelSquareLength + 10)
          .attr("text-anchor", "left")
          .text(`current rate of ${sub} cases: ${((SubEnd/MainEnd) * 100).toFixed(2)}%`);
      }
      else{

        const x = scaleTime()
        .domain(extent(DateKeys, timeParse("%m/%d/%y")))
        .range([ 0, innerWidth ]);
        plotg.append("g")
          .attr("transform", `translate(0,${innerHeight})`)
          .call(axisBottom(x).tickFormat(formatDate));


        const realMain = value.slice(0,-predDays);
        const predMain = value.slice(-predDays)
        // Add Y axis
        const y = scaleLinear()
          .domain([0, max(value, d => +d)])
          .range([ innerHeight, 0 ]);
        plotg.append("g")
          .call(axisLeft(y));

        // Add the line

        const pathMain = plotg.append("path")
          .datum(realMain)
          .attr("fill", "none")
          .attr("stroke", colorScheme[current]['default'] )
          .attr("stroke-width", 1.5)
          .attr("d", line()
          .x((d, i) =>  x(timeParse("%m/%d/%y")(DateKeys[i])))
          .y(d => y(+d))
          )
        const pathPredMain = plotg.append("path")
          .datum(predMain)
          .attr("fill", "none")
          .attr("stroke", colorScheme[current]['default'] )
          .attr("stroke-width", 1.5)
          .attr("d", line()
          .x((d, i) =>  x(timeParse("%m/%d/%y")(DateKeys[offsetPred+i])))
          .y(d => y(+d))
          )       

        const pathLengthMain = pathMain.node().getTotalLength();
        const pathLengthMainPred = pathPredMain.node().getTotalLength();

        pathPredMain
          .attr('stroke-dasharray', pathLengthMainPred)
          .attr('stroke-dashoffset', pathLengthMainPred);

        pathMain
          .attr('stroke-dasharray', pathLengthMain)
          .attr('stroke-dashoffset', pathLengthMain)
          .transition()
          .ease(easeSin)
          .duration(1000)
          .attr('stroke-dashoffset', 0)
          .on('end', () => {
            pathPredMain
              .transition()
              .duration(1000)
              .attr('stroke-dashoffset', 0)
              .attr('stroke-dasharray', '2')
          })       


        plotg.append("text")
            .attr("y", -20)
            .attr("x", innerWidth / 2)
            .attr("text-anchor", "middle")
            .text(`${selectedRegion.endsWith('/') ? selectedRegion.slice(0, -1): selectedRegion} (${current})`);

        const legendG = plotg.append("g")
          .attr("transform", `translate(${innerWidth / 2 - 30},${0})`)
        const legendMain = legendG.append("g");

        const LabelSquareLength = 15;

        legendMain.append("rect")
        .attr("y", plotHeight - 65 - LabelSquareLength)
        .attr("width", LabelSquareLength)
        .attr("height", LabelSquareLength)
        .attr("fill", colorScheme[current]['default']);

        legendMain.append("text")
        .attr("y", plotHeight - 65)
        .attr("x", LabelSquareLength + 10)
        .attr("text-anchor", "left")
        .text(current);

            
        plotg.append("line")
          .attr('class', 'verticalLine')
          .attr("x1", x(timeParse("%m/%d/%y")(currentDate)))
          .attr("y1", 0)
          .attr("x2", x(timeParse("%m/%d/%y")(currentDate)))
          .attr("y2", innerHeight)
          .attr("stroke", 'black')
          .attr("stroke-width", 1.5)
          .style("stroke-dasharray", "3, 3");

      }
    }
  }
}
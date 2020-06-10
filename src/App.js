import React, { useEffect, useState, useReducer } from 'react';
import './App.css';
import AddChart from './AddChart';
import ChartSet from './ChartSet';

import dataService from './services/dataService';

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) === variable) {
          return decodeURIComponent(pair[1]);
      }
  }
  console.log('Query variable %s not found', variable);
}

function App(props) {
  const [charts, dispatchCharts] = useReducer((charts, {type, value}) => {
    switch (type) {
      case "add":
        return [...charts, value];
      case "remove":
        console.log(type, value);
        let otherCharts = charts.filter(c => {
          return c.chartType !== value.type;
        });

        let chartsRemovedFrom = charts.filter(c => c.chartType === value.type).filter((_, i) => {
          return i !== value.index;
        });
        
        return [...otherCharts, ...chartsRemovedFrom];
      case "update":
        for (let i = 0; i < charts.length; i++) {
          if (charts[i].county === value.county && charts[i].state === value.county) {
            charts[i].data = value.data;
          }
        }

        return [...charts];
      default:
        return charts;
    }
  }, []);
  const [states, setStates] = useState([]);
  const [counties, setCounties] = useState([]);
  const [statesData, setStatesData] = useState([]);
  const [countiesData, setCountiesData] = useState([]);
  const [usData, setUSData] = useState([]);

  useEffect(() => {
    getData();

    let countyCharts = getQueryVariable('countyCharts');
    let stateCharts = getQueryVariable('stateCharts');
    let usCharts = getQueryVariable('usCharts');

    if (countyCharts) {
      let countyChartPieces = countyCharts.split(';');

      for (let i = 0; i < countyChartPieces.length; i++) {
        let chartData = countyChartPieces[i].split(',');

        addCountyChart(chartData[0], chartData[1]);
      }
    }

    if (stateCharts) {
      let stateChartPieces = stateCharts.split(';');

      for (let i = 0; i < stateChartPieces.length; i++) {
        addStateChart(stateChartPieces[i]);
      }
    }

    if (usCharts) {
      let usChartCount = parseInt(usCharts, 10);

      if (isNaN(usChartCount)) {
        return;
      }

      for (let i = 0; i < usChartCount; i++) {
        addUSChart();
      }
    }
  }, []);

  useEffect(() => {
    window.history.replaceState(
      null, 
      null, 
      window.location.origin + 
      window.location.pathname + 
      `?countyCharts=${encodeURIComponent(charts.filter(c => c.chartType === 'county').map(c => {
        return `${c.county},${c.state}`;
      }).join(';'))}` + 
      `&stateCharts=${encodeURIComponent(charts.filter(c => c.chartType === 'state').map(c => {
        return `${c.state}`;
      }).join(';'))}` + 
      `&usCharts=${encodeURIComponent(charts.filter(c => c.chartType === 'us').length)}`);
  }, [charts]);

  useEffect(() => {
    for (let i = 0; i < charts.length; i ++) {
      switch(charts[i].chartType) {
        case 'county':
          dispatchCharts({
            type: 'update',
            value: addDataToCountyChart(charts[i])
          });
          break;
        case 'state':
          dispatchCharts({
            type: 'update',
            value: addDataToStateChart(charts[i])
          });
          break;
        case 'us':
          dispatchCharts({
            type: 'update',
            value: addDataToUSChart(charts[i])
          });
          break;
        default:
          break;
      }
    }
  }, [countiesData, statesData, usData]);

  function refreshData() {
    dataService.refresh().then(() => {
      getData();
    }); 
  }

  function getData() {
    dataService.getStates().then(setStates(states));
    dataService.getCounties().then(setCounties);
    dataService.getCountiesData().then(setCountiesData);
    dataService.getStatesData().then(setStatesData);
    dataService.getUSData().then(setUSData);
  }

  function transform(data) {
    data = data.sort((a,b) => {
        if (a.date < b.date) {
            return -1;
        }

        if (a.date > b.date) {
            return 1;
        }

        return 0;
    });

    let average = (values) => {
        return values.reduce((p,c) => p + c, 0) / values.length;
    };    

    let sevenDayCases = [0,0,0,0,0,0,0];
    let prevDayTotal = 0;

    for (let i = 0; i < data.length; i++) {
        data[i].newCases = data[i].cases - prevDayTotal;

        sevenDayCases.shift();
        sevenDayCases.push(data[i].newCases);

        data[i].rollingAverageCases = average(sevenDayCases);

        prevDayTotal = data[i].cases;
    }

    return data;
}

function addDataToCountyChart(chart) {
  let county = counties.filter(c => c.county === chart.county && c.state === chart.state)[0];

  console.log(county);
  if (!!county) {
    if (county.fips && county.fips !== '') {
      chart.data = countiesData.filter(d => d.fips === county.fips);
    }
    else {
      chart.data = countiesData.filter(d => d.state === county.state && d.county === county.county);
    }
    chart.data = transform(chart.data);
  }
  
  console.log(chart);

  return chart;
}

  function addCountyChart(countyName, state) {
    let newChart = {
      chartType: 'county',
      name: `${ countyName }, ${ state }`,
      county: countyName,
      state: state,
      data: [],
    };

    newChart = addDataToCountyChart(newChart);
    
    dispatchCharts({ type: 'add', value: newChart});
  }

  function addDataToStateChart(newChart) {
    newChart.data = statesData.filter(d => d.state === newChart.state);

    newChart.data = transform(newChart.data);

    return newChart;
  }

  function addStateChart(state) {
    let newChart = {
      chartType: 'state',
      name: state,
      state: state,
    };

    newChart = addDataToStateChart(newChart);

    dispatchCharts({ type: 'add', value: newChart});
  }

  function addDataToUSChart(newChart) {
    newChart.data = transform(usData);
    return newChart;
  }

  function addUSChart() {
    let newChart = {
      chartType: 'us',
      name: 'U.S.',
    };

    newChart = addDataToUSChart(newChart);

    dispatchCharts({ type: 'add', value: newChart});
  }

  function handleChartAdd(chartAdd) {
    switch(chartAdd.chartType) {
      case('county'):
        addCountyChart(chartAdd.county, chartAdd.state);
        return;
      case('state'):
        addStateChart(chartAdd.state);
        return;
      case('us'):
        addUSChart();
        return;
      default: 
        return;
    };
  }
  
  return (
    <article>
      <button onClick={refreshData}>Refresh data</button>
      <AddChart 
        onChartAdd={handleChartAdd}
        states={states}
        counties={counties} />
      
      <ChartSet 
        charts={charts.filter(c => c.chartType === 'county')} 
        remove={i => dispatchCharts({ 
          type: 'remove',
          value: {
            index: i,
            type: 'county',
          },
        })} />
      <ChartSet 
        charts={charts.filter(c => c.chartType === 'state')} 
        remove={i => dispatchCharts({ 
          type: 'remove',
          value: {
            index: i,
            type: 'state',
          },
        })} />   
      <ChartSet 
        charts={charts.filter(c => c.chartType === 'us')} 
        remove={i => {
          console.log('remove');
          dispatchCharts({ 
            type: 'remove',
            value: {
              index: i,
              type: 'us',
            },
          });
        }} />   
        <section>
          <h3>Understanding the charts</h3>
          <p>Each chart shows new daily cases on a rolling 7-day average. Y-axis is new cases and 
            x-axis is each day, starting when a location reaches 30 new cases in a day. </p>
          <p>Counties are on the same scale as each other and states are on the same scale as 
            each other.</p>
          <p>The dashed line represents data from the last 14 days. Some locations (my state of 
            Georgia included) backdate cases to an estimated "infected date", meaning that the most
            recent 14 days are unreliable. The end result is that the last 14 days almost always 
            show a downard trend. I don't know how many other locations do the same thing, 
            so the dashed line may or may not be reliable, but you can generally expect that it may 
            go up, but not down.</p>
          <p>The charts are color coded along a simplified version of <a href="http://www.asymco.com/">Horace Dediu</a>'s categorization:</p>
          <blockquote>
            <p>Green: Late Stage (>50% post-peak)<br/>
            Blue: Middle-Late Stage (~50% post-peak)<br/>
            Orange: Middle-Early Stage (peaked)<br/>
            Pink: Early Stage [or indeterminate] (pre-peak)</p>
          </blockquote>
          <p>My simplified application means that often indeterminate stages are mis-categorized another
            a location doesn't have a clear peak yet, it is probably Early/Indeterminate, regardless of 
            the color.
          </p>
          <p>I didn't feel like futzing with a database server for this, so all the data is 
            handled locally. Apologies for the page load hit. The data should refresh when stale, but if 
            you think your data is incorrect, you can force a refresh with the "Refresh data" button.</p>
        </section>
        <section>
          <h3>About this app</h3>
          <p>This app was borne out of my desire to both see how the Coronavirus pandemic is
            faring in locations I care about, seeing that in as narrow a location as possible, 
            and having some kind of objective markers for when things are "ok". I found great
            value in the <a href="https://www.ajc.com/news/coronavirus-georgia-covid-dashboard/jvoLBozRtBSVSNQDDAuZxH/#main">AJC's Coronavirus Dashboard</a>, 
            the <a href="https://dph.georgia.gov/covid-19-daily-status-report">Georgia Department of 
            Health's COVID 19 Daily Report</a>, and <a href="https://twitter.com/asymco/">Horace 
            Dediu's periodic chart releases</a>. I would check the AJC and GA DPH daily and would 
            often anticipate an update from Horace's analysis.
          </p>
          <p>The data is from the <a href="https://github.com/nytimes/covid-19-data">NY Times 
          dataset</a>, which has US, State, and, importantly, County data.</p>     
        </section>
    </article>
  );
}

export default App;

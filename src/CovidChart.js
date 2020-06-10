import React from 'react';

import Chart from './Chart';

const viewBoxWidth = 300;
const viewBoxHeight = 200;

function getDataSubset(data) {
    let startIndex;

    for (let i = 0; i < data.length; i++) {
      if (data[i].rollingAverageCases > 30) {
        startIndex = i;
        break;
      }
    }

    if (startIndex == null) {
      return [];
    }

    let now = new Date();
    now.setDate(now.getDate() - 14);
    let twoWeeksAgoString = now.toDateString();

    let endIndex;
    for (let i = data.length - 1; i > 0; i--) {
        if (new Date(data[i].date).toDateString() === twoWeeksAgoString) {
            endIndex = i;
        }
    }

    if (endIndex == null) {
        return data.slice(startIndex);
    }

    return data.slice(startIndex,endIndex);
}

function getPoints(data, maxCases, maxDays, init) {
    init = init ?? 0;

    return data.map((c, i) => {        
        let y = viewBoxHeight - (c.rollingAverageCases / maxCases * viewBoxHeight);
        return `${(i + init) * viewBoxWidth / maxDays},${y}`;
    });
}

function getBackground(data) {
    if (data.length <= 0) {
        return "white";
    }

    let peak = data.reduce((p,c) => {
        if (c.rollingAverageCases > p) {
            return c.rollingAverageCases;
        }

        return p;
    }, 0);

    let lastDataPoint = data[data.length - 1];

    if (lastDataPoint.rollingAverageCases < peak / 2) {
        return "#BAE8BA";
    }

    if (lastDataPoint.rollingAverageCases < peak * .75) {
        return "#BAE0E8";        
    }

    if (lastDataPoint.rollingAverageCases < peak * .9) {
        return "#F5CE8C";
    }

    return "#E8BABA";
}

function getPeriodOfUncertainty(data) {
    let now = new Date();
    now.setDate(now.getDate() - 14);
    let twoWeeksAgoString = now.toDateString();

    let endIndex;
    for (let i = data.length - 1; i > 0; i--) {
        if (new Date(data[i].date).toDateString() === twoWeeksAgoString) {
            endIndex = i;
        }
    }

    if (endIndex == null) {
        return []
    }

    return data.slice(endIndex - 1);    
}

function CovidChart(props) {
    let viewBox = [0,0,viewBoxWidth,viewBoxHeight];
    let dataSubset = getDataSubset(props.data);
    let periodOfUncertainty = getPeriodOfUncertainty(props.data);
    let points = getPoints(dataSubset, props.maxCases, props.maxDays);
    let uncertainPoints = getPoints(periodOfUncertainty, props.maxCases, props.maxDays, dataSubset.length - 1);
    let background = getBackground(dataSubset);

    let content = (<div>Waiting for data</div>);

    if (!!props.data && props.data.length > 0) {
        content = (<div>Daily cases not above 30</div>);
    }

    if (dataSubset.length > 0) {
        content = (<div className="covidChart-content">
            <div className="covidChart-label covidChart-label-100">{Math.ceil(props.maxCases)}</div>
            <div className="covidChart-label covidChart-label-75">{Math.ceil(props.maxCases * .75)}</div>
            <div className="covidChart-label covidChart-label-50">{Math.ceil(props.maxCases * .5)}</div>
            <div className="covidChart-label covidChart-label-25">{Math.ceil(props.maxCases * .25)}</div>
            <Chart viewBox={viewBox} points={points} background={background} uncertainPoints={uncertainPoints} />
        </div>);
    }

    return (<section className="covidChart">
        <h2>{ props.name }</h2>
        { content }
        <div><button onClick={_ => {
            props.remove();
        } }>Remove</button>
        </div>
    </section>);
}

export default CovidChart;

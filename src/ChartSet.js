import React from 'react';
import CovidChart from './CovidChart';


function ChartSet(props) {
  function getMaxCases(charts) {
    let allData = charts.reduce((p,c) => {
        return p.concat(c.data);
    }, []);

    let maxCases = allData.reduce((p,c) => {
      if (c.rollingAverageCases > p) {
        return c.rollingAverageCases;
      }

      return p;
    }, 0);

    return maxCases;
  }

  function getMaxDays(charts) {
    let maxDays = 0;

    for (let i = 0; i < charts.length; i++) {
      let l = charts[i].data.length;
      if (l > maxDays) {
        maxDays = l;
      }
    }

    return maxDays;
  }

  let maxCases = getMaxCases(props.charts);
  let maxDays = getMaxDays(props.charts);

    return (
        <section className="chartset">
            { props.charts.map((c,i) => {
                return (<CovidChart 
                  key={i}
                  name={c.name} 
                  data={c.data} 
                  maxCases={maxCases} 
                  maxDays={maxDays}
                  remove={() => props.remove(i)}
                />)
            })}            
        </section>
    );
}

export default ChartSet;

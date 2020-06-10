import React, { useState, useEffect } from 'react';

function countySort(a,b) {
    if (a.county > b.county) {
        return 1;
    }

    if (b.county > a.county) {
        return -1;
    }

    return 0;
}

function AddChart(props) {
    const [addingChart, setAddingChart] = useState(false);
    const [chartType, setChartType] = useState('county');
    const [state, setState] = useState('');
    const [county, setCounty] = useState('');

    useEffect(() => {
        setState(props.states.sort()[0]);
    }, [props]);

    useEffect(() => {
        console.log(state);

        let county = props.counties.filter(c => c.state === state).sort(countySort)[0];

        if (!!county) {
            setCounty(county.county);
        }
    }, [state]);
    
    function handleAddChart (e) {
        props.onChartAdd({
            chartType,
            state,
            county,
        });
        setAddingChart(false);
    }

    if (props.states.length <= 0) {
        return (<div>Loading data</div>);
    }

    if (!addingChart) {
        return (<section> 
            <button onClick={() => setAddingChart(true)}>Add chart</button>
        </section>);
    }

    let cancelButton = (<button onClick={() => setAddingChart(false)}>Cancel</button>);

    let chartTypeSelect = (
        <span>
            <label>Chart Type</label>
            <select onChange={(e) => setChartType(e.target.value)} value={chartType}>
                <option name="type" value="county">County</option>
                <option name="type" value="state">State</option>
                <option name="type" value="us">US</option>
            </select>
        </span>);

    if (chartType === 'us') {
        return (<section>
            { chartTypeSelect }
            <button onClick={handleAddChart}>Add US chart</button>
            {cancelButton}
        </section>);
    }
    
    let stateSelect = (<select value={state} onChange={e => setState(e.target.value)}>
        {props.states.sort().map(s => {
            return (<option key={s} value={s}>{s}</option>);
        })}
    </select>);

    if (chartType === 'state') {
        return (<section>
            { chartTypeSelect }
            { stateSelect }
            <button onClick={handleAddChart}>Add chart for { state }</button>
            {cancelButton}
        </section>
        )
    }

    if (chartType !== 'county') {
        return (<section>
            { chartTypeSelect }
            { cancelButton }
        </section>
        );
    }

    let countySelect = (<select value={county} onChange={e => setCounty(e.target.value)}>
        {props.counties.filter(c => c.state === state).sort(countySort).map(c => {
            return (<option key={c.county} value={c.county}>{c.county}</option>);
        })}
    </select>);

    return (<section>
        { chartTypeSelect }
        { stateSelect }
        { countySelect }
        <button onClick={handleAddChart}>Add chart for { county }, { state }</button>
        { cancelButton }
    </section>);
}

export default AddChart;

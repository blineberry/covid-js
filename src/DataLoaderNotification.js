import React from 'react';

function DataLoaderNotification(props) {
    if (props.hasData) {
        return (<div />);
    }

    return <p>Loading data…</p>
}

export default DataLoaderNotification;

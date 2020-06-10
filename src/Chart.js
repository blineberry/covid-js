import React  from 'react';

function Chart(props) {

    if (props.points.length <=0) {
        return (<div className="chart">Insufficient Data</div>)
    }

    return (
        <svg viewBox={props.viewBox.join(' ')} className="chart">
                <rect x="0" y="0" width="100%" height="100%" fill={props.background} />
                <line x1="0" y1="75%" x2="100%" y2="75%" stroke="gray" strokeWidth="0.5" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="gray" strokeWidth="0.5" />
                <line x1="0" y1="25%" x2="100%" y2="25%" stroke="gray" strokeWidth="0.5" />
                
                <polyline
                    fill="none"
                    stroke="#0074d9"
                    strokeWidth="1"
                    points={props.points.join(' ')}
                />

                <polyline
                    fill="none"
                    stroke="#0074d9"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                    points={props.uncertainPoints.join(' ')}
                />
            </svg>
    );
}

export default Chart;

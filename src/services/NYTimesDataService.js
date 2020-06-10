import axios from 'axios';
import parse from 'csv-parse';


const URLS = {
    counties: "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv",
    states: "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv",
    nation: "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us.csv"


}

let isFetching = false;
let fetchingPromise;

let get = (url, filter) => {
    return axios.get(url)
        .then(response => {
            console.log(response.status);
            console.log(response.data.length);

            return new Promise((resolve, reject) => {
                //let output = [];
//
                //parser.on('readable', () => {
                //    let record;
                //    while (record = parser.read()) {
                //        output.push(record);
                //    }
                //});
//
                //parser.on('error', (err) => {
                //    reject(err);
                //});
//
                //parser.on('end', function() {
                //    resolve(output);
                //});
//
                //parser.write(response.data);
                //parser.end();

                parse(response.data, {
                    columns: true
                }, (err, output) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(output);
                });
            });
        });
};

let getCounties = () => {
    console.log('NYTimes counties fetch');

    return get(URLS.counties);
}

let getStates = () => {
    console.log('NYTimes states fetch');

    return get(URLS.states);
}

let getUS = () => {
    console.log('NYTimes US fetch');

    return get(URLS.nation);
}

let getAll = () => {
    let countyPromise = getCounties();
    let statePromise = getStates();
    let usPromise = getUS();

    return Promise.all([countyPromise, statePromise, usPromise]).then(values => {
        return {
            counties: values[0],
            states: values[1],
            us: values[2],
        };
    })
};

export default {
    get: () => {
        if (isFetching) {
            return fetchingPromise;
        }

        fetchingPromise = getAll().then(counties => {
            isFetching = false;
            return counties;
        });
        isFetching = true;
        return fetchingPromise;
    }
}
import localData from './localDataService';
import NYTimesData from './NYTimesDataService';

let getUpToDateLocalData = () => {
    return localData.isUpToDate().then(isUpToDate => {
        console.log('isUpToDate', isUpToDate);

        if (isUpToDate) {
            return localData;
        }

        return refresh().then(() => localData);
    });
};

let getStates = () => {
    console.log('data service getStates');

    return getUpToDateLocalData().then(localData => localData.getStates());
};

let getCounties = (state) => {
    return getUpToDateLocalData().then(localData => localData.getCounties(state));
};

let average = (values) => {
    return values.reduce((p,c) => p + c, 0) / values.length;
};

let getCountiesData = (state) => {
    return getUpToDateLocalData()
    .then(localData => localData.getCountiesData(state))
    .then(countiesData => {
        return countiesData = countiesData.sort((a,b) => {
            if (a.date < b.date) {
                return -1;
            }

            if (a.date > b.date) {
                return 1;
            }

            return 0;
        }).sort((a,b) => {
            if (a.county < b.county) {
                return 1;
            }

            if (a.county > b.county) {
                return -1;
            }

            return 0;
        });
    })
    .then(countiesData => {
        let sevenDayCases, prevDayTotal, currentCounty;

        for (let i = 0; i < countiesData.length; i++) {
            if (currentCounty !== countiesData[i].county) {
                sevenDayCases = [0,0,0,0,0,0,0];
                prevDayTotal = 0;
                currentCounty = countiesData[i].county;
            }

            countiesData[i].newCases = countiesData[i].cases - prevDayTotal;

            sevenDayCases.shift();
            sevenDayCases.push(countiesData[i].newCases);

            countiesData[i].rollingAverageCases = average(sevenDayCases);

            prevDayTotal = countiesData[i].cases;
        }

        return countiesData;
    });
};

let getCountyData = (fips) => {
    return getUpToDateLocalData()
    .then(localData => localData.getCountyData(fips))
    .then(countyData => {
        countyData = countyData.sort((a,b) => {
            if (a.date < b.date) {
                return -1;
            }

            if (a.date > b.date) {
                return 1;
            }

            return 0;
        });

        let sevenDayCases = [0,0,0,0,0,0,0];
        let prevDayTotal = 0;

        for (let i = 0; i < countyData.length; i++) {
            countyData[i].newCases = countyData[i].cases - prevDayTotal;

            sevenDayCases.shift();
            sevenDayCases.push(countyData[i].newCases);

            countyData[i].rollingAverageCases = average(sevenDayCases);

            prevDayTotal = countyData[i].cases;
        }

        return countyData;
    });  
}

let refresh = () => {
    return NYTimesData.get()
    .then(localData.set).catch(err => console.log(err));
};

let getStatesData = () => {
    return getUpToDateLocalData()
    .then(localData => localData.getStatesData());
};

let getUSData = () => {
    return getUpToDateLocalData()
    .then(localData => localData.getUSData());
}

export default {
    getCountyData,
    getStates,
    getCounties,
    refresh,
    getCountiesData,
    getStatesData,
    getUSData,
};
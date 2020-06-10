import { openDB } from 'idb';

const dbPromise = openDB('Covid', 14, {
    upgrade(db, oldVersion, newVersion) {
        console.log('oldVersion', oldVersion);
        console.log('newVersion', newVersion);

        if (oldVersion < 1) {
            db.createObjectStore('counties', {
                // The 'date' property of the object will be the key.
                keyPath: 'id',
                autoIncrement: true,
            });

            const countyDataStore = db.createObjectStore('countyData', {
                keyPath: 'id',
                autoIncrement: true
            });
        
            countyDataStore.createIndex('date','date');
            countyDataStore.createIndex('fips','fips');
        }

        if (oldVersion < 2) {
            db.deleteObjectStore('countyData');

            db.createObjectStore('countyRawData', {
                keyPath: 'id',
                autoIncrement: true
            });
        
            let metaDataStore = db.createObjectStore('meta', {
                keyPath: 'id',
                autoIncrement: true,
            });

            metaDataStore.createIndex('key', 'key');
        }        

        if (oldVersion < 3) {
            db.createObjectStore('countyData', {
                keyPath: 'id',
                autoIncrement: true
            });            
        }

        if (oldVersion < 4) {
            db.deleteObjectStore('meta');

            let metaDataStore = db.createObjectStore('meta', {
                keyPath: 'key',
            });

            metaDataStore.createIndex('key', 'key');
        }
        
        if (oldVersion < 5) {
            db.deleteObjectStore('meta');

            let metaDataStore = db.createObjectStore('meta', {
                keyPath: 'key',
                autoIncrement: false,
            });

            metaDataStore.createIndex('key', 'key');
        }

        if (oldVersion < 6) {
            db.deleteObjectStore('meta');

            let metaDataStore = db.createObjectStore('meta');

            metaDataStore.createIndex('key', 'key');
        }

        if (oldVersion < 8) {
            db.deleteObjectStore('meta');

            db.createObjectStore('meta');
        }

        if (oldVersion < 9) {
            db.createObjectStore('states', {
                // The 'date' property of the object will be the key.
                keyPath: 'id',
                autoIncrement: true,
            });
        }

        if (oldVersion < 10) {
            db.deleteObjectStore('states');

            db.createObjectStore('states');
        }

        if (oldVersion < 11) {
            db.deleteObjectStore('counties');

            const countiesDataStore = db.createObjectStore('counties', {
                // The 'date' property of the object will be the key.
                keyPath: 'id',
                autoIncrement: true,
            });

            countiesDataStore.createIndex('state', 'state');
        }

        if (oldVersion < 12) {
            db.deleteObjectStore('countyRawData');
            db.deleteObjectStore('meta');

            const countyRawDataStore = db.createObjectStore('countyRawData', {
                keyPath: 'id',
                autoIncrement: true
            });

            db.createObjectStore('meta');

            countyRawDataStore.createIndex('fips','fips');
            countyRawDataStore.createIndex('state','state');
            countyRawDataStore.createIndex('county','county');
        }

        if (oldVersion < 13) {
            db.createObjectStore('statesRawData', {
                keyPath: 'id',
                autoIncrement: true
            });
        }

        if (oldVersion < 14) {
            db.createObjectStore('usRawData', {
                keyPath: 'id',
                autoIncrement: true,
            });
        }
    },
    blocked() {
        console.log('blocked');
    },
    blocking() {
        console.log('blocking');
    }
});

let clear = () => {
    console.log('clearing data');

    return dbPromise
    .then(db => Promise.all([
        db.clear('countyRawData').then(() => console.log('cleared county raw data')),
        db.clear('statesRawData').then(() => console.log('cleared state raw data')),
        db.clear('usRawData').then(() => console.log('cleared US raw data')),
        db.clear('counties').then(() => console.log('cleared counties')), 
        db.clear('states').then(() => console.log('cleared states'))
    ]))
    .then(() => {
        console.log('cleared data');
    });
};

var isUpToDate = () => {
    console.log('checking if data is up to date');
    return dbPromise.then(db => {
        console.log('db ready');
        
        console.log('getting rawDataSyncTime');
        return db.get('meta', 'rawDataSyncTime').then(rawDataSyncTime => {
            console.log('rawDataSyncTime', rawDataSyncTime);
            
            if (typeof rawDataSyncTime !== 'number') {
                console.log('rawDataSyncTime is not a number');
                return false;
            }

            console.log('rawDataSyncTime is a number');
            return new Date(rawDataSyncTime).toDateString() === new Date().toDateString();
        });
    });
};

let saveCounties = (counties) => {
    console.log('saving counties');
    return dbPromise.then(db => {
        const tx = db.transaction('counties', 'readwrite');

        return Promise.all(counties.map(c => tx.store.add(c)), tx.done);
    });
};

let getCounties = (countyRawData) => {
    console.log('getting counties from raw data');

    let fips = [...new Set(countyRawData.map(cr => cr.fips))];

    let counties = [];

    for (let i = 0; i < fips.length; i++) {
        if (fips[i] === "0") {
            console.log(countyRawData.filter(cr => cr.fips === fips[i]));
        }

        let crd = countyRawData.filter(cr => cr.fips === fips[i])[0];

        counties.push({
            county: crd.county,
            state: crd.state,
            fips: crd.fips,
        });
    }

    return counties;
};

let getStates = (counties) => {
    console.log('getting states from counties');

    return [...new Set(counties.map(c => c.state))]
};

let saveStates = (states) => {
    console.log('saving states');
    return dbPromise.then(db => {
        const tx = db.transaction('states', 'readwrite');

        return Promise.all(states.map(s => tx.store.put(s,s)), tx.done);
    });
}

let isSetting = false;
let setPromise;

export default {
    getCountyData: (fips) => {
        console.log('localData getCountyData', fips);
        return dbPromise.then(db => db.getAllFromIndex('countyRawData', 'fips', fips));
    },
    isUpToDate,
    set: (data) => { 
        console.log('data', data);
        if (isSetting) {
            return setPromise;
        }

        let clearPromise = clear();

        let countySavePromise = Promise.all([dbPromise, clearPromise]).then(values => {
            console.log('db ready and data cleared');

            let db = values[0];
            console.log('db version', db.version);

            const tx = db.transaction('countyRawData', 'readwrite');

            console.log('saving data');

            let countyDataPromise = Promise.all(data.counties.map(c => tx.store.add(c), tx.done));

            let counties = getCounties(data.counties);
            let states = getStates(data.counties);

            let countyPromise = saveCounties(counties);
            let statePromise = saveStates(states);

            return Promise.all([countyDataPromise, countyPromise, statePromise]);
        });

        let stateSavePromise = Promise.all([dbPromise, clearPromise]).then(values => {
            let db = values[0];

            const tx = db.transaction('statesRawData','readwrite');

            return Promise.all(data.states.map(s => tx.store.add(s), tx.done));
        });

        let usSavePromise = Promise.all([dbPromise, clearPromise]).then(values => {
            let db = values[0];

            const tx = db.transaction('usRawData', 'readwrite');

            return Promise.all(data.us.map(u => tx.store.add(u), tx.done));
        });

        setPromise = Promise.all([dbPromise, countySavePromise, stateSavePromise, usSavePromise]).then(values => {
            console.log('db ready and raw data saved');
            console.log('saving meta rawDataSyncTime');
            let db = values[0];

            return Promise.all([
                db.put('meta', Date.now(), 'rawDataSyncTime'),
            ]);
        }).then(() => {
            isSetting = false;
        });

        isSetting = true;
        return setPromise;
    },
    getStates: () => {
        console.log('localData getStates');
        return dbPromise.then(db => {
            return db.getAll('states').then(states => {
                return states;
            })
        });
    },
    getCounties: (state) => {
        console.log('localData getCounties', state);
        return dbPromise.then(db => db.getAllFromIndex('counties', 'state', state))
    },
    getCountiesData: (state) => {
        console.log('localData getCountiesData', state);

        if (state === null) {
            return dbPromise.then(db => db.getAll('countyRawData'));
        }
        return dbPromise.then(db => db.getAllFromIndex('countyRawData', 'state', state));
    },
    getStatesData: () => {
        console.log('localData getStatesData');

        return dbPromise.then(db => db.getAll('statesRawData'));
    },
    getUSData: () => {
        console.log('localData getUSData');

        return dbPromise.then(db => db.getAll('usRawData'));
    }
};
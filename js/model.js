/*global $,ko, google */
var app = app || {};

/**
 * @description - object that represents hard-coded location data and associated methods
 * @constructor
 */
var Model = function () {
    'use strict';
    var self = this;
    self.scenarios = [
        {
            name: 'Scenario 1',
            numOfDays: 30,
            stations: [
                {
                    number: 1,
                    baseProduction: 5,
                    initWIP: 4,
                    sigma: 1
                },
                {
                    number: 2,
                    initWIP: 2,
                    baseProduction: 6,
                    sigma: .5
                },
                {
                    number: 3,
                    initWIP: 4,
                    baseProduction: 7,
                    sigma: .1
                }
            ]
        },
        {
            name: 'Scenario 2',
            numOfDays: 30
        },
        {
            name: 'Scenario 3',
            numOfDays: 30
        },
        {
            name: 'Scenario 4',
            numOfDays: 30
        },
        {
            name: "Scenario 5",
            numOfDays: 30
        },
        {
            name: "Scenario 6",
            numOfDays: 20,
            stations: [
                {
                    number: 1,
                    baseProduction: 10,
                    initWIP: 4,
                    sigma: 0
                },
                {
                    number: 2,
                    initWIP: 2,
                    baseProduction: 5,
                    sigma: 0
                },
                {
                    number: 3,
                    initWIP: 1,
                    baseProduction: 5,
                    sigma: 0
                }
            ]
        }
    ];


    /**
     * @description - returns model location
     * @returns array of locations
     */
    self.getAllScenarios = function () {
        return self.scenarios;
    };

}

/**
 * @description - object that represents location data to be used by the controller
 * @constructor
 */
var ScenarioItem = function (data) {
    'use strict';
    var self = this;

    self.init = function () {
        self.stations = ko.observableArray();
        self.name = data.name;
        self.numOfDays = data.numOfDays;
        self.numOfStations = 0;
        self.totalProduction = ko.observableArray(0);
        self.totalMissedOp = ko.observableArray(0);

        if (data.stations) {
            self.numOfStations = data.stations.length;
            data.stations.forEach(function (station) {
                self.stations().push(new StationItem(station));
                console.log("Loaded " + data.name + " - Station: " + station.number);
            });
        } else {
            //   console.log("No Stations defined in scenario.")
        }
    };

    self.init();



    self.addStation = function (station) {
        self.stations.push(station);
        self.numOfStations = self.numOfStations + 1;
    }

    self.verify = function () {
        console.clear()
        console.log("Name: " + self.name);
        console.log("Number of Days: " + self.numOfDays);
        console.log("Number of Stations: " + self.numOfStations);
        console.log("----Stations Data-------");
        self.stations().forEach(function (station) {
            console.log(station.title);
            console.log("   WIP: " + station.wipValues()[0]);
            console.log("   Base Production: " + station.baseProduction());
            console.log("   Sigma: " + station.sigma());
        });
    }

    self.reload = function () {
        self.init()
    }




};

//Defines our Station objects. 
var StationItem = function (data) {
    'use strict';
    var self = this;
    self.number = data.number;
    self.title = 'Station #' + self.number;
    self.baseProduction = ko.observable(1);
    self.sigma = ko.observable(0);
    self.productionValues = ko.observableArray();
    self.output = ko.observableArray();
    self.wipValues = ko.observableArray(0);
    self.missedOp = ko.observableArray(0);

    //set inventory data if defined in scenario
    if (data.initWIP) {
        self.wipValues().push(data.initWIP);
    }

    //set baseProduction data if defined in scenario
    if (data.baseProduction) {
        self.baseProduction(data.baseProduction);
    }

    //set sigma if defined in scenario
    if (data.sigma) {
        self.sigma(data.sigma);
    }

    //calculations station production for the day based on baseProduction and Sigma
    self.calcProduction = function (day) {
        var random = (Math.random() * self.sigma() * 2) - self.sigma();
        var todaysProduction = self.baseProduction() + self.baseProduction() * random;
        self.productionValues()[day] = Math.round(todaysProduction);
        // console.log("Sigma:" + self.sigma());
        // console.log("Random:" + random);
        // console.log("Base Production: " + self.baseProduction() + " --- Today's Production: " + self.productionValues()[day]);
    }


    //does the stations work for the day. sets output, next day's WIP, and missed Opportunities
    self.doWork = function (day, wipToAdd) {
        var todayWIP = self.wipValues()[day];
        self.calcProduction(day)
            //if we're station 1, our WIP is our production
        if (self.number == 1) {
            todayWIP = self.productionValues()[day];
        } else {
            todayWIP = todayWIP + wipToAdd;
        }

        var todayProduction = self.productionValues()[day];

        if (todayWIP >= todayProduction) {
            self.output()[day] = todayProduction;
            self.missedOp()[day] = 0;
            self.wipValues()[day + 1] = todayWIP - todayProduction;
        } else {
            self.output()[day] = todayWIP;
            self.missedOp()[day] = todayProduction - todayWIP;
            self.wipValues()[day + 1] = 0;
        }
        //   console.log("Output for " + self.title);
        //    console.log("     Output: " + self.output()[day]);
        //   console.log("     Tomorrow's WIP: " + self.wipValues()[day + 1]);
        //   console.log("     MissedOp: " + self.missedOp()[day]);

    };

}
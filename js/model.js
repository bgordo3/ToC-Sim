/*global $,ko, Scenarios */
var app = app || {};

/**
 * @description - object that represents hard-coded location data and associated methods
 * @constructor
 */
var Model = function () {
    'use strict';
    var self = this;
    self.scenarios = Scenarios; //These are defined in the scenarios.js file

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

    //initializes the scenario item.
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
            });
        }
    };

    self.init();

    //adds a station to our array of stations
    self.addStation = function (station) {
        self.stations.push(station);
        self.numOfStations = self.numOfStations + 1;
    }

    //re-initializes this scenario
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
        self.wipValues()[0] = data.initWIP;
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
    }


    //does the stations work for the day. sets output, next day's WIP, and missed Opportunities
    self.doWork = function (day, wipToAdd) {
        //first we need to calcuate or capacity for the day
        self.calcProduction(day);

        var todayProduction = self.productionValues()[day];
        //if we're station 1, our WIP is our production
        if (self.number == 1) {
            self.wipValues()[day] = self.productionValues()[day];
        } else {
            self.wipValues()[day] = self.wipValues()[day] + wipToAdd;
        }



        if (self.wipValues()[day] >= todayProduction) {
            self.output()[day] = todayProduction;
            self.missedOp()[day] = 0;
            self.wipValues()[day + 1] = self.wipValues()[day] - todayProduction;
        } else {
            self.output()[day] = self.wipValues()[day];
            self.missedOp()[day] = todayProduction - self.wipValues()[day];
            self.wipValues()[day + 1] = 0;
        }
    };

}
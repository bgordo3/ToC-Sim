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

    //adds a station to our array of stations
    self.addStation = function (station) {
        self.stations.push(station);
        self.numOfStations = self.numOfStations + 1;
    }

    //loads stations to the scenario
    self.addStations = function (stations) {
        stations.forEach(function (station) {
            self.numOfStations = stations.length;
            var tempStation = new StationItem(station);
            self.stations.push(tempStation);

            if (tempStation.baseCapacity + tempStation.capRange > self.maxOutput) {
                self.maxOutput = (tempStation.baseCapacity + tempStation.capRange);
            }
        });
    }

    //initializes the scenario item.
    self.init = function () {
        self.stations = [];
        self.name = data.name;
        self.numOfDays = data.numOfDays;
        self.numOfStations = 0;
        self.maxOutput = 0;
        self.maxStationWIP = 0;
        self.days = [];
        self.totalWIPS = [];
        self.totalCapacity = [];
        self.totalOutput = [];
        self.totalMissedOp = [];
        self.totalFinished = [];
        self.totalEff = []
        self.cummOutput = 0;
        self.cummCapacity = 0;
        self.graph = null;

        //load stations to this scenario if they are defined
        if (data.stations) {
            self.addStations(data.stations);
        }
    };

    self.init();



    //calculates the systems efficiency for the day based on the systems cumlative capacity and cumlative output
    self.calcEff = function (day) {
        var tempEffAvg = 0;
        self.cummCapacity += self.totalCapacity[day];
        self.cummOutput += self.totalOutput[day];
        self.totalEff[day] = self.cummOutput / self.cummCapacity;
    }

    //re-initializes this scenario
    self.reload = function () {
        self.init()
    }

    //update totals for the day based on each station
    self.updateTotals = function (day) {
        self.stations.forEach(function (station) {
            self.totalWIPS[day] += station.wipValues[day];
            self.totalCapacity[day] += station.capacityValues[day];
            self.totalOutput[day] += station.output[day];
            self.totalMissedOp[day] += station.missedOp[day];

            if (station.maxWIP > self.maxStationWIP) {
                self.maxStationWIP = station.maxWIP;
            }

        });

        //set total capacity for the day equal to last station's output for the day
        self.totalFinished[day] = self.stations[self.numOfStations - 1].output[day];
        //calculate overall effeciency
        self.calcEff(day);

    };

};
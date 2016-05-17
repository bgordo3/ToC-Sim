/*global $, Scenarios, ko */
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

};

/**
 * @description - object that represents location data to be used by the controller
 * @constructor
 */
var ScenarioItem = function (data) {
    'use strict';
    var self = this;
    //initializes the scenario item.
    self.init = function () {
        self.stations = [];
        self.days = [];
        self.totalCapacity = [];
        self.totalEff = [];
        self.totalFinished = [];
        self.totalMissedOp = [];
        self.totalOutput = [];
        self.totalProdValue = [];
        self.totalWIP = [];
        self.totalWipValue = [];
        self.resourceList = [];

        self.cummOutput = 0;
        self.cummCapacity = 0;
        self.cummProdValue = 0;
        self.graph = null;
        self.maxOutput = 0;
        self.maxStationWIP = 0;
        self.name = data.name;
        self.numOfDays = data.numOfDays;
        self.simType = data.simType;
        self.numOfStations = 0;

        if (data.stations) {
            data.stations.forEach(function (station) {
                self.numOfStations = data.stations.length;
                var tempStation = new StationItem(station);
                self.stations.push(tempStation);

                if (tempStation.baseCapacity + tempStation.capRange > self.maxOutput) {
                    self.maxOutput = (tempStation.baseCapacity + tempStation.capRange);
                }
            });
        }
    };
    
        self.init();

    //adds a station to our array of stations
    self.addStation = function (station) {
        self.stations.push(station);
        self.numOfStations = self.numOfStations + 1;
    };
    
    //re-initializes this scenario
    self.reload = function () {
        self.init();
    };

    self.updateTotals = function (day) {
        self.stations.forEach(function (station) {
            self.totalWIP[day] += station.wip[day];
            self.totalCapacity[day] += station.capacity[day];
            self.totalOutput[day] += station.output[day];
            self.totalMissedOp[day] += station.missedOp[day];
            self.totalProdValue[day] += station.prodValue[day];
            self.totalWipValue[day] += station.wipValue[day];

            if (station.maxWIP > self.maxStationWIP) {
                self.maxStationWIP = station.maxWIP;
            }
        });

        //set total capacity for the day equal to last station's output for the day
        self.totalFinished[day] = self.stations[self.numOfStations - 1].output[day];

        var tempEffAvg = 0;

        self.cummCapacity += self.totalCapacity[day];
        self.cummOutput += self.totalOutput[day];
        self.cummProdValue += self.totalProdValue[day];
        self.totalEff[day] = self.cummOutput / self.cummCapacity;

    };
    
};
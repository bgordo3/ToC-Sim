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
        self.graph = null;


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
    }

    //re-initializes this scenario
    self.reload = function () {
        self.init()
    }

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
    };

};

//Defines our Station objects. 
var StationItem = function (data) {
    'use strict';
    var self = this;
    self.number = data.number;
    self.title = 'Station #' + self.number;
    self.baseCapacity = 10;
    self.capRange = 5;
    self.varFactor = 1;
    self.capacityValues = [];
    self.output = [];
    self.wipValues = [];
    self.maxWIP = 0;
    self.missedOp = [];
    self.eff = [];
    self.totalEff = [];
    self.graph = null;
    //set inventory data if defined in scenario
    if (data.initWIP) {
        self.wipValues[0] = data.initWIP;
    }

    //set baseCapacity data if defined in scenario
    if (data.baseCapacity) {
        self.baseCapacity = data.baseCapacity;
    }

    //set capRange if defined in scenario
    if (data.capRange) {
        self.capRange = data.capRange;
    }

    if (data.varFactor) {
        self.varFactor = data.varFactor;
    }


    //calculations station capacity for the day based on baseCapacity and Sigma
    self.calcCapacity = function (day) {
        var min = self.baseCapacity - self.capRange;
        var max = self.baseCapacity + self.capRange;
        var max = self.baseCapacity + self.capRange;
        var randOutput = 0;
        if (min < 0) {
            min = 0;
        }

        randOutput = genNormal(min, max, self.varFactor);
        self.capacityValues[day] = randOutput;
    }



    //does the stations work for the day. sets output, next day's WIP, and missed Opportunities
    self.doWork = function (day, wipToAdd) {
        console.log(self.title);
        self.calcCapacity(day);
        var todayCapacity = self.capacityValues[day];
        console.log(" Wip before add: " + self.wipValues[day]);
        //first we need to calcuate or capacity for the day

        //if we're station 1, our WIP is our capacity
        if (self.number == 1) {
            self.wipValues[day] = todayCapacity;
        } else {
            if (day != 0) {
                self.wipValues[day] = self.wipValues[day] + wipToAdd;
            }
        }
        console.log(" Wip after add: " + self.wipValues[day]);
        console.log(" Cap: " + todayCapacity);

        //if the new wip for the day is greater than today's capacity,  our output is equal to our capacity,
        //and we have 0 missed ops.  The starting WIP for tomorrow will be what's left over.
        if (self.wipValues[day] >= todayCapacity) {
            self.output[day] = todayCapacity;
            self.missedOp[day] = 0;
            self.wipValues[day + 1] = self.wipValues[day] - todayCapacity;

            //otherwise, our output is limited by our wip for the day, and we have 0 our missed ops is equal to 
            // today's capacity minus our WIP.    
        } else {
            self.output[day] = self.wipValues[day];
            self.missedOp[day] = todayCapacity - self.wipValues[day];
            self.wipValues[day + 1] = 0;
        }
        if (self.wipValues[day] > self.maxWIP) {
            self.maxWIP = self.wipValues[day];
        }
        console.log(" Output: " + self.output[day]);
        console.log(" Missed: " + self.missedOp[day]);


        var tempEffAvg = 0;

        self.eff[day] = self.output[day] / self.capacityValues[day];
        self.eff.forEach(function (val) {
            tempEffAvg += val
        });
        tempEffAvg = tempEffAvg / self.eff.length;
        self.totalEff[day] = tempEffAvg;
    };

};

var genNormal = function (a, b, c) {
    var total = 0;
    var capacity = 0;
    for (var i = 1; i <= c; i++) {
        capacity = (Math.random() * (b - a + 1) + a);
        total += capacity;
    }
    return Math.floor(total / c);
};
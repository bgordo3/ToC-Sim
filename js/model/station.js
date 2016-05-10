/*global $, Scenarios */
var app = app || {};


//Defines our Station objects. 
var StationItem = function (data) {
    'use strict';
    var self = this;
    self.capacity = [];
    self.eff = [];
    self.wipValue = [];
    self.missedOp = [];
    self.output = [];
    self.prodValue = [];
    self.totalEff = [];
    self.wip = [];

    self.baseCapacity = 10;
    self.capRange = 5;
    self.graph = null;
    self.maxWIP = 0;
    self.number = data.number;
    self.title = 'Station #' + self.number;
    self.unitValue = data.number;
    self.varFactor = 1;

    //set inventory data if defined in scenario
    if (data.initWIP) {
        self.wip[0] = data.initWIP;
    }

    //set baseCapacity data if defined in scenario
    if (data.baseCapacity) {
        self.baseCapacity = data.baseCapacity;
    }

    //set capRange if defined in scenario
    if (data.capRange) {
        self.capRange = data.capRange;
    }

    if (data.unitValue) {
        self.unitValue = data.unitValue;
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
        self.capacity[day] = randOutput;
    }

    self.calcWip = function (day, wipToAdd) {
        //if we're station 1, our WIP is our capacity
        if (self.number == 1) {
            self.wip[day] = self.capacity[day];
        } else {
            if (day != 0) {
                self.wip[day] = self.wip[day] + wipToAdd;
            }
        }

        //update our our max wip to update the graph.
        //TODO: refactor out to the controller
        if (self.wip[day] > self.maxWIP) {
            self.maxWIP = self.wip[day];
        }
    }

    self.calcEff = function (day) {
        var tempEffAvg = 0;
        self.eff[day] = self.output[day] / self.capacity[day];
        self.eff.forEach(function (val) {
            tempEffAvg += val
        });
        tempEffAvg = tempEffAvg / self.eff.length;
        self.totalEff[day] = tempEffAvg;
    }

    self.calcValue = function (day, valueOfWip) {
        self.prodValue[day] = self.output[day] * self.unitValue;
        self.wipValue[day] = self.wip[day] * valueOfWip;
    }


    //does the stations work for the day. sets output, next day's WIP, and missed Opportunities
    self.doWork = function (day, wipToAdd, wipValue) {

        //first we need to calculate or capacity for the day
        self.calcCapacity(day);
        var todayCapacity = self.capacity[day];

        //next we need to calculate the wip
        self.calcWip(day, wipToAdd);
        var startingWip = self.wip[day];


        //now we need to "do work"
        //if the new wip for the day is greater than today's capacity,  our output is equal to our capacity,
        //and we have 0 missed ops.  The starting WIP for tomorrow will be what's left over.
        if (self.wip[day] >= todayCapacity) {
            self.output[day] = todayCapacity;
            self.missedOp[day] = 0;
            self.wip[day + 1] = startingWip - todayCapacity;

            //otherwise, our output is limited by our wip for the day, and we have our missed ops is equal to 
            //today's capacity minus our WIP.    
        } else {
            self.output[day] = self.wip[day];
            self.missedOp[day] = todayCapacity - startingWip;
            self.wip[day + 1] = 0;
        }

        //finally, update our station efficiency
        self.calcEff(day);

        //update our stations inventory and output values for the day
        self.calcValue(day, wipValue);

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
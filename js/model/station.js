/*global $, Scenarios */
var app = app || {};

//Defines our Station objects. 
var StationItem = function (data) {
    'use strict';
    var self = this;
    self.initialData = data;
    self.capacity = [];
    self.eff = [];
    self.wipValue = [];
    self.missedOp = [];
    self.output = [];
    self.prodValue = [];
    self.totalEff = [];
    self.wip = [];
    self.reqResources =[];

    self.baseCapacity = 10;
    self.capRange = 5;
    self.graph = null;
    self.maxWIP = 0;
    self.number = data.number;
    self.title = 'Station #' + self.number;
    self.unitValue = data.number;
    self.varFactor = 1;

    if (self.initialData) {
        self.init(self.initialData);
    }

};

StationItem.prototype.init = function (data) {
    //set inventory data if defined in scenario
    if (data.initWIP) {
        this.wip[0] = data.initWIP;
    }

    //set baseCapacity data if defined in scenario
    if (data.baseCapacity) {
        this.baseCapacity = data.baseCapacity;
    }

    //set capRange if defined in scenario
    if (data.capRange) {
        this.capRange = data.capRange;
    }

    if (data.unitValue) {
        this.unitValue = data.unitValue;
    }

    if (data.varFactor) {
        this.varFactor = data.varFactor;
    }
};

//calculations station capacity for the day based on baseCapacity and Sigma
StationItem.prototype.calcCapacity = function (day) {
    var min = this.baseCapacity - this.capRange;
    var max = this.baseCapacity + this.capRange;
    var randOutput = 0;
    if (min < 0) {
        min = 0;
    }

    randOutput = this.genNormal(min, max, this.varFactor);
    this.capacity[day] = randOutput;
};

StationItem.prototype.calcWip = function (day, wipToAdd) {
    //if we're station 1, our WIP is our capacity
    if (this.number == 1) {
        this.wip[day] = this.capacity[day];
    } else {
        if (day !== 0) {
            this.wip[day] = this.wip[day] + wipToAdd;
        }
    }

    //update our our max wip to update the graph.
    //TODO: refactor out to the controller
    if (this.wip[day] > this.maxWIP) {
        this.maxWIP = this.wip[day];
    }
};

StationItem.prototype.calcEff = function (day) {
    var tempEffAvg = 0;
    this.eff[day] = this.output[day] / this.capacity[day];
    this.eff.forEach(function (val) {
        tempEffAvg += val;
    });
    tempEffAvg = tempEffAvg / this.eff.length;
    this.totalEff[day] = tempEffAvg;
};

StationItem.prototype.calcValue = function (day, valueOfWip) {
    this.prodValue[day] = parseInt(this.output[day] * this.unitValue);
    this.wipValue[day] = this.wip[day] * valueOfWip;
};

//does the stations work for the day. sets output, next day's WIP, and missed Opportunities
StationItem.prototype.doWork = function (day, wipToAdd, wipValue) {

    //first we need to calculate or capacity for the day
    this.calcCapacity(day);
    var todayCapacity = this.capacity[day];

    //next we need to calculate the wip
    this.calcWip(day, wipToAdd);
    var startingWip = this.wip[day];


    //now we need to "do work"
    //if the new wip for the day is greater than today's capacity,  our output is equal to our capacity,
    //and we have 0 missed ops.  The starting WIP for tomorrow will be what's left over.
    if (this.wip[day] >= todayCapacity) {
        this.output[day] = todayCapacity;
        this.missedOp[day] = 0;
        this.wip[day + 1] = startingWip - todayCapacity;

        //otherwise, our output is limited by our wip for the day, and we have our missed ops is equal to 
        //today's capacity minus our WIP.    
    } else {
        this.output[day] = this.wip[day];
        this.missedOp[day] = todayCapacity - startingWip;
        this.wip[day + 1] = 0;
    }

    //finally, update our station efficiency
    this.calcEff(day);

    //update our stations inventory and output values for the day
    this.calcValue(day, wipValue);

};

StationItem.prototype.genNormal = function (a, b, c) {
    var total = 0;
    var capacity = 0;
    for (var i = 1; i <= c; i++) {
        capacity = (Math.random() * (b - a + 1) + a);
        total += capacity;
    }
    return Math.floor(total / c);
};
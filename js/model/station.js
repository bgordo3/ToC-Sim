/*global $, Scenarios, RequestQueue */
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
    self.outputInventory = 0;
    self.reqResources = [];
    self.reqQueue = new RequestQueue();


    self.baseCapacity = 10;
    self.capRange = 5;
    self.graph = null;
    self.maxWIP = 0;
    self.idNumber = data.idNumber;
    self.title = 'Station #' + self.idNumber;
    self.unitValue = data.idNumber;
    self.varFactor = 1;
    self.unitName = '';

    if (data) {
        //set inventory data if defined in scenario
        if (data.initWIP) {
            self.wip[0] = parseInt(data.initWIP);
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

        if (data.unitName) {
            self.unitName = data.unitName;
        } else {
            self.unitName = 'widget' + data.idNumber;

        }
    }

};
StationItem.prototype = Object.create(StationItem.prototype);

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
    if (this.idNumber === 1) {
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
    this.prodValue[day] = this.output[day] * this.unitValue;
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

StationItem.prototype.doNetworkWork = function (day,excess) {
    if(excess===null){
        excess=false;
    }

    //first we need to calculate or capacity for the day
    this.calcCapacity(day);
    var todayCapacity = this.capacity[day];

    //now we need to see what the maxium number of things we can produce based on our requirements if it hasn't already been done
    var startingWip = this.calcWipBasedOnInventory(day);
    console.log(this.title + " startingWip: " + startingWip);
    this.wip[day] = startingWip;
    

    //now we need to "do work"
    //if the new wip for the day is greater than today's capacity,  our output is equal to our capacity,
    //and we have 0 missed ops.  The starting WIP for tomorrow will be set to 0 since its baseed on resourceItems
    if (startingWip >= todayCapacity) {
        this.output[day] = todayCapacity;
        this.missedOp[day] = 0;
        // this.wip[day+1] = startingWip - todayCapacity;

        //otherwise, our output is limited by our wip for the day, and we have our missed ops is equal to 
        //today's capacity minus our WIP.    
    } else {
        this.output[day] = startingWip;
        this.missedOp[day] = todayCapacity - startingWip;
        //    this.wip[day + 1] = 0;
    }

    //now we need to make sure that we actually consume our resources based on the max number we can produce
    var tempOutput = this.output[day];
    this.reqResources.forEach(function (item) {
        item.onHand -= (tempOutput * item.quantityRequired);
       // item.resourceItem.useResource(tempOutput, item.quantityRequired);
    });

    //finally, update our station efficiency
    this.calcEff(day);

    //update our stations inventory and output values for the day
    this.outputInventory += this.output[day];

    //calculate the value of the resources onHand
    var resourceValue = 0;
    this.reqResources.forEach(function (item) {
        var resource = item.resourceItem;
        resourceValue += resource.getValue();
    });
    this.wipValue[day] = resourceValue;
    this.prodValue[day] = this.output[day] * this.unitValue;


};

StationItem.prototype.genNormal = function (min, max, varFact) {
    var total = 0;
    var capacity = 0;
    for (var i = 1; i <= varFact; i++) {
        capacity = (Math.random() * (max - min + 1) + min);
        total += capacity;
    }
    return Math.floor(total / varFact);
};

StationItem.prototype.addResource = function (resource, reqAmount, desAmount, onHandAmount) {
    var newResource = {
        resourceItem: resource,
        quantityRequired: reqAmount,
        desiredLevel: desAmount,
        onHand: onHandAmount
    };
    this.reqResources.push(newResource);
};

StationItem.prototype.deleteResource = function (_resource) {
    var i = this.reqResources - 1;
    for (i; i >= 0; i--) {
        var resource = this.reqResources[i].resourceItem;
        if (resource === _resource) {
            this.providerList.splice(i, 1);
        }
    }
};

StationItem.prototype.needsStation = function (station) {
    var isRequired = false;
    this.reqResources.forEach(function (item) {
        var resource = item.resourceItem;
        if (resource.containsStation(station)) {
            isRequired = true;
        }
    });
    return isRequired;
};

StationItem.prototype.addInventory = function (station, amount) {
    var continueCheck = true;
    this.reqResources.forEach(function (item) {
        var resource = item.resourceItem;
        if (resource.containsStation(station) && continueCheck) {
            item.onHand += amount;
            continueCheck = false;
        }
    });
};

StationItem.prototype.calcWipBasedOnInventory = function (day) {
    var maxNumberProd = -1;
    if (this.reqResources.length > 0) {
        this.reqResources.forEach(function (item) {
            var maxSubComponent = item.resourceItem.canMake(item.onHand, item.quantityRequired);
            if (maxNumberProd === -1 || maxSubComponent < maxNumberProd) {
                maxNumberProd = maxSubComponent;
            }
        });
    } else {
        maxNumberProd = this.capacity[day];
    }
    return maxNumberProd;
    };

StationItem.prototype.setResourceRequiredAmount = function (resource, amount) {
    this.reqResources.forEach(function (item) {
        if (item.resourceItem === resource) {
            item.quantityRequired = amount;
        }

    });
};

StationItem.prototype.getResources = function () {
    return this.reqResources;
};

StationItem.prototype.setResourceDesiredInventory = function (resource, amount) {
    this.reqResources.forEach(function (item) {
        if (item.resourceItem === resource) {
            item.desiredLevel = amount;
        }


    });
};

StationItem.prototype.setResourceOnHand = function (resource, amount) {
    this.reqResources.forEach(function (item) {
        if (item.resourceItem === resource) {
            item.onHand = amount; 
        }
    });
};
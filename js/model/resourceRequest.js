/*global */
var app = app || {};

/*
 * @description - defines a resource request from station to station.
 */
var ResourceRequest = function (station) {
    'use strict';
    var self = this;
    self.requestingStation = station;
    self.priority = "low";
    self.numRequested = 0;
};

ResourceRequest.prototype = Object.create(ResourceRequest.prototype);

ResourceRequest.prototype.setPriority = function (priority) {
    if (priority === "low" | priority === "med" | priority === "high") {
        this.priority = priority;
    } else {
        this.priority = "low";
    }
};

ResourceRequest.prototype.getPriority = function () {
    return this.priority;
    };

ResourceRequest.prototype.setNumRequested = function (amount) {
    this.numRequested = parseInt(amount);
};

ResourceRequest.prototype.getNumRequested = function () {
    return this.numRequested;
};

ResourceRequest.prototype.setRequestingStation = function (station) {
    this.requestingStation = station;
};

ResourceRequest.prototype.getRequestingStation = function () {
    return this.requestingStation;
};

ResourceRequest.prototype.addRequests = function (amount) {
   this.numRequested += parseInt(amount);
};

ResourceRequest.prototype.removeRequests = function (amount) {
    if(amount > this.numRequested){
        this.numRequested = 0;
    }else{
           this.numRequested -= parseInt(amount);
    }
};



/*global ResourceRequest */
var app = app || {};

/*
 * @description - stores resource requests.  If a resource request from a station
 * already exits, it is simply added to the current request.
 */
var RequestQueue = function () {
    'use strict';
    var self = this;
    self.highPriority = [];
    self.medPriority = [];
    self.lowPriority = [];

    /**
     * @description - checks to see if request is currently in a particular queue
     * @param {ResourceRequest} resourceRequest
     * @returns {Boolean} true if in the queue, false otherwise
     */
    self.existsInQueue = function (resourceRequest) {
        var inQueue = false;
        var tempRequest = new ResourceRequest();
        var checkRequest = new ResourceRequest();
        tempRequest = resourceRequest;
        var queueToCheck;
        switch (tempRequest.getPriority()) {
            case 'high':
                queueToCheck = self.highPriority;
                break;
            case 'med':
                queueToCheck = self.medPriority;
                break;
            case 'low':
            default:
                queueToCheck = self.lowPriority;
                break;
        }

        queueToCheck.forEach(function (request) {
            checkRequest = request;
            if (tempRequest.getRequestingStation() === checkRequest.getRequestingStation()) {
                inQueue = true;
            }
        });
        return inQueue;
    };

    /**
     * @description Returns the appropriate queue based on priority
     * @param {string} priority
     * @returns {Array}
     */
    self.getQueue = function (priority) {
        switch (priority) {
            case 'high':
                return this.highPriority;
            case 'med':
                return this.medPriority;
            case 'low':
                return this.lowPriority;
            default:
                return null;
        }

    };
};

RequestQueue.prototype = Object.create(RequestQueue.prototype);

/**
 * @description adds a resourceRequest to the requested queue.
 * @param {ResourceRequest} resourceRequest -  request to add to the queue
 */
RequestQueue.prototype.addToQueue = function (resourceRequest) {
    var priority = resourceRequest.getPriority();
    if (this.existsInQueue(resourceRequest)) {
        var queue = this.getQueue(priority);
        queue.forEach(function (_requestInQueue) {
            requestInQueue = _requestInQueue;
            if (requestInQueue.getRequestingStation() === resourceRequest.getRequestingStation()) {
                requestInQueue.addRequests(resourceRequest.getNumRequested());
            }
        });
    }else{
      this.getQueue(priority).push(resourceRequest);
    }
};

/**
 * @description subtracts the request for resources from the queue.
 * @param {ResourceRequest} resourceRequest resource to be removed
 */
RequestQueue.prototype.subtractFromQueue = function (resourceRequest) {
    var requestInQueue = new ResourceRequest();
    var tempRequest = new ResourceRequest();
    tempRequest = resourceRequest;
    var queue = this.getQueue(tempRequest.getPriority());
    queue.forEach(function (_requestInQueue) {
        requestInQueue = _requestInQueue;
        if (requestInQueue.getRequestingStation() === tempRequest.getRequestingStation()) {
            if (requestInQueue.getNumRequested() > tempRequest.getNumRequested()) {
                requestInQueue.removeRequests(tempRequest.getNumRequested());
            } else if (requestInQueue.getNumberRequested() === tempRequest.getNumRequested()) {
                this.subtractFromQueue(resourceRequest);
            }
        }
    });
};

/**
 * @description removes a resource request from the queue.
 * @param {ResourceRequest} resourceRequest request to remove
 */
RequestQueue.prototype.removeFromQueue = function (resourceRequest) {
    var resourceToRemove = new ResourceRequest();
    var tempResource = new ResourceRequest();
    resourceToRemove = resourceRequest;
    var queue = this.getQueue(resourceToRemove.getPriority());
    var i = 0;
    for (i; i < queue.length; i++) {
        tempResource = queue[i];
        if (tempResource === resourceToRemove) {
            queue.splice(i, 1);
        }
    }
};

RequestQueue.prototype.getTotalRequests = function () {
    var counter = 0;
    this.highPriority.forEach(function (request) {
        counter += request.getNumRequested();
    });
    this.medPriority.forEach(function (request) {
        counter += request.getNumRequested();
    });
    this.lowPriority.forEach(function (request) {
        counter += request.getNumRequested();
    });
    return counter;
}

RequestQueue.prototype.getNextRequest = function () {
    var reqStation;
    var request;
    if (this.highPriority.length > 0) {
        request = this.highPriority[0];
    } else if (this.medPriority.length > 0) {
        request = this.medPriority[0];
    } else if (this.lowPriority.length > 0) {
        request = this.lowPriority[0];
    }

    if (request) {
        reqStation = request.getRequestingStation();
        var numReq = request.getNumRequested();
        if (numReq > 1) {
            request.setNumRequested(numReq - 1);
        } else {
            this.removeFromQueue(request);
        }
    }
    if(reqStation){
        return reqStation;
    }
}
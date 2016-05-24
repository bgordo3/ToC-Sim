/*global $, Scenarios */
var app = app || {};


//Defines our Station objects. 
var ResourceItem = function () {
    var self = this;
    self.idNumber = 0;
    self.name = '';
    self.providerList = [];
    self.required = 1;
    self.priority = 0;
    self.numberOnHand = 0;
    self.value = 0;
};

ResourceItem.prototype = Object.create(ResourceItem.prototype);

ResourceItem.prototype.addProvider = function (station) {
    var stationExistsInList = false;
    this.providerList.forEach(function (provider) {
        if (provider === station) {
            stationExistsInList = true;
        }
    });
    if (!stationExistsInList) {
        this.providerList.push(station);
    }
}

ResourceItem.prototype.removeProvider = function (station) {
    var i = this.providerList.length - 1;
    for (i; i >= 0; i--) {
        var provider = this.providerList[i];
        if (provider === station) {
            this.providerList.splice(i, 1);
        }
    }
}

ResourceItem.prototype.containsStation = function (station) {
    var matchFound = false;
    this.providerList.forEach(function (provider) {
        if (provider == station) {
            matchFound = true;
        }
    });
    return matchFound;
}

ResourceItem.prototype.hasProvider = function () {
    if (this.providerList) {
        if (this.providerList.length > 0) {
            return true;
        } else {
            return false;
        }
    }
    return false;
}

ResourceItem.prototype.useResource = function (numToMake) {
    if(numToMake === null){
        numToMake = 1;
    }
    var resourcesToUse = self.required * numToMake;
    if( self.numberOnHand >= resourcesToUse){
   self.numberOnHand  -= resourcesToUse;
        return numToMake;
    }else{
        return 0;
    }
};

ResourceItem.prototype.useMaxResource = function () {
    var producd = self.canMake();
   self.numberOnHand  = self.numberOnHand % self.required
   return produced;
};

ResourceItem.prototype.canMake = function () {
    var producable = Math.floor(self.numberOnHand /self.required);
    if(producable >=1 ){
        return producable;
    }else{
        return 0;
    }
    
    
};

ResourceItem.prototype.getValue = function () {
    var value = self.numberOnHand * self.revalue;
    return value;
    
};
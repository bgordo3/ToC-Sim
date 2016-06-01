/*global $, Model, ko, ScenarioItem, ChartHelper, ResourceItem */
// global application variable
var app = app || {};

var ViewModel = function () {
    'use strict';
    var self = this,
        $main = $('#sim-container'),
        $nav = $('#menu-container'),
        $menuButton = $('#menu-button-container'),
        $customScenario = $('#custom'),
        $customSettings = $('#custom-settings');


    self.$scenarioContainer = null;
    self.queryContainer = [];
    self.model = new Model();
    self.currentScenario = null;
    self.scenarios = ko.observableArray();
    self.scenarioTitle = ko.observable('Please choose a scenario');
    self.numOfStations = ko.observable(5);
    self.numOfDays = ko.observable(30);
    self.currentDay = ko.observable(0);
    self.finishProd = false;
    self.resourceIdCounter = 0;
    $customSettings.toggle(false);


    //populate locations observable container with data from model. We first create a blank scenario object,
    //then initialize it with the data our scenario definitions.
    this.model.getAllScenarios().forEach(function (scen) {
        var tempScenario = new ScenarioItem(scen);
        self.scenarios.push(tempScenario);
    });

    /**
     * @description - toggles location navigation drawer (only shown when responsive
     *                css is loaded)
     */
    $menuButton.click(function (e) {
        $nav.toggleClass('open');
        e.stopPropagation();
    });

    /**
     * @description - closes navigation drawer when the main screen is clicked.
     *                (only shown when responsive css is loaded)
     */
    $main.click(function () {
        $nav.removeClass('open');
    });

    //click action for when user clicks on custom scenario from menu.
    $customScenario.click(function () {
        $customSettings.toggle("slow");
        self.scenarioTitle("Custom Scenario");
    });

    /**
     * @description - updates the display based on the selected optional line.  
     */
    window.changeGraph = function () {

        //remove and re-add canvases to delete old chart.
        $('#scenario-canvas').remove();
        $('#scenario-graph').append('<canvas id="scenario-canvas" class="canvas"></canvas></div>');
        self.currentScenario.stations.forEach(function (station) {
            $('#station' + station.idNumber + '-canvas').remove();
            $('#station' + station.idNumber + '-graph').append(
                '<canvas id="station' + station.idNumber + '-canvas" class="canvas"></canvas></div>');
        });
        var optDataToChart = null;

        switch ($('#graph-option').val()) {
            case 'Production Value':
                self.currentScenario.graph = self.createChart('#scenario-canvas',
                    self.currentScenario.totalOutput,
                    self.currentScenario.totalMissedOp,
                    self.currentScenario.totalWIP,
                    self.currentScenario.totalProdValue);
                self.currentScenario.stations.forEach(function (station) {
                    station.graph = self.createChart('#station' + station.idNumber + '-canvas',
                        station.output,
                        station.missedOp,
                        station.wip,
                        station.prodValue);
                });
                break;
            case 'WIP Inventory Value':
                self.currentScenario.graph = self.createChart('#scenario-canvas',
                    self.currentScenario.totalOutput,
                    self.currentScenario.totalMissedOp,
                    self.currentScenario.totalWIP,
                    self.currentScenario.totalWipValue);
                self.currentScenario.stations.forEach(function (station) {
                    station.graph = self.createChart('#station' + station.idNumber + '-canvas',
                        station.output,
                        station.missedOp,
                        station.wip,
                        station.wipValue);
                });
                break;
            case 'Efficiency':
                self.currentScenario.graph = self.createChart('#scenario-canvas',
                    self.currentScenario.totalOutput,
                    self.currentScenario.totalMissedOp,
                    self.currentScenario.totalWIP,
                    self.currentScenario.totalEff);
                self.currentScenario.stations.forEach(function (station) {
                    station.graph = self.createChart('#station' + station.idNumber + '-canvas',
                        station.output,
                        station.missedOp,
                        station.wip,
                        station.totalEff);
                });
                break;
            default:
                self.currentScenario.graph = self.createChart('#scenario-canvas ',
                    self.currentScenario.totalOutput,
                    self.currentScenario.totalMissedOp,
                    self.currentScenario.totalWIP,
                    null);
                self.currentScenario.stations.forEach(function (station) {
                    station.graph = self.createChart('#station' + station.idNumber + '-canvas',
                        station.output,
                        station.missedOp,
                        station.wip,
                        null);
                });
                break;
        }
    };

    /**
     * @description - loads custom scenario when 'Load Scenario' is clicked
     */
    window.loadCustom = function () {
        $nav.removeClass('open');
        self.numOfDays($('#days').val());
        self.numOfStations($('#stations').val());
        self.currentDay(0);
        var scenarioData = {
            name: "Custom Scenario",
            numOfStations: self.numOfStations(),
            numOfDays: self.numOfDays(),
        };
        var scenario = new ScenarioItem(scenarioData);

        //create stations with default data
        for (var i = 1; i <= self.numOfStations(); i++) {
            var data = {
                idNumber: i,
                initWIP: 10,
                baseCapacity: 10,
                capRange: 0
            };
            var tempStation = new StationItem(data);
            scenario.addStation(tempStation);
        }
        scenario.simType = $('#simType').val();
        self.loadScenario(scenario);
    };

    window.reload = function () {
        self.currentDay(0);
        self.currentScenario.reload();
        self.clearUI();
        self.buildUI();

    };

    window.runProduction = function () {
        var runCalc = false;
        var day = self.currentDay();
        if (self.currentScenario) {
            if (!self.currentScenario.totalCapacity[self.currentDay + 1]) {
                runCalc = true;
            }
        }
        if (runCalc) {
            //initialize totals to zero
            self.currentScenario.totalWIP[day] = 0;
            self.currentScenario.totalCapacity[day] = 0;
            self.currentScenario.totalOutput[day] = 0;
            self.currentScenario.totalMissedOp[day] = 0;
            self.currentScenario.totalProdValue[day] = 0;
            self.currentScenario.totalWipValue[day] = 0;

            if (self.currentScenario.simType === 'Normal') {
                self.runNormalProduction();
            } else if (self.currentScenario.simType === "Network") {
                self.runNetworkProduction();
            }

            self.currentScenario.updateTotals(self.currentDay());
            //update the GUI with new data
            self.currentScenario.days.push(self.currentDay());
            self.updateData();
            self.currentDay(self.currentDay() + 1);

        }
    };

    window.finishProduction = function () {
        while (self.currentDay() <= self.numOfDays()) {
            if (self.currentDay() == self.numOfDays) {
                finishProduction = false;
            }
            runProduction();
        }
    };

    window.printTotalResults = function () {
        var totalProd = 0;
        var totalMissed = 0;
        var totalOutput = 0;
        var totalHTMLText = '';
        self.currentScenario.totalCapacity().forEach(function (prod) {
            totalProd += prod;
        });
        self.currentScenario.totalMissedOp().forEach(function (miss) {
            totalMissed += miss;
        });
    };

    window.menuClick = function () {
        $nav.removeClass('open');
        self.loadScenario(this);
    };

    window.toggleStations = function () {
        if ($('#showStationsCheckbox').is(':checked')) {
            //self.createStations();
            $('.station').show();
            // self.updateData();
        } else {
            // self.clearStations();
            $('.station').hide();
        }
    };

    window.updateNetwork = function () {

    };

};

// $(document).ready(function () {
//     self.loadScenario(self.scenarios()[0]);
//     var i = 0;
//     for (i; i < 5; i++) {
//         runProduction();
//     }
// });


ViewModel.prototype = Object.create(ViewModel.prototype);

ViewModel.prototype.createChart = function (canvas, output, missed, wip, optData) {
    var graph = null;
    var data = null;

    switch ($('#graph-option').val()) {
        case 'Production Value':
            data = {
                axisLabel: 'Production Value',
                axisMax: 10,
                axisStep: 1,
                dataLabel: 'Production Value',
                dataType: 'line',
                optData: optData
            };
            break;
        case 'WIP Inventory Value':
            data = {
                axisLabel: 'WIP Value',
                axisMax: 10,
                axisStep: 1,
                dataLabel: 'WIP Value',
                dataType: 'line',
                optData: optData
            };
            break;
        case 'Efficiency':
            data = {
                axisLabel: 'Eff',
                axisMax: 1.2,
                axisStep: 0.2,
                dataLabel: 'Eff',
                dataType: 'line',
                optData: optData
            };
            break;
        case 'none':
            data = null;
            break;
    }

    graph = chartHelper(canvas, output, missed, wip, data);
    return graph;

};

ViewModel.prototype.buildUI = function () {
    if (!self.$scenarioContainer) {
        self.$scenarioContainer = $('#scenario-container');
    }
    $('.control').removeClass("hidden");
    var headerHTML = '<div id="scenario-settings" class="settings">Scenario Data' +
        '<p>Number of Days: ' + this.currentScenario.numOfDays + '</p>' +
        '<p>Number of Stations: ' + this.currentScenario.numOfStations + '</p>' +
        'Show Stations?<input type= "checkbox" id="showStationsCheckbox" checked="checked" onchange="toggleStations()"><br><br>' +
        // '<div id="graph-settings" class="graph-settings">' +
        'Graph Optional Line: ' +
        '<select id="graph-option" class="select-box" onchange="changeGraph()">' +
        '<option value="None">None</option>' +
        '<option value="Efficiency">Efficiency</option>' +
        '<option value="WIP Inventory Value">WIP Inventory Value</option>' +
        '<option value="Production Value">Production Value</option>' +
        '</select>' +
        '<div id=distribution>' +
        'Output Distribution: ' +
        '<select id="distribution-option" class="select-box"">' +
        '<option value="Fair Share">Fair Share</option>' +
        '<option value="Optimized Pull">Optimized Pull</option>' +
        '<option value="Priority Pull">Priority Pull</option>' +
        '</select></div>' +
        '</div></input></div>';

    self.$scenarioContainer.append(headerHTML);
    //self.$scenarioContainer.append();
    self.$scenarioContainer.append('<div id="scenario-graph" class="scenario-graph"></div>');
    $('#scenario-graph').append('<canvas id="scenario-canvas" class="canvas"></canvas></div>');

    //create our overall scenario chart
    this.currentScenario.graph = this.createChart('#scenario-canvas', this.currentScenario.totalOutput, this.currentScenario.totalMissedOp, this.currentScenario.totalWIP, null);
    if ($('#showStationsCheckbox').is(':checked')) {
        this.createStations();
    }
};

ViewModel.prototype.runNormalProduction = function () {

    for (var i = 0; i < this.currentScenario.stations.length; i++) {
        var j = i + 1;
        var currentStation = this.currentScenario.stations[i];
        var wipToAdd = 0;
        var wipValue = 0;

        var capID = "station" + j + "cap";
        var rangeID = "station" + j + "range";
        var unitValID = "station" + j + "unitVal";
        var varID = "station" + j + "var";
        var wipID = "station" + j + "wip";

        currentStation.baseCapacity = parseInt($('#' + capID).val());
        currentStation.capRange = parseInt($('#' + rangeID).val());
        currentStation.unitValue = parseInt($('#' + unitValID).val());
        currentStation.varFactor = parseInt($('#' + varID).val());
        // currentStation.wip[this.currentDay()] = parseInt($('#' + wipID).val());

        //if we are the first station, don't worry about previous station
        if (i === 0) {
            wipToAdd = 0;
            wipValue = 0;
        } else {
            //if its the first day, only work on what's in the initial WIP
            if (this.currentDay() === 0) {
                wipToAdd = 0;
            } else { //its not the first day, so we need to add previous stations work
                wipToAdd = this.currentScenario.stations[i - 1].output[this.currentDay() - 1];
            }
            wipValue = this.currentScenario.stations[i - 1].unitValue;
        }
        currentStation.doWork(this.currentDay(), wipToAdd, wipValue);
    }
};

ViewModel.prototype.runNetworkProduction = function () {
    var i = 0;

    for (i; i < this.currentScenario.stations.length; i++) {
        var j = i + 1;
        var currentStation = this.currentScenario.stations[i];
        var wipValue = 0;
        var capID = "station" + j + "cap";
        var rangeID = "station" + j + "range";
        var unitValID = "station" + j + "unitVal";
        var varID = "station" + j + "var";
        var wipID = "station" + j + "wip";

        currentStation.baseCapacity = parseInt($('#' + capID).val());
        currentStation.capRange = parseInt($('#' + rangeID).val());
        currentStation.unitValue = parseInt($('#' + unitValID).val());
        currentStation.varFactor = parseInt($('#' + varID).val());
        //  currentStation.wip[this.currentDay()] = parseInt($('#' + wipID).val());

        //now work on what we can with what we have
        currentStation.doNetworkWork(this.currentDay());
    }
    this.distributeOutput();
};

ViewModel.prototype.distributeOutput = function () {

    var i = 0;
    for (i; i < this.currentScenario.stations.length; i++) {
        var currentStation = this.currentScenario.stations[i];
        //build a list of stations that require this output
        var stationsThatNeedMe = [];
        app.viewModel.currentScenario.stations.forEach(function (otherStation) {
            if (currentStation != otherStation) {
                if (otherStation.needsStation(currentStation)) {
                    stationsThatNeedMe.push(otherStation)
                }
            }
        });

        switch ($('#distribution-option').val()) {
            case 'Optimized Pull':
                break;
            case 'Fair Share':
                if (stationsThatNeedMe.length > 0) {
                    while (currentStation.outputInventory > 0) {
                        stationsThatNeedMe.forEach(function (recStation) {
                            if (currentStation.outputInventory > 0) {
                                recStation.addInventory(currentStation, 1);
                                currentStation.outputInventory = currentStation.outputInventory - 1;
                            }
                        });
                    }
                }
                break;
            case 'Priority Pull':
                //TODO add pull mechanism
                break;
            default:
                break;
        }
    }
}


ViewModel.prototype.clearUI = function () {
    this.clearStations();
    $('#scenario-settings').remove();
    $('#graph-settings').remove();
    $('#scenario-graph').remove();
    $('#scenario-canvas').remove();
    $('.control').addClass("hidden");
};

ViewModel.prototype.createStations = function () {
    var currentStation = null;
    for (var i = 0; i < this.numOfStations(); i++) {
        var j = i + 1;
        currentStation = this.currentScenario.stations[i];
        var stationContainerID = 'station' + j + '-container';
        var capID = "station" + j + "cap";
        var rangeID = "station" + j + "range";
        var unitValID = "station" + j + "unitVal";
        var varID = "station" + j + "var";
        var wipID = "station" + j + "wip";
        var outputID = "station" + j + "outputName";

        $('#station-container').append('<div id="' + stationContainerID + '" class="station"></div>');

        var settingIdTags = {
            containerIdTag: stationContainerID,
            capIdTag: capID,
            rangeIdTag: rangeID,
            unitValIdTag: unitValID,
            varienceIdTag: varID,
            wipIdTag: wipID,
            outputNameIdTag: outputID,
        };

        this.createStationSettings(currentStation, settingIdTags);
        var stationNetworkHTML = '<div id="station' + currentStation.idNumber + '-network" class="network-settings">' +
            '</div>';
        this.queryContainer[currentStation.idNumber - 1].stationContainer.append(stationNetworkHTML);
        this.createStationNetwork(currentStation);
        this.createStationGraph(currentStation);
    }

};

ViewModel.prototype.createStationSettings = function (station, tagData) {
    var stationSettingsHTML = '<div id="station' + station.idNumber + '-settings" class="settings">Station ' + station.idNumber + ' Data' +
        '<table><tr><td>Base Capacity:</td>' +
        '<td><input id="' + tagData.capIdTag + '" class="input-box" type="text" name="' + tagData.capIdTag + '"></td>' +
        '</tr><tr><td>Capacity Range:</td>' +
        '<td><input id="' + tagData.rangeIdTag + '" class="input-box" type="text" name="' + tagData.rangeIdTag + '"></td>' +
        '</tr><tr><td>Variance Factor:</td>' +
        '<td><input id="' + tagData.varienceIdTag + '" class="input-box" type="text" name="' + tagData.varienceIdTag + '"></td>' +
        '</tr><tr><td>Unit Value: </td>' +
        '<td><input id="' + tagData.unitValIdTag + '" class="input-box" type="text" name="' + tagData.unitValIdTag + '"></td>' +
        '</tr><tr><td>Current WIP: </td>' +
        '<td><input id="' + tagData.wipIdTag + '" class="input-box" type="text" name="' + tagData.wipIdTag + '"></td>' +
        '</tr><tr><td>Produces: </td><td><input id="' + tagData.outputNameIdTag + '" class="input-box" type="text" name="' + tagData.outputNameIdTag + '"></td>' +
        '</tr></table></div>';
    $('#' + tagData.containerIdTag).append(stationSettingsHTML);

    var myQueryContainer = {
        station: station,
        stationContainer: $('#' + tagData.containerIdTag),
        cap: $('#' + tagData.capIdTag),
        range: $('#' + tagData.rangeIdTag),
        unitVal: $('#' + tagData.unitValIdTag),
        varience: $('#' + tagData.varienceIdTag),
        wip: $('#' + tagData.wipIdTag),
        outputName: $('#' + tagData.outputNameIdTag)
    };
    this.queryContainer.push(myQueryContainer);

    myQueryContainer.cap.val(station.baseCapacity);
    myQueryContainer.range.val(station.capRange);
    myQueryContainer.unitVal.val(station.unitValue);
    myQueryContainer.varience.val(station.varFactor);
    myQueryContainer.wip.val(station.wip[this.currentDay()]);
    myQueryContainer.outputName.val(station.unitName);


};

ViewModel.prototype.createStationNetwork = function (station) {
    if (this.currentScenario.simType === "Network") {
        var stationNetworkContainer = $('#station' + station.idNumber + '-network');
        var tableString = '<table class="resource-table">' +
            '<tr><td></td><td>Resource</td><td>Amount</td><td>OnHand</td><td>Desired</td></tr>';

        this.currentScenario.resourceList.forEach(function (resource) {
            if (resource.name !== station.unitName) {
                var checkId = 'station' + station.idNumber + 'res' + resource.idNumber + 'check';
                var reqAmountId = 'station' + station.idNumber + 'res' + resource.idNumber + 'amount';
                var onHandId = 'station' + station.idNumber + 'res' + resource.idNumber + 'onHand';
                var desiredId = 'station' + station.idNumber + 'res' + resource.idNumber + 'desired';
                tableString += '<tr><td>' +
                    '<input type="checkbox" id=' + checkId + ' checked="unchecked" ></input></td>' +
                    '<td>' + resource.name + '</td>' +
                    '<td><input type="text" id=' + reqAmountId + ' class="input-box hidden" ></td>' +
                    '<td><input type="text" id=' + onHandId + ' class="input-box hidden" ></td>' +
                    '<td><input type="text" id=' + desiredId + ' class="input-box hidden" ></td></tr>';
            }
        });
        tableString += '</table>';
        stationNetworkContainer.append(tableString);

        this.currentScenario.resourceList.forEach(function (resource) {
            var checkId = 'station' + station.idNumber + 'res' + resource.idNumber + 'check';
            var reqAmountId = 'station' + station.idNumber + 'res' + resource.idNumber + 'amount';
            var onHandId = 'station' + station.idNumber + 'res' + resource.idNumber + 'onHand';
            var desiredId = 'station' + station.idNumber + 'res' + resource.idNumber + 'desired';
            $('#' + checkId).attr('checked', false);
            $('#' + checkId).click(function () {
                if ($(this).is(':checked')) {
                    $('#' + reqAmountId).removeClass('hidden');
                    if ($('#' + reqAmountId).val() === '') {
                        $('#' + reqAmountId).val(1);
                    }
                    $('#' + onHandId).removeClass('hidden');
                    if ($('#' + onHandId).val() === '') {
                        $('#' + onHandId).val(0);
                    }
                    $('#' + desiredId).removeClass('hidden');
                    if ($('#' + desiredId).val() === '') {
                        $('#' + desiredId).val(1);
                    }

                    station.addResource(resource, $('#' + reqAmountId).val());
                } else {
                    $('#' + reqAmountId).addClass('hidden');
                    $('#' + onHandId).addClass('hidden');
                    $('#' + desiredId).addClass('hidden');
                    station.deleteResource(resource);
                }
            });
            $('#' + reqAmountId).change(function () {
                station.updateResourceAmount(resource, $('#' + reqAmountId).val());

            });
        });
    }
};

ViewModel.prototype.refreshNetwork = function (station) {
    var networkId = '#station' + station.idNumber + '-network'
    app.viewModel.queryContainer[station.idNumber - 1].stationContainer.find(networkId).empty();
    app.viewModel.createStationNetwork(station);
}

ViewModel.prototype.createStationGraph = function (station) {
    var j = station.idNumber - 1;
    var stationGraphID = 'station' + station.idNumber + '-graph';
    var stationGraphCanvasID = 'station' + station.idNumber + '-canvas';
    var stationGraphHTML = '<div id="' + stationGraphID + '" class="graph">' +
        '<canvas id="' + stationGraphCanvasID + '" class="canvas"></canvas></div>';
    var canvas = "#" + stationGraphCanvasID;
    this.queryContainer[j].stationContainer.append(stationGraphHTML);
    station.graph = null;
    station.graph = this.createChart(canvas, station.output, station.missedOp, station.wip, null);
};


ViewModel.prototype.clearStations = function () {
    $('.station').remove();
    this.queryContainer = [];
    this.currentScenario.stations.forEach(function (station) {
        if (station.graph) {
            station.graph.destroy();
        }
    });

};

//updates the display with the most recent data
ViewModel.prototype.updateData = function () {
    var day = this.currentDay();
    var scenario = this.currentScenario;

    for (var i = 0; i < scenario.stations.length; i++) {
        var j = i + 1;
        var currentStation = scenario.stations[i];
        this.queryContainer[i].cap.val(currentStation.baseCapacity);
        this.queryContainer[i].range.val(currentStation.capRange);
        this.queryContainer[i].unitVal.val(currentStation.unitValue);
        this.queryContainer[i].varience.val(currentStation.varFactor);
        this.queryContainer[i].wip.val(currentStation.wip[this.currentDay()]);

        if (!self.finishProd) {
            currentStation.graph.options.scales.yAxes[1].ticks.suggestedMax = (scenario.maxStationWIP);
            currentStation.graph.update();
            scenario.graph.update();
        }
    }
};

ViewModel.prototype.addStationToResourceList = function (station) {
    var addResource = true;
    app.viewModel.currentScenario.resourceList.forEach(function (resource) {
        if (resource.name === station.unitName) {
            resource.addProvider(station);
            addResource = false;
        }
    });
    if (addResource) {
        //not in our resource list, so let's add it.
        var tempResource = new ResourceItem();
        tempResource.name = station.unitName;
        tempResource.value = station.unitValue;
        tempResource.providerList = [];
        tempResource.addProvider(station);
        tempResource.idNumber = app.viewModel.resourceIdCounter;
        app.viewModel.resourceIdCounter += 1;
        app.viewModel.currentScenario.resourceList.splice(station.idNumber - 1, 0, tempResource);
    }
};

ViewModel.prototype.removeStationFromResourceList = function (station) {
    var scenario = app.viewModel.currentScenario;
    var i = scenario.resourceList.length - 1;
    for (i; i >= 0; i--) {
        var resource = scenario.resourceList[i];
        if (resource.containsStation(station)) {
            resource.removeProvider(station);

        }
        if (!resource.hasProvider()) {
            scenario.resourceList.splice(i, 1);
        }
    }
}




ViewModel.prototype.loadScenario = function (scenario) {
    if (this.currentScenario !== null) {
        this.clearUI();
        this.currentScenario = null;
    }
    if (this.$nav) {
        this.$nav.removeClass('open');
        this.$customSettings.toggle(false);
    }
    this.scenarioTitle(scenario.name);
    this.numOfStations(scenario.numOfStations);
    this.numOfDays(scenario.numOfDays);

    this.currentScenario = scenario;

    scenario.stations.forEach(function (station) {
        app.viewModel.addStationToResourceList(station)

    });
    this.buildUI();
    this.queryContainer.forEach(function (element) {
        element.outputName.change(function () {
            app.viewModel.removeStationFromResourceList(element.station);
            element.station.unitName = element.outputName.val()
            app.viewModel.addStationToResourceList(element.station);
            var tempId = "station" + element.station.idNumber + element.outputName.val();

            app.viewModel.currentScenario.stations.forEach(function (station) {
                app.viewModel.refreshNetwork(station);
            });
        });
        element.wip.change(function () {
            var tempVal = parseInt(element.wip.val());
            element.station.wip[app.viewModel.currentDay()] = tempVal;
        });
    });
    if (this.currentScenario.simType === "Normal") {
        $('#distribution').addClass('hidden');
    } else {
        $('#distribution').removeClass('hidden');
    }
};

ViewModel.prototype.getStationFromUnitName = function (unitName) {
    app.viewModel.currentScenario.stations.forEach(function (station) {
        if (station.unitName === unitName) {
            return station;
        }
    });
}




//instaniate our controller
app.viewModel = new ViewModel();
//bind the view to our ViewModel
ko.applyBindings(app.viewModel);
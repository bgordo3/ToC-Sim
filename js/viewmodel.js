/*global $, Model, ko, ScenarioItem, ChartHelper, ResourceItem*/
// global application variable
var app = app || {};


/**
 * @description - controller for index.html
 * @constructor
 */
var ViewModel = function () {
    'use strict';
    var self = this,
        $main = $('#map-container'),
        $nav = $('#menu-container'),
        $menuButton = $('#menu-button-container'),
        $customScenario = $('#custom'),
        $customSettings = $('#custom-settings');

    $customSettings.toggle(false);
    self.model = new Model();
    self.currentScenario = null;
    self.scenarios = ko.observableArray();
    self.scenarioTitle = ko.observable('Please choose a scenario');
    self.numOfStations = ko.observable(5);
    self.numOfDays = ko.observable(30);
    self.currentDay = ko.observable(0);
    self.finishProd = false;
    console.log("hi");

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


    window.changeGraph = function () {
        var dataToGraph = null;

        //remove and re-add canvases to delete old chart.
        $('#scenario-canvas').remove();
        $('#scenario-graph').append('<canvas id="scenario-canvas" class="canvas"></canvas></div>');
        self.currentScenario.stations.forEach(function (station) {
            $('#station' + station.number + '-canvas').remove();
            $('#station' + station.number + '-graph').append(
                '<canvas id="station' + station.number + '-canvas" class="canvas"></canvas></div>');
        });


        switch ($('#graph-option').val()) {
        case 'Production Value':
            self.currentScenario.graph = self.createChart('#scenario-canvas',
                self.currentScenario.totalOutput,
                self.currentScenario.totalMissedOp,
                self.currentScenario.totalWIP,
                self.currentScenario.totalProdValue);
            self.currentScenario.stations.forEach(function (station) {
                station.graph = self.createChart('#station' + station.number + '-canvas',
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
                station.graph = self.createChart('#station' + station.number + '-canvas',
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
                station.graph = self.createChart('#station' + station.number + '-canvas',
                    station.output,
                    station.missedOp,
                    station.wip,
                    station.totalEff);
            });
            break;
        case 'none':
        default:
            console.log(self.currentScenario.graph);
            self.currentScenario.graph = self.createChart('#scenario-canvas ',
                self.currentScenario.totalOutput,
                self.currentScenario.totalMissedOp,
                self.currentScenario.totalWIP,
                null);
            self.currentScenario.stations.forEach(function (station) {
                station.graph = self.createChart('#station' + station.number + '-canvas',
                    station.output,
                    station.missedOp,
                    station.wip,
                    null);
            });
            break;
        }

    }

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
                number: i,
                initWIP: 10,
                baseCapacity: 10,
                capRange: 0
            };
            var tempStation = new StationItem(data);
            scenario.addStation(tempStation);
        }
        self.loadScenario(scenario);
    }

    //reset
    window.reload = function () {
        self.currentDay(0);
        self.currentScenario.reload();
        self.clearUI();
        self.buildUI();

    }

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

            for (var i = 0; i < self.currentScenario.stations.length; i++) {
                var j = i + 1;
                var currentStation = self.currentScenario.stations[i];
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
                currentStation.wip[self.currentDay()] = parseInt($('#' + wipID).val());

                //if we are the first station, don't worry about previous station
                if (i == 0) {
                    wipToAdd = 0;
                    wipValue = 0;
                } else {
                    //if its the first day, only work on what's in the initial WIP
                    if (self.currentDay() == 0) {
                        wipToAdd = 0;
                    } else { //its not the first day, so we need to add previous stations work
                        wipToAdd = self.currentScenario.stations[i - 1].output[day - 1];
                    }
                    wipValue = self.currentScenario.stations[i - 1].unitValue;
                }
                currentStation.doWork(self.currentDay(), wipToAdd, wipValue);
            }
            self.currentScenario.updateTotals(self.currentDay());
            //update the GUI with new data
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

    /**
     * @description - closes menu drawer and displays info window for selected pin.
     *                function is bound by Knockout.js framework in index.html
     */
    window.menuClick = function () {
        self.loadScenario(this);
    };

    $(document).ready(function () {
        self.loadScenario(self.scenarios()[0]);
        var i = 0;
        for (i; i < 5; i++) {
            runProduction();
        }
    });

};

ViewModel.prototype = Object.create(ViewModel.prototype);
ViewModel.prototype.createChart = function (canvas, output, missed, wip, optData) {
    var graph = null;

    switch ($('#graph-option').val()) {
    case 'Production Value':
        var data = {
            axisLabel: 'Production Value',
            axisMax: 10,
            axisStep: 1,
            dataLabel: 'Production Value',
            dataType: 'line',
            optData: optData
        };
        break;
    case 'WIP Inventory Value':
        var data = {
            axisLabel: 'WIP Value',
            axisMax: 10,
            axisStep: 1,
            dataLabel: 'WIP Value',
            dataType: 'line',
            optData: optData
        };
        break;
    case 'Efficiency':
        var data = {
            axisLabel: 'Eff',
            axisMax: 1.2,
            axisStep: .2,
            dataLabel: 'Eff',
            dataType: 'line',
            optData: optData
        }
        break;
    case 'none':
    default:
        data = null;
        break;
    }

    graph = chartHelper(canvas, output, missed, wip, data);
    return graph;

}
ViewModel.prototype.buildUI = function () {
    this.clearUI();
    $('.control').removeClass("hidden");

    var headerHTML = '<div id="scenario-settings" class="settings">Scenario Data' +
        '<p>Number of Days: ' + this.currentScenario.numOfDays + '</p>' +
        '<p>Number of Stations: ' + this.currentScenario.numOfStations + '</p>';
    $('#scenario-container').append(headerHTML);
    $('#scenario-container').append('<div id="graph-settings" class="graph-settings">' +
        'Graph Optional Line: ' +
        '<select id="graph-option" onchange="changeGraph()">' +
        '<option value="None">None</option>' +
        '<option value="Efficiency">Efficiency</option>' +
        '<option value="WIP Inventory Value">WIP Inventory Value</option>' +
        '<option value="Production Value">Production Value</option>' +
        '</select>');
    $('#scenario-container').append('<div id="scenario-graph" class="graph"></div>');
    $('#scenario-graph').append('<canvas id="scenario-canvas" class="canvas"></canvas></div>');


    //create our overall scenario chart

    this.currentScenario.graph = this.createChart('#scenario-canvas', this.currentScenario.totalOutput, this.currentScenario.totalMissedOp, this.currentScenario.totalWIP, null);



    for (var i = 1; i <= this.numOfStations(); i++) {
        var currentStation = this.currentScenario.stations[i - 1];
        var stationContainerID = 'station' + i + '-container';
        var capID = "station" + i + "cap";
        var rangeID = "station" + i + "range";
        var unitValID = "station" + i + "unitVal";
        var varID = "station" + i + "var";
        var wipID = "station" + i + "wip";
        var stationHTML = '<div id="' + stationContainerID + '" class="station"></div>'
        var stationSettingsHTML = '<div id="station' + i + '-settings" class="settings">Station ' + i + ' Data' +
            '<table><tr>' +
            '<td>Base Capacity:</td>' +
            '<td><input id="' + capID + '" type="text" name="' + capID + '"></td>' +
            '</tr><tr>' +
            '<td>Capacity Range:</td>' +
            '<td><input id="' + rangeID + '" type="text" name="' + rangeID + '"></td>' +
            '</tr><tr>' +
            '<td>Variance Factor:</td>' +
            '<td><input id="' + varID + '" type="text" name="' + varID + '"></td>' +
            '</tr><tr>' +
            '<td>Unit Value: </td>' +
            '<td><input id="' + unitValID + '" type="text" name="' + unitValID + '"></td>' +
            '</tr><tr>' +
            '<td>Current WIP: </td>' +
            '<td><input id="' + wipID + '" type="text" name="' + wipID + '"></td>' +
            '</tr></table></div>';
        var stationNetworkHTML = '<div id="station' + i + '-network" class="network-settings">' +
            '</div>';
        var stationGraphID = 'station' + i + '-graph';
        var stationGraphCanvasID = 'station' + i + '-canvas';
        var stationGraphHTML = '<div id="' + stationGraphID + '" class="graph">' +
            '<canvas id="' + stationGraphCanvasID + '" class="canvas"></canvas></div>';
        $('#station-container').append(stationHTML);
        $('#' + stationContainerID).append(stationSettingsHTML);
        $('#' + stationContainerID).append(stationNetworkHTML);
        $('#' + stationContainerID).append(stationGraphHTML);
        $('#' + capID).val(currentStation.baseCapacity);
        $('#' + rangeID).val(currentStation.capRange);
        $('#' + unitValID).val(currentStation.unitValue);
        $('#' + varID).val(currentStation.varFactor);
        $('#' + wipID).val(currentStation.wip[this.currentDay()]);
        var canvas = "#" + stationGraphCanvasID;
        currentStation.graph = this.createChart(canvas, currentStation.output, currentStation.missedOp, currentStation.wip, null);

    }
}
ViewModel.prototype.clearUI = function () {
        $('.settings').remove();
        $('.graph').remove();
        $('.station').remove();
        $('.canvas').remove();
        $('.control').addClass("hidden");

    }
    //updates the display with the most recent data
ViewModel.prototype.updateData = function () {
    var day = this.currentDay();
    var scenario = this.currentScenario;
    scenario.days.push(day);

    for (var i = 0; i < scenario.stations.length; i++) {
        var j = i + 1;
        var currentStation = scenario.stations[i];
        currentStation.graph.options.scales.yAxes[1].ticks.suggestedMax = (scenario.maxStationWIP);

        var capID = "station" + j + "cap";
        var rangeID = "station" + j + "range";
        var unitValID = "station" + j + "unitValue";
        var varID = "station" + j + "var";
        var wipID = "station" + j + "wip";



        $('#' + capID).val(currentStation.baseCapacity);
        $('#' + rangeID).val(currentStation.capRange);
        $('#' + unitValID).val(currentStation.unitValue);
        $('#' + varID).val(currentStation.varFactor);
        $('#' + wipID).val(currentStation.wip[this.currentDay() + 1]);



        if (!self.finishProd) {
            currentStation.graph.update();
        }
    }

    scenario.graph.update();
}
ViewModel.prototype.loadScenario = function (scenario) {
    if (this.$nav) {
        this.$nav.removeClass('open');
        this.$customSettings.toggle(false);
    }
    this.currentScenario = scenario;
    this.scenarioTitle(this.currentScenario.name);
    this.numOfStations(this.currentScenario.numOfStations);
    this.numOfDays(this.currentScenario.numOfDays);
    this.buildUI();
};

//instaniate our controller
app.viewModel = new ViewModel();
//bind the view to our ViewModel
ko.applyBindings(app.viewModel);
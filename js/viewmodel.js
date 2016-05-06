/*global $, Model, ko, ScenarioItem */
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
    self.currentScenario = ko.observable();
    self.scenarios = ko.observableArray();
    self.scenarioTitle = ko.observable('Please choose a scenario');
    self.numOfStations = ko.observable(5);
    self.numOfDays = ko.observable(30);
    self.currentDay = ko.observable(0);

    //populate locations observable container with data from model
    self.model.getAllScenarios().forEach(function (scen) {
        self.scenarios.push(new ScenarioItem(scen));
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
        self.currentScenario(scenario);

        //create stations with default data
        for (var i = 1; i <= self.numOfStations(); i++) {
            var data = {
                number: i,
                initWIP: 10,
                baseCapacity: 10,
                sigma: 0
            };
            var tempStation = new StationItem(data);
            self.currentScenario().addStation(tempStation);
        }
        self.buildUI();
    }

    //reset
    window.reload = function () {
        self.currentScenario().reload();
        self.currentDay(0);
        $('.station-textarea').text('');
        $('.scenario-textarea').text('');
    }

    window.runProduction = function () {
        var runCalc = false;
        var day = self.currentDay();
        if (self.currentScenario()) {
            if (!self.currentScenario().totalCapacity[self.currentDay + 1]) {
                runCalc = true;
            }
        }
        if (runCalc) {
            self.currentScenario().totalWIPS[day] = 0;
            self.currentScenario().totalCapacity[day] = 0;
            self.currentScenario().totalOutput[day] = 0;
            self.currentScenario().totalMissedOp[day] = 0;

            for (var i = 0; i < self.currentScenario().stations.length; i++) {
                var currentStation = self.currentScenario().stations[i];
                var wipToAdd = 0;

                //if we are the first station, don't worry about previous station
                if (i == 0) {
                    wipToAdd = 0;
                } else {
                    //if its the first day, only work on what's in the initial WIP
                    if (self.currentDay() == 0) {
                        wipToAdd = 0;
                    } else { //its not the first day, so we need to add previous stations work
                        wipToAdd = self.currentScenario().stations[i - 1].output[day - 1];
                    }
                }
                currentStation.doWork(self.currentDay(), wipToAdd);
            }

            self.currentScenario().updateTotals(self.currentDay());

            //update the GUI with new data
            self.updateData();
            self.currentDay(self.currentDay() + 1);

        }
    };


    window.finishProduction = function () {
        while (self.currentDay() <= self.numOfDays()) {
            runProduction();
        }
    };

    window.printTotalResults = function () {
        var totalProd = 0;
        var totalMissed = 0;
        var totalOutput = 0;
        var totalHTMLText = '';
        self.currentScenario().totalCapacity().forEach(function (prod) {
            totalProd += prod;
        });
        self.currentScenario().totalMissedOp().forEach(function (miss) {
            totalMissed += miss;
        });
    };

    /**
     * @description - closes menu drawer and displays info window for selected pin.
     *                function is bound by Knockout.js framework in index.html
     */
    window.menuClick = function () {
        $nav.removeClass('open');
        self.currentScenario(this);
        self.scenarioTitle(self.currentScenario().name);
        $customSettings.toggle(false);
        self.numOfStations(self.currentScenario().numOfStations);
        self.numOfDays(self.currentScenario().numOfDays);
        self.buildUI();
    };

};
ViewModel.prototype = Object.create(ViewModel.prototype);

ViewModel.prototype.buildUI = function () {
    this.clearUI();
    $('.control').removeClass("hidden");

    var headerHTML = '<div id="scenario-settings" class="settings">Scenario Data' +
        '<p>Number of Days: ' + this.currentScenario().numOfDays + '</p>' +
        '<p>Number of Stations: ' + this.currentScenario().numOfStations + '</p>';
    $('#sim-header').append(headerHTML);
    /*
    $('#sim-header').append('<div id="scenario-data" class="scenario-data">');
 
    $('#scenario-data').append('<div id="scenario-label" disabled class="scenario-label">' +
        '<div class="data-column">DAY</div>' +
        '<div class="data-column">WIP</div>' +
        '<div class="data-column">CAPACITY</div>' +
        '<div class="data-column">OUTPUT</div>' +
        '<div class="data-column">MISSED</div>' +
        '</div>');
    $('#scenario-data').append('<div id="scenario-table" disabled class="scenario-table">' +
        '<div id="scenario-day" class="data-column"> </div>' +
        '<div id="scenario-wip" class="data-column"> </div>' +
        '<div id="scenario-capacity" class="data-column"> </div>' +
        '<div id="scenario-ouput" class="data-column"> </div>' +
        '<div id="scenario-missed" class="data-column"> </div>' +
        '</div>');
*/
    $('#sim-header').append('<div id="scenario-graph" class="graph"></div>');
    $('#scenario-graph').append('<canvas id="scenario-canvas" class="canvas"></canvas></div>');

    //create our overall scenario chart
    this.currentScenario().graph = this.createChart('#scenario-canvas',
        this.currentScenario().totalOutput, this.currentScenario().totalMissedOp, this.currentScenario().totalWIPS, []);


    for (var i = 1; i <= this.numOfStations(); i++) {
        var stationContainerID = 'station' + i + '-container';
        var stationHTML = '<div id="' + stationContainerID + '" class="station"></div>'
        var stationSettingsHTML = '<div id="station' + i + '-settings" class="settings">Station ' + i + ' Data</div>';
        //    var stationDataID = 'station' + i + '-data';
        var stationGraphID = 'station' + i + '-graph';
        var stationGraphCanvasID = 'station' + i + '-canvas';
        // var stationDataHTML = '<div id="' + stationDataID + '" class="station-data"></div>';
        var stationGraphHTML = '<div id="' + stationGraphID + '" class="graph">' +
            '<canvas id="' + stationGraphCanvasID + '" class="canvas"></canvas></div>';
        $('#station-container').append(stationHTML);
        $('#' + stationContainerID).append(stationSettingsHTML);
        // $('#' + stationContainerID).append(stationDataHTML);
        $('#' + stationContainerID).append(stationGraphHTML);

        var currentStation = this.currentScenario().stations[i - 1];
        var canvas = "#" + stationGraphCanvasID;
        currentStation.graph = this.createChart(canvas, currentStation.output, currentStation.missedOp, currentStation.wipValues, currentStation.totalEff);
    }
}

ViewModel.prototype.createChart = function (canvas, data1, data2, data3, data4) {
    var graph = new Chart($(canvas), {
        type: 'bar',
        data: {
            labels: this.currentScenario().days,
            datasets: [{
                    label: 'Output',
                    backgroundColor: "rgba(0, 255, 0, 0.6)",
                    data: data1
        },
                {
                    label: 'Missed Ops',
                    backgroundColor: "rgba(255, 0, 0, 0.6)",
                    data: data2
        },
                {
                    label: "WIP",
                    type: 'line',
                    data: data3,
                    fill: false,
                    borderColor: '#EC932F',
                    backgroundColor: '#EC932F',
                    pointBorderColor: '#EC932F',
                    pointBackgroundColor: '#EC932F',
                    pointHoverBackgroundColor: '#EC932F',
                    pointHoverBorderColor: '#EC932F',
                    yAxisID: 'y-axis-2'
            },
                {
                    label: "Eff",
                    type: 'line',
                    data: data4,
                    fill: false,
                    borderColor: '#006',
                    backgroundColor: '#006',
                    pointBorderColor: '#006',
                    pointBackgroundColor: '#006',
                    pointHoverBackgroundColor: '#006',
                    pointHoverBorderColor: '#006',
                    yAxisID: 'y-axis-3'
            }]
        },
        options: {

            animated: false,
            scales: {
                xAxes: [{
                    stacked: true
                }],
                yAxes: [{
                        stacked: true,
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: (this.currentScenario().stationMax * 1.2)
                        }
            }, {
                        type: "linear",
                        display: true,
                        position: "right",
                        id: "y-axis-2",
                        gridLines: {
                            display: false
                        },
                        labels: {
                            show: true,

                        }
            }, {

                        type: "linear",
                        display: true,
                        position: "left",
                        id: "y-axis-3",
                        gridLines: {
                            display: false
                        },
                        labels: {
                            show: true,
                        },
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: (1.1)
                        }
            }
                    ]


            }
        }

    });
    return graph;
}

ViewModel.prototype.clearUI = function () {
    $('#settings').remove();
    $('#scenario-data').remove();
    $('.station').remove();
    $('.control').addClass("hidden");
    this.currentDay(0);
}

//updates the display with the most recent data
ViewModel.prototype.updateData = function () {
    var day = this.currentDay();
    var scenario = this.currentScenario();
    scenario.days.push(day);

    for (var i = 0; i < scenario.stations.length; i++) {
        var currentStation = scenario.stations[i];
        /*
           
            var stationID = 'station' + currentStation.number + '-textarea';
            var stationTextToAdd = '';
            var textbox = $('#' + stationID);
            textbox.text(this.currentDay() + '\t ' +
                currentStation.wipValues[day] + '\t\t' +
                currentStation.capacityValues[day] + '\t\t' +
                currentStation.output[day] + '\t\t' +
                currentStation.missedOp[day] + '\n' + textbox.val
                */
        currentStation.graph.update();
    }
    /*
        var stationTextToAdd = '';
        var dayText = $('#scenario-day').text();
        var wipText = $('#scenario-wip').text();
        var capacityText = $('#scenario-capacity').text();
        var outputText = $('#scenario-output').text();
        var missedText = $('#scenario-missed').text();
        $('#scenario-day').text(this.currentScenario().days[day] + '\n' + $('#scenario-day').text());
    */
    scenario.graph.update();

}

//instaniate our controller
app.viewModel = new ViewModel();
//bind the view to our ViewModel
ko.applyBindings(app.viewModel);
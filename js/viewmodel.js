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
    self.numOfStations = ko.observable('5');
    self.numOfDays = ko.observable('30');
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

    $customScenario.click(function () {
        $customSettings.toggle("slow");
        self.scenarioTitle("Custom Scenario");
    });

    /**
     * @description - closes menu drawer and displays info window for selected pin.
     *                function is bound by Knockout.js framework in index.html
     */
    window.menuClick = function () {
        $nav.removeClass('open');
        self.currentScenario(this);
        self.scenarioTitle(self.currentScenario().name);
        $customSettings.toggle(false);
        self.currentScenario().verify();
        self.buildUI();
    };

    /**
     * @description - loads custom scenario when 'Load Scenario' is clicked
     */
    window.loadCustom = function () {
        $nav.removeClass('open');
        self.numOfDays($('#days').val());
        self.numOfStations($('#stations').val());

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
                baseProduction: 10,
                sigma: 0
            };
            var tempStation = new StationItem(data);
            self.currentScenario().addStation(tempStation);
        }
        self.currentScenario().verify();
        self.buildUI();
    }

    self.buildUI = function () {
        self.clearUI();
        $('.control').toggleClass("hidden");
        $('#sim-header').append('<div id="scenario-data" class="scenario-data">Scenario Data</div>');
        $('#sim-header').append('<div id="scenario-graph" class="scenario-graph">Scenario Graph</div>');
        for (var i = 1; i <= self.numOfStations(); i++) {
            var stationContainerID = 'station' + i + '-container';
            var stationHTML = '<div id="' + stationContainerID + '" class="station"></div>'
            var stationDataHTML = '<div id="station' + i + '-data" class="station-data">Station ' + i + ' Data</div>';
            var stationGraphHTML = '<div id="station' + i + '-graph" class="station-graph">Station ' + i + ' Graph</div>';
            $('#station-container').append(stationHTML);
            $('#' + stationContainerID).append(stationDataHTML);
            $('#' + stationContainerID).append(stationGraphHTML);
        }
    };

    self.clearUI = function () {
        $('#scenario-data').remove();
        $('#scenario-graph').remove();
        $('.station').remove();
    }

    window.reload = function () {
        self.currentScenario().reload();
        self.currentDay(0);
        console.clear()
    }

    window.runProduction = function () {
        var runCalc = false;
        var day = self.currentDay();
        if (self.currentScenario()) {
            if (!self.currentScenario().totalProduction()[self.currentDay + 1]) {
                runCalc = true;
            }
        }
        if (runCalc) {
            console.log("Day: " + day);
            self.currentScenario().totalMissedOp()[day] = 0;
            self.currentScenario().totalProduction()[day] = 0;
            for (var i = 0; i < self.currentScenario().stations().length; i++) {
                var currentStation = self.currentScenario().stations()[i];
                var wipToAdd = 0;

                //if we are the first station, don't worry about previous station
                if (i == 0) {
                    wipToAdd = 0;
                } else {
                    //if its the first day, only work on what's in the initial WIP
                    if (self.currentDay() == 0) {
                        wipToAdd = 0;
                    } else { //its not the first day, so we need to add previous stations work
                        wipToAdd = self.currentScenario().stations()[i - 1].output()[day - 1];
                    }
                }
                currentStation.doWork(self.currentDay(), wipToAdd);
                self.currentScenario().totalMissedOp()[day] = self.currentScenario().totalMissedOp()[day] + currentStation.missedOp()[day];
            }

            console.log("Missed Op: " + self.currentScenario().totalMissedOp()[day])

            //set total production for the day equal to last station's output for the day
            self.currentScenario().totalProduction()[day] =
                self.currentScenario().stations()[self.currentScenario().stations().length - 1].output()[day];
            self.currentDay(self.currentDay() + 1);

            printTotalResults();

        } else {
            console.log("Data exists...skipping calc");
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
        self.currentScenario().totalProduction().forEach(function (prod) {
            totalProd += prod;
        });
        self.currentScenario().totalMissedOp().forEach(function (miss) {
            totalMissed += miss;
        });
        console.log("Total production: " + totalProd);
        console.log("Total missed op: " + totalMissed);;
    }

};

window.prevDay = function () {
    if (self.currentDay() > 1)
        self.currentDay(self.currentDay() - 1);
};

//logic to make navigation bar "float with scroll
$(document).ready(function () {

    var num = 120; //number of pixels before modifying styles

    $(window).bind('scroll', function () {
        if ($(window).scrollTop() > num) {
            $('.sim-header').addClass('fixed');
        } else {
            $('.sim-header').removeClass('fixed');
        }
    });
});

//instaniate our controller
app.viewModel = new ViewModel();
//bind the view to our ViewModel
ko.applyBindings(app.viewModel);
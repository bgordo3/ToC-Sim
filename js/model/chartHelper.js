/*global $, Model, ScenarioItem */
var app = app || {};

var chartHelper = function (canvas, output, missed, wip, optData) {
    var baseDataSets = [
        {
            label: 'Output',
            backgroundColor: "rgba(0, 255, 0, 0.6)",
            data: output
        },
        {
            label: 'Missed Ops',
            backgroundColor: "rgba(255, 0, 0, 0.6)",
            data: missed
        },
        {
            label: "WIP",
            type: 'line',
            data: wip,
            fill: false,
            borderColor: '#EC932F',
            backgroundColor: '#EC932F',
            pointBorderColor: '#EC932F',
            pointBackgroundColor: '#EC932F',
            pointHoverBackgroundColor: '#EC932F',
            pointHoverBorderColor: '#EC932F',
            yAxisID: 'y-axis-2'
            }
                   ];
    if (optData) {
        baseDataSets.push({
            label: optData.dataLabel,
            type: optData.dataType,
            data: optData.optData,
            fill: false,
            borderColor: '#006',
            backgroundColor: '#006',
            pointBorderColor: '#006',
            pointBackgroundColor: '#006',
            pointHoverBackgroundColor: '#006',
            pointHoverBorderColor: '#006',
            yAxisID: 'y-axis-3'
        });

    }

    var baseOptions = {
        animated: false,
        scales: {
            xAxes: [{
                stacked: true
                }],
            yAxes: [{
                    stacked: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Output / Missed'
                    },
                    ticks: {
                        beginAtZero: true,
                        suggestedMax: (app.viewModel.currentScenario.maxOutput + .5)
                    },
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

                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'WIP'
                    },
                    ticks: {
                        beginAtZero: true,
                        suggestedMax: app.viewModel.currentScenario.maxStationWIP
                    }

                        }
                    ]
        }
    }

    if (optData) {
        var axis = {
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
                beginAtZero: true
            },
            scaleLabel: {
                display: true,

            }

        };

        if (optData.max) {
            axis.ticks.suggestedMax = optData.axisMax;
            axis.ticks.stepSize = optData.step;
        }
        if (optData.step) {
            axis.ticks.stepSize = optData.step;
        }
        if (optData.axisLabel) {
            axis.scaleLabel.labelString = optData.axisLabel;
        }
        baseOptions.scales.yAxes.push(axis);

    }


    var graphData = {
        type: 'bar',
        data: {
            labels: app.viewModel.currentScenario.days,
            datasets: baseDataSets
        },
        options: baseOptions
    };
    var graph = new Chart($(canvas), graphData);
    return graph;
};
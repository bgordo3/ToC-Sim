var app = app || {};

var Scenarios = [
    {
        name: 'Scenario 1',
        numOfDays: 30,
        stations: [
            {
                number: 1,
                baseCapacity: 5,
                initWIP: 4,
                sigma: 1
                },
            {
                number: 2,
                initWIP: 2,
                baseCapacity: 6,
                sigma: .5
                },
            {
                number: 3,
                initWIP: 4,
                baseCapacity: 7,
                sigma: .1
                }
            ]
        },
    {
        name: 'Scenario 2',
        numOfDays: 30
        },
    {
        name: 'Scenario 3',
        numOfDays: 30
        },
    {
        name: 'Scenario 4',
        numOfDays: 30
        },
    {
        name: "Scenario 5",
        numOfDays: 30
        },
    {
        name: "Scenario 6",
        numOfDays: 20,
        stations: [
            {
                number: 1,
                baseCapacity: 10,
                initWIP: 4,
                sigma: 0
                },
            {
                number: 2,
                initWIP: 2,
                baseCapacity: 5,
                sigma: 0
                },
            {
                number: 3,
                initWIP: 1,
                baseCapacity: 5,
                sigma: 0
                }
            ]
        }
    ];
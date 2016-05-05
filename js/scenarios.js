var app = app || {};

var Scenarios = [
    {
        name: 'Unbalanced Line',
        numOfDays: 30,
        stations: [
            {
                number: 1,
                baseCapacity: 7,
                initWIP: 0,
                sigma: 5
                },
            {
                number: 2,
                baseCapacity: 7,
                initWIP: 4,
                sigma: 5
                },
            {
                number: 3,
                baseCapacity: 3.5,
                initWIP: 4,
                sigma: 2.5
                },
            {
                number: 4,
                baseCapacity: 7,
                initWIP: 4,
                sigma: 5
                },
            {
                number: 5,
                baseCapacity: 7,
                initWIP: 4,
                sigma: 5
                }
            ]
        },
    {
        name: 'Balanced Line',
        numOfDays: 30,
        stations: [
            {
                number: 1,
                baseCapacity: 7,
                initWIP: 0,
                sigma: 3
                },
            {
                number: 2,
                baseCapacity: 7,
                initWIP: 4,
                sigma: 3
                },
            {
                number: 3,
                baseCapacity: 7,
                initWIP: 4,
                sigma: 3
                },
            {
                number: 4,
                baseCapacity: 7,
                initWIP: 4,
                sigma: 5
                },
            {
                number: 5,
                baseCapacity: 7,
                initWIP: 4,
                sigma: 5
                }
            ]
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
var app = app || {};

var Scenarios = [
    {
        name: 'Unbalanced Line',
        numOfDays: 30,
        simType: 'normal',
        stations: [
            {
                number: 1,
                baseCapacity: 7,
                initWIP: 0,
                capRange: 5,
                varFactor: 2
                },
            {
                number: 2,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 5,
                varFactor: 2
                },
            {
                number: 3,
                baseCapacity: 3.5,
                initWIP: 4,
                capRange: 2.5,
                varFactor: 1
                },
            {
                number: 4,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 5,
                varFactor: 2
                },
            {
                number: 5,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 5,
                varFactor: 2
                }
            ]
        },
    {
        name: 'Balanced Line',
        numOfDays: 30,
        simType: 'normal',
        stations: [
            {
                number: 1,
                baseCapacity: 7,
                initWIP: 0,
                capRange: 3
                },
            {
                number: 2,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 3
                },
            {
                number: 3,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 3
                },
            {
                number: 4,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 5
                },
            {
                number: 5,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 5
                }
            ]
        },
    {
        name: 'One not Lean',
        numOfDays: 30,
        simType: 'normal',
        stations: [
            {
                number: 1,
                baseCapacity: 7,
                initWIP: 0,
                capRange: 2
                },
            {
                number: 2,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 2
                },
            {
                number: 3,
                baseCapacity: 5,
                initWIP: 4,
                capRange: 5
                },
            {
                number: 4,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 2
                },
            {
                number: 5,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 2
                }
            ]
        },
    {
        name: 'All stations are bad',
        numOfDays: 30,
        simType: 'normal',
        stations: [
            {
                number: 1,
                baseCapacity: 7,
                initWIP: 0,
                capRange: 7
                },
            {
                number: 2,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 7
                },
            {
                number: 3,
                baseCapacity: 5,
                initWIP: 4,
                capRange: 7
                },
            {
                number: 4,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 7
                },
            {
                number: 5,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 7
                }
            ]
        },
    {
        name: "Scenario 5",
        numOfDays: 30,
        simType: 'normal',
        },
    {
        name: "Scenario 6",
        numOfDays: 20,
        stations: [
            {
                number: 1,
                baseCapacity: 10,
                initWIP: 4,
                capRange: 0
                },
            {
                number: 2,
                initWIP: 2,
                baseCapacity: 5,
                capRange: 0
                },
            {
                number: 3,
                initWIP: 1,
                baseCapacity: 5,
                capRange: 0
                }
            ]
        }
    ];
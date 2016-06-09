var app = app || {};

var Scenarios = [
    {
        name: 'Unbalanced Line',
        numOfDays: 30,
        simType: 'Normal',
        stations: [
            {
                idNumber: 1,
                baseCapacity: 7,
                initWIP: 0,
                capRange: 5,
                varFactor: 2,
                unitName: 'copperOre'
                },
            {
                idNumber: 2,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 5,
                varFactor: 2,
                unitName: 'ironOre'
                },
            {
                idNumber: 3,
                baseCapacity: 3.5,
                initWIP: 4,
                capRange: 2.5,
                varFactor: 1,
                unitName: 'ironBolt'
                },
            {
                idNumber: 4,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 5,
                varFactor: 2,
                unitName: 'ironBolt'
                },
            {
                idNumber: 5,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 5,
                varFactor: 2,
                unitName: 'seaforiumCharge'
                }
            ]
        },
    {
        name: 'Balanced Line',
        numOfDays: 30,
        simType: 'normal',
        stations: [
            {
                idNumber: 1,
                baseCapacity: 7,
                initWIP: 0,
                capRange: 3
                },
            {
                idNumber: 2,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 3
                },
            {
                idNumber: 3,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 3
                },
            {
                idNumber: 4,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 5
                },
            {
                idNumber: 5,
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
                idNumber: 1,
                baseCapacity: 7,
                initWIP: 0,
                capRange: 2
                },
            {
                idNumber: 2,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 2
                },
            {
                idNumber: 3,
                baseCapacity: 5,
                initWIP: 4,
                capRange: 5
                },
            {
                idNumber: 4,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 2
                },
            {
                idNumber: 5,
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
                idNumber: 1,
                baseCapacity: 7,
                initWIP: 0,
                capRange: 7
                },
            {
                idNumber: 2,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 7
                },
            {
                idNumber: 3,
                baseCapacity: 5,
                initWIP: 4,
                capRange: 7
                },
            {
                idNumber: 4,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 7
                },
            {
                idNumber: 5,
                baseCapacity: 7,
                initWIP: 4,
                capRange: 7
                }
            ]
        },
    {
        name: "Network Test",
        numOfDays: 10,
        simType: 'Network',
                stations: [
            {
                idNumber: 1,
                baseCapacity: 2,
                initWIP: 0,
                capRange: 1
                },
            {
                idNumber: 2,
                initWIP: 0,
                baseCapacity: 2,
                capRange: 1
                },
            {
                idNumber: 3,
                initWIP: 0,
                baseCapacity: 2,
                capRange: 1
                }
            ]
        }
    ];
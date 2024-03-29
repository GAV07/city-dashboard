const path = require('path');
const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});

const ProcessData = require('../ProcessData.js');

const baseId = process.env.BASE_ID;
const table = process.env.UNEMPLOYMENT_TABLE;
const blsAPIKey = process.env.BLS_API_KEY;

const processData = new ProcessData(baseId, table)


const monthList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const years = [2023, 2022, 2021, 2020, 2019, 2018, 2017];

/*const seriesIds = [
    ['LAUCT124500000000003', 'LAUCT124500000000004', 'LAUCT124500000000005', 'LAUCT124500000000006'] // this is the Miami area series [unemp. rate, unemployment, employment, labor force]
];*/

const seriesIds = [
    // new Map("miami", ['LAUCT124500000000003', 'LAUCT124500000000004', 'LAUCT124500000000005', 'LAUCT124500000000006']) // this is the Miami area series [unemp. rate, unemployment, employment, labor force]
    { "Miami": ['LAUCT124500000000003', 'LAUCT124500000000004', 'LAUCT124500000000005', 'LAUCT124500000000006']} // this is the Miami area series [unemp. rate, unemployment, employment, labor force] }
];
const measureCodes = {
    "Labor Force": "06",
    "Employment": "05",
    "Unemployment": "04",
    "Unemployment Rate": "03",
}

const getData = async () => {

    let URL = `https://api.bls.gov/publicAPI/v2/timeseries/data/`;

    /*    what the 3 loops are doing
        ex. Miami -> 2023 -> Labor Force for all the months in 2023
        next iteration : ex. Miami -> 2023 -> Employment for all the months in 2023
        ....
        ex. Miami -> 2022 -> Labor Force for all the months in 2022
        ...
        ex. West Palm -> 2023 -> Labor Force for all the months in 2023
    */

    // loop through each city
    for(let city = 0; city < seriesIds.length; city++){

        const series = seriesIds[city];
        const cityName = Object.keys(series)[0];
        const seriesId = Object.values(series)[0];


        let totalMonths = 0;

        // for each city, go through 2017 - current year
        for(let year = 0; year < years.length; year++){

            // const seriesId = series;


            // if the record exists,
            // const record = await processData.getRecord({"Date": "Jan 2023"}, {"City": cityName});
            // console.log(record);
            // return;

            console.log(seriesId + " -- " + years[year]);

            try{
                const res = await axios.post(URL, {
                    "seriesid": seriesId,
                    "startyear": years[year],
                    "endyear": years[year]
                }, {
                    headers: {
                        "Authorization": `Bearer ${blsAPIKey}`
                    }
                }).then(response => {
                    return response;
                }).catch(err => {
                    console.log(err);
                });

                // loop through the data and send o air table for each month of that year
                const data = res.data.Results.series;
                console.log(data[0].data);

                totalMonths = data[0].data.length;

                // loops through the total months currently
                for(let x = 0; x < totalMonths; x++){

                    const date = new Date(data[0].data[x].periodName + " " + years[year]).toLocaleString('en-US', { month: 'short' }) + " " + years[year];

                    // for each month grab the 4 values (employment, unemp. rate, labor force, unemployment)
                    // ex [ [{jan: labor force}], [{jan: unemp. rate}], [{jan: unemployment}], [{jan: employment}]  ]

                    const unemploymentRate = parseFloat(data[0].data[x].value);
                    const unemployment = parseFloat(data[1].data[x].value);
                    const employment = parseFloat(data[2].data[x].value);
                    const laborForce = parseFloat(data[3].data[x].value);
                    console.log(cityName + " " + date + " " + unemploymentRate + " " + unemployment + " " + employment + " " + laborForce);

                    await sendToAirTable(date, cityName, unemploymentRate, unemployment, employment, laborForce);

                }


                await insertRestOfMonths(totalMonths);

            }catch (e) {
                // console.log(`API REQUEST LIMIT REACHED`);
                console.log(e);
            }

            // console.log("REMOVE TO CONTINUE ALL")
            // return;

        }

    }
}

const sendToAirTable = async (date, city, unemploymentRate, unemployment, employment, laborForce)=>{


    const record = await processData.getRecord({"Date": date});
    // const record = await processData.getRecord({"Date": "Jan 2023"}, {"City": cityName});

    // the record exists
    if( record.records?.length > 0 ){

        recordData = {
            "fields": {
                // "Date": date,
                "City": city,
                "Labor Force": laborForce,
                "Employment": employment,
                "Unemployment": unemployment,
                "Unemployment Rate": unemploymentRate,

            }
        };

        const id = record.records[0].id;
        await processData.updateRecord(recordData, id);

        // if record does not exist
    }else{

        recordData = {
            "records": [
                {
                    "fields": {
                        "Date": date,
                        "City": city,
                        "Labor Force": laborForce,
                        "Employment": employment,
                        "Unemployment": unemployment,
                        "Unemployment Rate": unemploymentRate,

                    }
                }
            ]
        };

        await processData.createRecord(recordData);
    }
}

const insertRestOfMonths = async (totalMonths) => {

    // add the rest of the months, regardless if it BLS updated those months
    // ex. if BLS only updated Jan 2023, insert Feb-Dec in airtable
    // this is because, in air table it will keep the ordering of the months and year
    if (totalMonths < monthList.length) {

        console.log('left over months')
        for (let x = totalMonths; x < monthList.length; x++) {

            let date = monthList[x] + " 2023";


            const record = await processData.getRecord({"Date": date});

            // the record does not exist
            if( record.records?.length <= 0 ){

                recordData = {
                    "records": [
                        {
                            "fields": {
                                "Date": date,
                                "Labor Force": null,
                                "Employment": null,
                                "Unemployment": null,
                                "Unemployment Rate": null,
                            }
                        }
                    ]
                };

                await processData.createRecord(recordData);

            }
        }
    }
}

getData();


const path = require('path');
const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});

const apiKey = process.env.API_KEY;
const baseId = process.env.BASE_ID;
const table = process.env.UNEMPLOYMENT_TABLE;
const blsAPIKey = process.env.BLS_API_KEY;

const monthList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const years = [2023, 2022, 2021, 2020, 2019, 2018, 2017];

const seriesIds = ["LAUCT1245000000000"]; // this is the Miami area code
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

        let totalMonths = 0;

        // for each city, go through 2017 - current year
        for(let year = 0; year < years.length; year++){

            // for each year, go through the different categories (labor force, employment, unemployment, unemp. rate)
            for(const category in measureCodes){

                const code = measureCodes[category];

                const seriesId = series+code;

                console.log(seriesId + " -- " + category);

                try{
                    const res = await axios.post(URL, {
                        "seriesid": [seriesId],
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
                    const data = res.data.Results.series[0].data;
                    // console.log(data);

                    // loop through the data
                    for(let item = 0; item < data.length; item++){

                        // console.log(item)

                        const date = new Date(data[item].periodName + " " + years[year]).toLocaleString('en-US', { month: 'short' }) + " " + years[year];
                        const value = parseFloat(data[item].value);

                        console.log(date + " " + value)

                        const record = await getRecord(date);


                        // the record exists
                        if( record.records?.length > 0 ){

                            recordData = {
                                "fields": {
                                    // "Date": date,
                                    [category]: value,

                                }
                            };

                            const id = record.records[0].id;
                            await updateRecord(recordData, id);

                            // if record does not exist
                        }else{

                            recordData = {
                                "records": [
                                    {
                                        "fields": {
                                            "Date": date,
                                            [category]: value,
                                        }
                                    }
                                ]
                            };

                            await createRecord(recordData);
                        }

                    }

                    totalMonths = data.length

                }catch (e) {
                    console.log(`API REQUEST LIMIT REACHED`);
                }

                return;

            }
        }

        await insertRestOfMonths(totalMonths);


    }
}

const insertRestOfMonths = async (totalMonths) => {

    // add the rest of the months, regardless if it BLS updated those months
    // ex. if BLS only updated Jan 2023, insert Feb-Dec in airtable
    // this is because, in air table it will keep the ordering of the months and year
    if (totalMonths < monthList.length) {

        console.log('left over months')
        for (let x = totalMonths - 1; x < monthList.length; x++) { // - 1 so we can go index based

            let date = monthList[x] + " 2023";
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

            await createRecord(recordData);
        }
    }
}

getData();



// stores each row into the airtable
const createRecord = async (recordData) => {

    const airtableURL = `https://api.airtable.com/v0/${baseId}/${table}`;

    try {
        const response = await fetch(airtableURL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recordData)
        });


        const data = await response.json();

        if (response.ok) {

            console.log('RECORD CREATED', data)
        } else {
            console.error('Failed to create record:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const updateRecord = async (recordData, id) => {

    const airtableURL = `https://api.airtable.com/v0/${baseId}/${table}/${id}`;


    try {
        const response = await fetch(airtableURL, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recordData)
        });

        const data = await response.json();

        if (response.ok) {

            console.log('RECORD UPDATED', data)
        } else {
            console.error('Failed to update record:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const getRecord = async (date)=>{

    const airtableURL = `https://api.airtable.com/v0/${baseId}/${table}?filterByFormula={Date}="${date}"`;

    try {
        const response = await fetch(airtableURL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error:', error);
    }
}


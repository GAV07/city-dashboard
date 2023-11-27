const path = require("path")
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});

const ProcessData = require('../ProcessData.js');

const baseId = process.env.BASE_ID;
const table = process.env.OVERALL_POVERTY_LEVEL_TABLE;

const processData = new ProcessData(baseId, table)


// years mapped to the time ranges
const years = new Map();
years.set('2022', '1');
years.set('2021', '5');
years.set('2020', '5');
years.set('2019', '5');
years.set('2018', '5');
years.set('2017', '5');


// poverty income levels mapped to their variables
const censusVariables = new Map(); // refer to the README for the variable documentations
censusVariables.set('Population for whom poverty status is determined', ['S1701_C01_001E', 'S1701_C02_001E', 'S1701_C03_001E']) // [estimate, below pov level, percent below]

const getIncomeLevelByHousehold = async ()=>{

    // loop through the years map for each year
    for (const [year, timeRange] of years) {

        // loop through each household income (the variables)
        for(const [title, values] of censusVariables){

            try {

                const getVariables = values.join(","); // join them by commas to format the way census requires

                const URL =`https://api.census.gov/data/${year}/acs/acs${timeRange}/subject?get=${getVariables}&for=place:45000&in=state:12&key=${process.env.CENSUS_API_KEY}`

                // fetch the data
                const response = await fetch(URL, {
                    method: 'GET'
                });

                const data = await response.json();

                const population = parseInt(data[1][0]);
                const belowPovertyLevel = parseInt(data[1][1]);
                const belowPercentLevel = parseFloat(data[1][2]);

                await sendToAirTable(year, title, population, belowPovertyLevel, belowPercentLevel);
                // console.log("REMOVE RETURN STATEMENT TO CONTINUE ALL")
                // return;

            } catch (error) {
                console.error(`Error fetching ${URL}: ${error}`);
            }

        }
    }
}

const sendToAirTable = async (year, title, population, belowPovertyLevel, belowPercentLevel)=>{

    // create the record to send to air table
    let recordData;

    const record = await processData.getRecord({"Year": year}, {"Name": title});

    // the record exists
    if( record.records?.length > 0 ){

        recordData = {
            "fields": {
                // "Name": title,
                // "Year": year,
                "Total population": parseInt(population),
                "Below poverty level": parseInt(belowPovertyLevel),
                "Percent below poverty level": parseFloat(belowPercentLevel),
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
                        "Name": title,
                        "Year": year,
                        "Total population": parseInt(population),
                        "Below poverty level": parseInt(belowPovertyLevel),
                        "Percent below poverty level": parseInt(belowPercentLevel),
                    }
                }
            ]
        };

        await processData.createRecord(recordData);
    }

}


getIncomeLevelByHousehold();

const path = require("path")
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});

const ProcessData = require('../ProcessData.js');

const baseId = process.env.BASE_ID;
const table = process.env.EMPLOYMENT_BY_INDUSTRY_TABLE;

const processData = new ProcessData(baseId, table)


// years mapped to the time ranges
const years = new Map();
years.set('2022', '1');
years.set('2021', '5');
years.set('2020', '5');
years.set('2019', '5');
years.set('2018', '5');
years.set('2017', '5');


// industries mapped to their variables
const censusVariables = new Map(); // refer to the README for the variable documentations
censusVariables.set('Agriculture, forestry, fishing and hunting, and mining', ['DP03_0033E', 'DP03_0033PE']) // [estimate, percent]
censusVariables.set('Construction', ['DP03_0034E', 'DP03_0034PE']);
censusVariables.set('Manufacturing', ['DP03_0035E', 'DP03_0035PE']);
censusVariables.set('Wholesale trade', ['DP03_0036E', 'DP03_0036PE']);
censusVariables.set('Retail trade', ['DP03_0037E', 'DP03_0037PE']);
censusVariables.set('Transportation and warehousing, and utilities', ['DP03_0038E', 'DP03_0038PE']);
censusVariables.set('Information', ['DP03_0039E', 'DP03_0039PE']);
censusVariables.set('Finance and insurance, and real estate and rental and leasing', ['DP03_0040E', 'DP03_0040PE']);
censusVariables.set('Professional, scientific, and management, and administrative and waste management services', ['DP03_0041E', 'DP03_0041PE']);
censusVariables.set('Educational services, and health care and social assistance', ['DP03_0042E', 'DP03_0042PE']);
censusVariables.set('Arts, entertainment, and recreation, and accommodation and food services', ['DP03_0043E', 'DP03_0043PE']);
censusVariables.set('Other services, except public administration', ['DP03_0044E', 'DP03_0044PE']);
censusVariables.set('Public administration', ['DP03_0045E', 'DP03_0045PE']);


const getIncomeLevelByHousehold = async ()=>{

    // loop through the years map for each year
    for (const [year, timeRange] of years) {

        // loop through each household income (the variables)
        for(const [industry, values] of censusVariables){

            try {

                const getVariables = values.join(","); // join them by commas to format the way census requires
                const URL = `https://api.census.gov/data/${year}/acs/acs${timeRange}/profile?get=${getVariables}&for=place:45000&in=state:12&key=${process.env.CENSUS_API_KEY}`

                // fetch the data
                const response = await fetch(URL, {
                    method: 'GET'
                });

                const data = await response.json();

                let population = parseInt(data[1][0]);
                let percent = parseFloat(data[1][1]);

                await sendToAirTable(year, industry, population, percent);

            } catch (error) {
                console.error(`Error fetching ${URL}: ${error}`);
            }

        }
    }
}

const sendToAirTable = async (year, industry, population, percent)=> {

    // create the record to send to air table
    let recordData;

    const record = await processData.getRecord({"Year": year}, {"Industry": industry})

    // the record exists
    if( record.records?.length > 0 ){

        recordData = {
            "fields": {
                // "Year": year,
                // "Industry": industry,
                "Population": population,
                "Percent": percent,
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
                        "Year": year,
                        "Industry": industry,
                        "Population": population,
                        "Percent": percent,
                    }
                }
            ]
        };

        await processData.createRecord(recordData);
    }
}


getIncomeLevelByHousehold();

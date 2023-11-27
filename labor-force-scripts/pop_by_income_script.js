const path = require("path")
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});

const ProcessData = require('../ProcessData.js');

const baseId = process.env.BASE_ID;
const table = process.env.INCOME_LEVEL_TABLE;

const processData = new ProcessData(baseId, table)


// years mapped to the time ranges
const years = new Map();
years.set('2022', '1');
years.set('2021', '5');
years.set('2020', '5');
years.set('2019', '5');
years.set('2018', '5');
years.set('2017', '5');


// income levels mapped to their variables
const censusVariables = new Map(); // refer to the README for the variable documentations
censusVariables.set('Less than $10,000', ['DP03_0052E', 'DP03_0052PE']) // [estimate, percent]
censusVariables.set('$10,000 to 14,999', ['DP03_0053E', 'DP03_0053PE']) // [estimate, percent]
censusVariables.set('$15,000 to 24,999', ['DP03_0054E', 'DP03_0054PE']) // [estimate, percent]
censusVariables.set('$25,000 to 34,999', ['DP03_0055E', 'DP03_0055PE']) // [estimate, percent]
censusVariables.set('$35,000 to 49,999', ['DP03_0056E', 'DP03_0056PE']) // [estimate, percent]
censusVariables.set('$50,000 to 74,999', ['DP03_0057E', 'DP03_0057PE']) // [estimate, percent]
censusVariables.set('$75,000 to 99,999', ['DP03_0058E', 'DP03_0058PE']) // [estimate, percent]
censusVariables.set('$100,000 to 149,999', ['DP03_0059E', 'DP03_0059PE']) // [estimate, percent]
censusVariables.set('$150,000 to 199,999', ['DP03_0060E', 'DP03_0060PE']) // [estimate, percent]
censusVariables.set('$200,000 or more', ['DP03_0061E', 'DP03_0061PE']) // [estimate, percent]

const getIncomeLevelByHousehold = async ()=>{

    // loop through the years map for each year
    for (const [year, timeRange] of years) {

        // loop through each household income (the variables)
        for(const [incomeLevel, values] of censusVariables){

            try {

                const getVariables = values.join(","); // join them by commas to format the way census requires
                // const URL = `https://api.census.gov/data/${year}/acs/acs${timeRange}/profile?get=${getVariables}&for=place:45000&in=state:12&key=${process.env.CENSUS_API_KEY}`
                const URL = `https://api.census.gov/data/${year}/acs/acs${timeRange}/profile?get=${getVariables}&for=place:45000&in=state:12&key=${process.env.CENSUS_API_KEY}`

                // fetch the data
                const response = await fetch(URL, {
                    method: 'GET'
                });

                const data = await response.json();

                const population = parseInt(data[1][0]);
                const percentage = parseFloat(data[1][1]);

                await sendToAirTable(parseInt(year), incomeLevel, population, percentage);
                console.log("REMOVE RETURN STATEMENT TO CONTINUE ALL")
                return;

            } catch (error) {
                console.error(`Error fetching ${URL}: ${error}`);
            }

        }
    }
}


const sendToAirTable = async (year, incomeLevel, population, percentage)=>{

    // create the record to send to air table
    let recordData;

    // const record = await getRecord(year, incomeLevel)
    const record = await processData.getRecord({"Year": year}, {"Income Level": incomeLevel})

    // the record exists
    if( record.records?.length > 0 ){

        recordData = {
            "fields": {
                // "Income Level": incomeLevel,
                "Year": year,
                "Population": population,
                "Percentage": percentage,
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
                        "Income Level": incomeLevel,
                        "Year": year,
                        "Population": population,
                        "Percentage": percentage,
                    }
                }
            ]
        };

        await processData.createRecord(recordData);
    }


}



getIncomeLevelByHousehold();

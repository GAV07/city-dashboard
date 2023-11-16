const puppeteer = require("puppeteer");

const path = require("path")
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});


const apiKey = process.env.API_KEY;
const baseId = process.env.BASE_ID;
const table = process.env.INCOME_LEVEL_TABLE;

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

                const population = data[1][0];
                const percentage = data[1][1];

                // create the record to send to air table
                let recordData;

                const record = await getRecord(year, incomeLevel)

                // the record exists
                if( record.records.length > 0 ){

                    recordData = {
                                "fields": {
                                    // "Income Level": incomeLevel,
                                    // "Year": parseInt(year),
                                    "Population": parseInt(population),
                                    "Percentage": percentage,
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
                                    "Income Level": incomeLevel,
                                    "Year": parseInt(year),
                                    "Population": parseInt(population),
                                    "Percentage": percentage,
                                }
                            }
                        ]
                    };

                    await createRecord(recordData);
                }

                console.log("REMOVE RETURN STATEMENT TO CONTINUE ALL")
                return;

            } catch (error) {
                console.error(`Error fetching ${URL}: ${error}`);
            }

        }
    }
}


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
            console.error('Failed to create record:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const getRecord = async (year, incomeLevel)=>{


    const airtableURL = `https://api.airtable.com/v0/${baseId}/${table}?filterByFormula=AND({Year} = ${year}, {Income Level} = "${incomeLevel}")`;

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



getIncomeLevelByHousehold();

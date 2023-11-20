const path = require("path")
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});

const apiKey = process.env.API_KEY;
const baseId = process.env.BASE_ID;
const table = process.env.POVERTY_EDUCATION_LEVEL_TABLE;

// years mapped to the time ranges
const years = new Map();
years.set('2022', '1');
years.set('2021', '5');
years.set('2020', '5');
years.set('2019', '5');
years.set('2018', '5');
years.set('2017', '5');


// education levels mapped to their variables
const censusVariables = new Map(); // refer to the README for the variable documentations
censusVariables.set('Less than high school graduate', ['S1701_C01_023E', 'S1701_C02_023E', 'S1701_C03_023E'])
censusVariables.set('High school graduate (includes equivalency)', ['S1701_C01_024E', 'S1701_C02_024E', 'S1701_C03_024E'])
censusVariables.set("Some college, associate's degree", ['S1701_C01_025E', 'S1701_C02_025E', 'S1701_C03_025E'])
censusVariables.set("Bachelor's degree or higher", ['S1701_C01_026E', 'S1701_C02_026E', 'S1701_C03_026E'])

const getPovertyLevelsByEducation = async ()=>{

    // loop through the years map for each year
    for (const [year, timeRange] of years) {


        // loop through each household income (the variables)
        for(const [educationLevel, values] of censusVariables){

            try {

                const getVariables = values.join(","); // join them by commas to format the way census requires

                const URL = `https://api.census.gov/data/${year}/acs/acs${timeRange}/subject?get=${getVariables}&for=place:45000&in=state:12&key=${process.env.CENSUS_API_KEY}`

                console.log(URL);

                continue;
                // fetch the data
                const response = await fetch(URL, {
                    method: 'GET'
                });

                const data = await response.json();

                // the columns/fields for airtable
                const totalPopulationEstimate = data[1][0];
                const belowPovEstimate = data[1][1];
                const percentBelowPovEstimate = data[1][2];


                // create the record to send to air table
                let recordData;

                const record = await getRecord(year, educationLevel)

                // the record exists
                if( record.records?.length > 0 ){

                    recordData = {
                        "fields": {
                            // "year": year,
                            // "Education": educationLevel,
                            "Total population": totalPopulationEstimate,
                            "Below poverty rate": parseInt(belowPovEstimate),
                            "Percent below poverty level": percentBelowPovEstimate,
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
                                    "year": year,
                                    "Education": educationLevel,
                                    "Total population": totalPopulationEstimate,
                                    "Below poverty rate": parseInt(belowPovEstimate),
                                    "Percent below poverty level": percentBelowPovEstimate,
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

const getRecord = async (year, educationLevel)=>{


    const airtableURL = `https://api.airtable.com/v0/${baseId}/${table}?filterByFormula=AND({year} = ${year}, {Education} = "${educationLevel}")`;

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


getPovertyLevelsByEducation();

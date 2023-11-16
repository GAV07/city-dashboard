const puppeteer = require("puppeteer");

const path = require("path")
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});

const years = new Map();
years.set('2022', '1');
years.set('2021', '5');
years.set('2020', '5');
years.set('2019', '5');
years.set('2018', '5');
years.set('2017', '5');


const censusVariables = new Map(); // refer to the README for the variable documentations
censusVariables.set('Less than $10,000', ['DP03_0052E', 'DP03_0052PE'])
censusVariables.set('$10,000 to 14,999', ['DP03_0053E', 'DP03_0053PE'])
censusVariables.set('$15,000 to 24,999', ['DP03_0054E', 'DP03_0054PE'])
censusVariables.set('$25,000 to 34,999', ['DP03_0055E', 'DP03_0055PE'])
censusVariables.set('$35,000 to 49,999', ['DP03_0056E', 'DP03_0056PE'])
censusVariables.set('$50,000 to 74,999', ['DP03_0057E', 'DP03_0057PE'])
censusVariables.set('$75,000 to 99,999', ['DP03_0058E', 'DP03_0058PE'])
censusVariables.set('$100,000 to 149,999', ['DP03_0059E', 'DP03_0059PE'])
censusVariables.set('$150,000 to 199,999', ['DP03_0060E', 'DP03_0060PE'])
censusVariables.set('$200,000 or more', ['DP03_0061E', 'DP03_0061PE'])

const getTotalHouseHold = async ()=>{

/*    // launches a browser
    const browser = await puppeteer.launch({headless: true});
    // opens up a page
    const page = await browser.newPage();

    // wait for the selector to load unto the page
    // await page.waitForSelector(`div[class='ag-cell'] span[class='ag-cell-wrapper']`)

    for (const [key, value] of years) {
        const URL = `https://data.census.gov/table/ACSDP${value}Y${key}.DP03?q=unemployment&g=160XX00US1245000`;

        try {
            await page.goto(URL);

            let incomeAndBenefitsSections = await page.$$(".ag-cell .ag-cell-wrapper");

            console.log(incomeAndBenefitsSections.length > 0 ? URL : "no");
            // console.log(incomeAndBenefitsSections);
        } catch (error) {
            console.error(`Error navigating to ${URL}: ${error}`);
        }
    }


    await browser.close();*/


    // loop through the years map for each year
    for (const [year, timeRange] of years) {


        // loop through each household income (the variables)
        for(const [incomeLevel, values] of censusVariables){

            try {

                const getVariables = values.join(","); // join them by commas to format the way census requires
                const URL = `https://api.census.gov/data/${year}/acs/acs${timeRange}/profile?get=${getVariables}&for=place:45000&in=state:12&key=${process.env.CENSUS_API_KEY}`

                // fetch the data
                const response = await fetch(URL, {
                    method: 'GET'
                });

                const data = await response.json();

                const population = data[1][0];
                const percentage = data[1][1];

                // create the record to send to air table
                const recordData = {
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


                console.log(recordData.records[0].fields);

            } catch (error) {
                console.error(`Error fetching ${URL}: ${error}`);
            }

        }
    }
}


// stores each row into the airtable
const createRecord = async (recordData) => {

    const apiKey = process.env.API_KEY;
    const baseId = process.env.BASE_ID;
    const table = process.env.INCOME_LEVEL_TABLE;

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

        if (response.ok) {
            // const data = await response.json();
            // console.log('Record created successfully:', data);
        } else {
            console.error('Failed to create record:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};


getTotalHouseHold();

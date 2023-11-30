const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const PDFParser = require('pdf-parse');

const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});

// GPT-Model
const {getAIResponse} = require("../tax-script/OpenAIModel.js");

const ProcessData = require('../ProcessData.js');

const baseId = process.env.BASE_ID;
const table = process.env.PROPERTY_APPRAISAL_TAXES_TABLE;

const processData = new ProcessData(baseId, table)


// const cities = ['miami'];
const cities = new Set();
cities.add('city of miami beach preliminary');


const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023]
// const years = [2023]

const propertyTypes = new Set();
propertyTypes.add('single family');
propertyTypes.add('condominium');
propertyTypes.add('multi family');
propertyTypes.add('commercial');
propertyTypes.add('industrial');
propertyTypes.add('agriculture');
propertyTypes.add('vacant land');
propertyTypes.add('institutional');
propertyTypes.add('governmental');
propertyTypes.add('other properties');
propertyTypes.add('real estate parcels');
propertyTypes.add('pers prop & cent assd');
propertyTypes.add('all assessed property');



const getTaxData = async () => {

    for (let x = 0; x < years.length; x++) {

        const pdfUrl = `https://www.miamidade.gov/pa/library/reports/${years[x]}-taxing-authority-reports.pdf`;
        const outputPath = path.join(__dirname + `/downloads/${years[x]}.pdf`);
        const splitPath = outputPath.split("\\");
        const file = splitPath[splitPath.length - 1];

        const blob = await fetch(pdfUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/pdf',
            },
        })
            .then(response => response.blob())
            .catch(error => console.error('Error:', error));


        // create a buffer from the blob
        const buffer = Buffer.from(await blob.arrayBuffer());

        // create the downloads directory
        if (!fs.existsSync(path.join(__dirname + '/downloads'))) {
            fs.mkdirSync(path.join(__dirname + '/downloads'));
        }

        // save the file to the output path
        fs.writeFileSync(outputPath, buffer);

        // makes sure the files is downloaded before closing the browser
        await waitForDownload();
        console.log(`DOWNLOADED: ${file}`);

        console.log(`READING: ${file}`);
        await readPDF(outputPath, years[x]);

        // delete the current pdf file in /downloads so the next one can start
        fs.rmSync(outputPath);
        console.log(`DELETED FILE: ${file}`)

        // console.log('REMOVE BREAK TO CONTINUE')
        // break;
    }


    // delete the downloads folder
        while( fs.existsSync(path.join(__dirname + '/downloads')) ){

            removeFilesAndDirectories(path.join(__dirname + '/downloads'));
        }

        console.log('Deleted /downloads folder');

}


// removes files and directories (/downloads)
function removeFilesAndDirectories(dirPath) {
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            const filePath = path.join(dirPath + "/" + file);
            if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            } else {
                removeFilesAndDirectories(filePath);
            }
        }

        fs.rmdirSync(dirPath);
    }
}


async function waitForDownload() {
    while (true) {

        const filePath = path.join(__dirname + '/downloads');

        if (fs.existsSync(filePath) &&
            fs.readdirSync(filePath).length > 0 &&
            !fs.readdirSync(filePath)[0].includes("crdownload") // makes sure chrome finish downloading the file
        ) {

            break; // exits the infinite loop once everything is done
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again.
    }
}


const readPDF = async (path, year) => {


    // read the pdf file
    const pdf = fs.readFileSync(path);

    // parse the pdf
    const data = await PDFParser(pdf);

    const lines = data.text.split('\n');

    // fs.writeFileSync(__dirname + '/pdfText.text', text);

    const text = data.text;

    // console.log(text);

    let left = 0;
    for(let right = 0; right < lines.length; right++){

        const cityToGet = 'city of miami preliminary';
        // const newSection = ` preliminary assessment roll values and ${year-1} comparison`;
        const newSection = `preliminary assessment roll values`;

        // console.log(lines[right] + " --- " + newSection)
        const isNewSection = lines[right].toLowerCase().includes(newSection);
        if(
            isNewSection

        ){

            if(
                lines[right].toLowerCase().includes(cityToGet)
            ){

                const cityData = lines.slice(left+1, right).join("\n");

                let AIPrompt = `For this city, generate a json for me with the values for each property type here is an example of how you should format and return it to me:
                    {
                      "Single Family": {
                        "count": 4902,
                        "justValue1": 11295133136,
                        "taxableValue1": 7625331340,
                        "justValue2": 11295133136,
                        "taxableValue2": 7625331340,
                        "taxableValueDiff": 11535594337,
                        "pct": 7.8,
                        "newCons": 235320996
                      },
                      "Condominium": {
                        "count": 42005,
                        "justValue1": 20628831192,
                        "taxableValue1": 17936307600,
                        "justValue2": 20628831192,
                        "taxableValue2": 17936307600,
                        "taxableValueDiff": 20537025655,
                        "pct": 2.6,
                        "newCons": 1020544644
                      },
                      "Multi Family": {
                        "count": 1569,
                        "justValue1": 2902223454,
                        "taxableValue1": 2292519403,
                        "justValue2": 2902223454,
                        "taxableValue2": 2292519403,
                        "taxableValueDiff": 2858369713,
                        "pct": 5.3,
                        "newCons": 11973280
                      },
                      "Commercial": {
                        "count": 6486,
                        "justValue1": 12115240958,
                        "taxableValue1": 10157112185,
                        "justValue2": 12115240958,
                        "taxableValue2": 10157112185,
                        "taxableValueDiff": 12108591557,
                        "pct": 4.3,
                        "newCons": 62575307
                      },
                      "Industrial": {
                        "count": 155,
                        "justValue1": 225632235,
                        "taxableValue1": 35927167,
                        "justValue2": 225632235,
                        "taxableValue2": 35927167,
                        "taxableValueDiff": 53204494,
                        "pct": 6.8,
                        "newCons": 0
                      },
                      "Agriculture": {
                        "count": 0,
                        "justValue1": 0,
                        "taxableValue1": 0,
                        "justValue2": 0,
                        "taxableValue2": 0,
                        "taxableValueDiff": 0,
                        "pct": 0,
                        "newCons": 0
                      },
                      "Vacant Land": {
                        "count": 1433,
                        "justValue1": 1311513960,
                        "taxableValue1": 1115819717,
                        "justValue2": 1311513960,
                        "taxableValue2": 1115819717,
                        "taxableValueDiff": 1161705343,
                        "pct": -4.6,
                        "newCons": -18623820
                      },
                      "Institutional": {
                        "count": 584,
                        "justValue1": 8136181,
                        "taxableValue1": 51041912,
                        "justValue2": 8136181,
                        "taxableValue2": 51041912,
                        "taxableValueDiff": 415586337,
                        "pct": 3.5,
                        "newCons": 0
                      },
                      "Governmental": {
                        "count": 40,
                        "justValue1": 11517218288,
                        "taxableValue1": 37893432,
                        "justValue2": 11517218288,
                        "taxableValue2": 37893432,
                        "taxableValueDiff": 1726140268,
                        "pct": -0.2,
                        "newCons": 682377
                      },
                      "Other Properties": {
                        "count": 38,
                        "justValue1": 81570692,
                        "taxableValue1": 131769285,
                        "justValue2": 81570692,
                        "taxableValue2": 131769285,
                        "taxableValueDiff": 197633479,
                        "pct": 3.1,
                        "newCons": 0
                      },
                      "Real Estate Parcels": {
                        "count": 56907,
                        "justValue1": 50412124183,
                        "taxableValue1": 39383722041,
                        "justValue2": 50412124183,
                        "taxableValue2": 39383722041,
                        "taxableValueDiff": 50593851183,
                        "pct": 4.0,
                        "newCons": 1312472784
                      },
                      "Pers Prop & Cent Assd": {
                        "count": 0,
                        "justValue1": 715170418,
                        "taxableValue1": 952522665,
                        "justValue2": 715170418,
                        "taxableValue2": 952522665,
                        "taxableValueDiff": 786345358,
                        "pct": 10.0,
                        "newCons": 0
                      },
                      "All Assessed Property": {
                        "count": 0,
                        "justValue1": 51277077181,
                        "taxableValue1": 40098892459,
                        "justValue2": 51277077181,
                        "taxableValue2": 40098892459,
                        "taxableValueDiff": 51546373848,
                        "pct": 4.1,
                        "newCons": 1312472784
                      }
                    }
                   
                                 
                    Sections 'Pers Prop Cent Assd' and 'All Assessed Property' do not have a count column/value, so default them to count:0. But do set all other properties to the rest of the value
                                        
                   strictly return the same format of the JSON example format I showed you. If you see any grammatical errors in the category type, they should be fixed and they should be title case. REMOVE ANY COMMAS FOR THE VALUE (AS THIS WILL MESS UP THE JSON). KEEP IT EXACTLY IN THE FORMAT OF THE EXAMPLE I SHOWED YOU WILL ALL THE PROPERTY NAMES AS WELL.
                   RETURN A SINGLE JSON AND NOTHING ELSE!
                `;


                let parsedData = {};

                let messageToSend = cityData + " " + AIPrompt;
                let AIResponse = await getAIResponse(messageToSend);

                let validJSON = false;

                // in the event the model did not return a single JSON but added additional text
                let attempts = 0;
                let maxAttempts = 5; // to prevent an infinite loop if the chat GPT cannot return a single JSON

                do{
                    try{

                        parsedData = JSON.parse(AIResponse.content);
                        console.log(parsedData['Single Family'].justValue1); // trying to see if it the property was added correctly
                        validJSON = true;

                    }catch (e){

                        messageToSend = cityData + " " + AIPrompt + ' make sure you are returning ONLY A SINGLE JSON not other text with it';
                        AIResponse = await getAIResponse(messageToSend);

                        attempts++;
                        console.log('Error parsing the JSON: remaining attempts: ' + maxAttempts-attempts);
                    }

                }while (!validJSON && attempts < maxAttempts)


                console.log(parsedData)

                if( !validJSON && attempts >= maxAttempts ){
                    console.log("PLEASE TRY TO UPDATE THE GPT PROMPT TO CORRECTLY RETURN A SINGLE JSON BEFORE RUNNING AGAIN");
                    return;
                }


                const propertyTypes = Object.keys(parsedData);

                for (let i = 0; i < propertyTypes.length; i++) {
                    const currentPropertyType = propertyTypes[i];


                    try {
                        const count = parseInt(parsedData[currentPropertyType].count);
                        const justValue = parseFloat(parsedData[currentPropertyType].justValue2);
                        const taxableValue = parseFloat(parsedData[currentPropertyType].taxableValue2);
                        const taxableValueDiff = parseFloat(parsedData[currentPropertyType].taxableValueDiff);
                        const pct = parseFloat(parsedData[currentPropertyType].pct);
                        const newCons = parseFloat(parsedData[currentPropertyType].newCons);

                        // console.log(count + " | " + justValue + " | " + taxableValue + " | " + taxableValueDiff + " | " + pct + " | " + newCons);
                        // send the data to airtable
                        await sendToAirTable(currentPropertyType, year, count, justValue, taxableValue, taxableValueDiff, pct, newCons);

                    } catch (e) {
                        console.log(e.message);
                        return;
                    }
                }


            }else{
                left = right;
            }

        }
    }

}


const sendToAirTable = async (propertyType, year, count, justValue, taxableValue, taxableValueDiff, pct, newCons)=>{

    const record = await processData.getRecord({"Year": year}, {"Property Type": propertyType});

    // the record exists
    if( record.records?.length > 0 ){

        recordData = {
            "fields": {
                // "Property Type": propertyType,
                // "Year": parseInt(year),
                "Count": count,
                "Just Value": justValue,
                "Taxable Value": taxableValue,
                "Taxable Value Diff": taxableValueDiff,
                "Pct": pct,
                "New Cons": newCons,
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
                        "Property Type": propertyType,
                        "Year": parseInt(year),
                        "Count": count,
                        "Just Value": justValue,
                        "Taxable Value": taxableValue,
                        "Taxable Value Diff": taxableValueDiff,
                        "Pct": pct,
                        "New Cons": newCons,
                    }
                }
            ]
        };

        await processData.createRecord(recordData);
    }

}

getTaxData();


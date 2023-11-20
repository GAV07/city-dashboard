const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const PDFParser = require('pdf-parse');

const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});


const apiKey = process.env.API_KEY;
const baseId = process.env.BASE_ID;
const table = process.env.PROPERTY_APPRAISAL_TAXES_TABLE;

const years = ['2017', '2018', '2019', '2020', '2021', '2022']

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

    for (let x = 2; x < years.length; x++) {

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
        // fs.rmSync(outputPath);
        // console.log(`DELETED FILE: ${file}`)

        console.log('REMOVE BREAK TO CONTINUE')
        break;
    }


    // delete the downloads folder
/*    while( fs.existsSync(path.join(__dirname + '/downloads')) ){

        removeFilesAndDirectories(path.join(__dirname + '/downloads'));
    }

    console.log('Deleted /downloads folder');*/

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



const correctType = (text) => {
    let correctType = "";
    const lowerText = text.toLowerCase();

    for (const propertyType of propertyTypes) {
        if (propertyType.includes(lowerText) /*&& isNaN(text) && text.length >= 3*/) {

            // replaces the text with the full property type
            correctType = propertyType.toUpperCase();
            break; // leave out of the loop once a match is found
        }
    }

    return correctType;
}


const readPDF = async (path, year) => {

    const pdfPath = path;

    // read the pdf file
    const pdf = fs.readFileSync(pdfPath);

    // parse the pdf
    const data = await PDFParser(pdf);

    const lines = data.text.split('\n');

    const splitLinesByDoubleSpace = lines.map(line => line.split("  ").map(text => text.trim()));


    let cleanedText = "";

    for(let x = 0; x < splitLinesByDoubleSpace.length; x++){

        for(let y = 0; y < splitLinesByDoubleSpace[x].length; y++){

            let text = splitLinesByDoubleSpace[x][y];
            if( text === '' || ( isNaN(parseInt(text)) && text.length === 1 ) ){
                continue;
            }

            let correctPropertyType = correctType(text.trim());
            cleanedText += ( correctPropertyType === '' ? text : correctPropertyType ) + '\n';
        }
    }

    fs.writeFileSync(__dirname + '/text.txt', cleanedText);

    let canReadSection = false;
    let propertyTypeValues = [];

    const cleanedTextLines = cleanedText.split("\n");

    const breakPoint = `${year-1} PRELIMINARY VALUES`;

    for(let x = 0; x < cleanedTextLines.length; x++){

        const line = cleanedTextLines[x];

        if (line.toLowerCase().includes(`${year} Miami-Dade County Preliminary Assessment Roll`.toLowerCase())) {
            console.log(line);
            canReadSection = true;
        }

        fs.writeFileSync(__dirname + '/text3.txt', (line + " " + propertyTypes.has(line.toLowerCase()) + "\n"), { flag: 'a'});

        if (canReadSection) {

            if( propertyTypes.has(line.toLowerCase()) ){ // property is in the set

                // these section's first column will be 0 or empty
                if (
                    line.toLowerCase() === "all assessed property" ||
                    line.toLowerCase() === "pers prop & cent assd"
                ) {
                    propertyTypeValues.push('0'); // this is for count since the space for count is stripped when doing split.('\n')
                }

                // x++; // move to the new line
                while(
                    x < cleanedTextLines.length &&
                    !propertyTypes.has(cleanedTextLines[x+1].toLowerCase()) && // not in set
                    cleanedTextLines[x].toLowerCase() !== breakPoint.toLowerCase() // is not the break point
                ){
                    propertyTypeValues.push(cleanedTextLines[x+1]);
                    x++;
                }


                // for some reason it add the breakpoint at the end
                if( line.toLowerCase() === "ALL ASSESSED PROPERTY".toLowerCase() ){
                    propertyTypeValues.pop();
                }

                if( propertyTypeValues.length > 8 ){ // sometimes the real estate values at index 1 and 2 get cut off and we have to handle that
                    mergeIndices(propertyTypeValues);
                }

                console.log(line)
                console.log(propertyTypeValues);
                // await sendToAirTable(propertyTypeValues, year, line)
                propertyTypeValues = [];

                // stop iterating through pdf once we reached the section's break point
                if(cleanedTextLines[x].toLowerCase() === breakPoint.toLowerCase() ){
                    break;
                }

            }

        }
    }


}

const mergeIndices = (array) => {
    if (array.length === 9) {

        const num1 = array[1]/*.split(',').join('')*/;
        const num2 = array[2]/*.split(',').join('')*/;

        const mergedValue = (num1 + num2).toLocaleString();

        // remove elements at indices 1 and 2
        array.splice(1, 2);

        // insert the merged value at index 1
        array.splice(1, 0, mergedValue);
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


        if (response.ok) {

            console.log('RECORD CREATED'/*, data*/)
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

            // console.log('RECORD UPDATED', data)
        } else {
            console.error('Failed to create record:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const getRecord = async (year, propertyType) => {


    // THIS IS VERY IMPORTANT IT HELPS TO ENCODE SPECIAL CHARCATERS SUCH AS &
    // HAD AN ISSUE WHERE IT KEPT THROWING AN EXCEPTION BECUASE OF 'PERS PROP & CENT ASSD'
    // AIR TABLE KEPT SAYING IT COULD NOT BE FOUND
    const encodedPropertyType = encodeURIComponent(propertyType);

    const airtableURL = `https://api.airtable.com/v0/${baseId}/${table}?filterByFormula=AND({Year} = ${year}, {Property Type} = "${encodedPropertyType}")`;


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


const sendToAirTable = async (propertyTypeValues, year, line)=>{

    // update or insert in airtable
    const record = await getRecord(year, line.toUpperCase());


    const propertyType = line.toUpperCase();
    const count = propertyTypeValues[0].split(",").join("");
    const justValue = propertyTypeValues[3];
    const taxableValue = propertyTypeValues[4];
    const taxableValueDiff = propertyTypeValues[5];
    const pct = propertyTypeValues[6];
    const newCons = propertyTypeValues[7];

    // the record exists
    if( record.records?.length > 0 ){

        recordData = {
            "fields": {
                // "Property Type": propertyType,
                // "Year": parseInt(year),
                "Count": parseInt(count),
                "Just Value": justValue,
                "Taxable Value": taxableValue,
                "Taxable Value Diff": taxableValueDiff,
                "Pct": pct,
                "New Cons": parseInt(newCons),
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
                        "Property Type": propertyType,
                        "Year": parseInt(year),
                        "Count": parseInt(count),
                        "Just Value": justValue,
                        "Taxable Value": taxableValue,
                        "Taxable Value Diff": taxableValueDiff,
                        "Pct": pct,
                        "New Cons": parseInt(newCons),
                    }
                }
            ]
        };

        await createRecord(recordData);
    }

}

getTaxData();


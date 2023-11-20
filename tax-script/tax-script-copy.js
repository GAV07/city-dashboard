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
propertyTypes.add('governmental');  // this is how it shows up when parsed
propertyTypes.add('other properties');
propertyTypes.add('real estate parcels');
propertyTypes.add('pers prop & cent assd');
propertyTypes.add('all assessed property'); // this is how it shows up when parsed

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
        // fs.rmSync(outputPath);
        // console.log(`DELETED FILE: ${file}`)

        console.log('REMOVE BREAK TO CONTINUE')
        break;
    }


    // delete the downloads folder
    /*while( fs.existsSync(path.join(__dirname + '/downloads')) ){

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

    let canReadSection = false;

    // parse the pdf
    const data = await PDFParser(pdf);


    const lines = data.text.split('\n');

    let formattedLines = "";
    lines.forEach(line => {
            // split each line by double space
            // (* some line are placed as rows and we want to place them as columns)
            const splitSpaces = line.split("  "); // split the line by 2x space

            splitSpaces.forEach((text) => {

                /*if( text.trim() === '' || ( isNaN(text.trim()) && text.trim().length === 1 ) ){ // skip empty strings and parts of property value characters that broke into a new line

                    // console.log(text.trim());
                    return;
                }*/

                if (text.trim() !== '') { // skip the empty strings

                    let fixedPropertyType = correctType(text.trim());

                    formattedLines += (fixedPropertyType === '' ? text.trim() : fixedPropertyType) + '\n';
                    console.log(fixedPropertyType === '' ? text.trim() : fixedPropertyType)
                }



            })
        }
    )

    let propertyTypeValues = [];

    // console.log(formattedLines);

    fs.writeFileSync(__dirname + '/text.txt', formattedLines);

    const splitLines = formattedLines.split('\n');

    for (let index = 0; index > splitLines.length; index++) {
        const line = splitLines[index].trim();

        // WHEN TO START GETTING VALUES - we only want to get the tax info for miami
        if (line.toLowerCase().includes(`${year} Miami-Dade County Preliminary Assessment Roll`.toLowerCase())) {
            console.log(line);
            canReadSection = true;
            continue; // skips to the next iteration
        }

        // if we're at the section for City of Miami
        if (canReadSection) {
            // WHEN TO SAVE TO AIR TABLE - arrived at new property type
            // then store what previous value we had in the array before
            // we start grabbing the other values for the next property type

            if (propertyTypes.has(line.toLowerCase())) {

                console.log(propertyTypeValues);
                console.log(line);

                propertyTypeValues = []; // reset the array

                if (
                    line.toLowerCase().includes("all assessed property") ||
                    line.toLowerCase().includes("pers prop & cent assd")
                ) {
                    propertyTypeValues.push('0'); // this is for count since the space for count is stripped when doing split.('\n')
                }
                continue;
            }

            // THIS GETS THE VALUES FOR EACH PROPERTY VALUE
            // since the pdf cuts off some of the property type's letter into a new line
            // we need to make sure that we don't take them

            const removedCommas = line.split(',').join('');
            if (
                (Number.isInteger(parseInt(removedCommas)) ||
                    line.includes('%')) && // only push valid numbers and percentages
                !line.toLowerCase().includes(`2016 PRELIMINARY VALUES`.toLowerCase()) // don't take this as well
            ) {
                propertyTypeValues.push(line);
            }

            // WHEN TO END - this is when we should stop reading from the section
            if (line.toLowerCase().includes(`2016 PRELIMINARY VALUES`.toLowerCase())) {
                canReadSection = false;
                console.log(propertyTypeValues);
                console.log(canReadSection);
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


        if (response.ok) {

            // console.log('RECORD CREATED'/*, data*/)
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

        if (response.ok) {

            // console.log('RECORD UPDATED'/*, data*/)
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


getTaxData();
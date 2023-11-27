const fs = require('fs');
const xml2js = require('xml2js');
const puppeteer = require("puppeteer");
const path = require("path")
const zlib = require("zlib")
const gunzipMaybe = require('gunzip-maybe');
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});

const ProcessData = require('../ProcessData.js');

const baseId = process.env.BASE_ID;
const table = process.env.SEC_TABLE;

const processData = new ProcessData(baseId, table)

function titleCase(str) {
    str = str.toLowerCase().split(' ');
    for (let i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
}

// get the xml data
const getXMLData = () => {

    // read the xml file
    const data = fs.readFileSync(__dirname + '/downloads/sec.xml', {encoding: 'utf8', flag: 'r'});

    console.log("Parsing xml data to json")
    // parse the xml data to json
    const parser = new xml2js.Parser();

    parser.parseString(data, async function (err, result) {

        console.log('Looping through all firms to update db');

        const firms = result.IAPDFirmSECReport.Firms[0].Firm;


        for (let x = 0; x < firms.length; x++) {

            const legalName = titleCase(firms[x].Info[0]?.$?.LegalNm?.trim()) ?? "";
            const street = firms[x].MainAddr[0]?.$?.Strt1?.trim() ?? "";
            const street2 = firms[x].MainAddr[0]?.$?.Strt2?.trim() ?? "";
            const postalCode = parseInt(firms[x].MainAddr[0]?.$?.PostlCd?.trim()) ?? "";
            const city = firms[x].MainAddr[0]?.$?.City?.trim() ?? "";
            const state = firms[x].MainAddr[0]?.$?.State?.trim() ?? "";
            const country = firms[x].MainAddr[0]?.$?.Cntry?.trim() ?? "";
            const phoneNumber = firms[x].MainAddr[0]?.$?.PhNb?.trim() ?? "";
            const firmType = firms[x].Rgstn[0]?.$?.FirmType?.trim() ?? "";
            const status = firms[x].Rgstn[0]?.$?.St?.trim() ?? "";
            const fillingDate = firms[x].Filing[0]?.$?.Dt?.trim() ?? "";
            const formVersion = firms[x].Filing[0]?.$?.FormVrsn?.trim() ?? "";

            // form
            const formInfo = firms[x].FormInfo[0];

            // part 1 of the form and its specific sections
            const part1 = formInfo.Part1A[0];
            const totalEmployees = parseInt(part1.Item5A[0]?.$?.TtlEmp?.trim()) ?? "";
            const totalRAUM = parseInt(part1.Item5F[0]?.$?.Q5F2C?.trim()) ?? "";
            const numberOfAccounts = parseInt(part1.Item5F[0]?.$?.Q5F2F?.trim()) ?? "";
            const totalAssets = parseInt(part1.Item5F[0]?.$?.Q5F3?.trim()) ?? "";


            // only get the companies in Miami
            if (city.toLowerCase() === 'miami') {

                await sendToAirTable(
                    legalName,
                    street,
                    street2,
                    postalCode,
                    city,
                    state,
                    country,
                    phoneNumber,
                    firmType, status,
                    fillingDate,
                    formVersion,
                    totalEmployees,
                    totalRAUM,
                    numberOfAccounts,
                    totalAssets
                );

            }

        }

    });

    console.log('Updated all firms to airtable');
}


const sendToAirTable = async (
    legalName,
    street,
    street2,
    postalCode,
    city,
    state,
    country,
    phoneNumber,
    firmType,status,
    fillingDate,
    formVersion,
    totalEmployees,
    totalRAUM,
    numberOfAccounts,
    totalAssets
) => {


    // create the record to send to air table
    let recordData;

    const record = await processData.getRecord({"Legal Name": legalName});

    console.log(legalName + " " + record.records?.length);

    // the record exists
    if( record.records?.length > 0 ){

        recordData = {
            "fields": {
                // "Legal Name": legalName,
                "Firm Type": firmType,
                "Status": status,
                "Date": fillingDate,
                "Total Employees": totalEmployees,
                "Total RAUM": totalRAUM,
                "Number of Accounts": numberOfAccounts,
                "City": city,
                "State": state,
                "Country": country,
                "Phone Number": phoneNumber,
                "Postal Code": postalCode,
                "Street": street,
                "Street 2": street2,
                "Filing Date": fillingDate,
                "Form Version": formVersion
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
                        "Legal Name": legalName,
                        "Firm Type": firmType,
                        "Status": status,
                        "Date": fillingDate,
                        "Total Employees": totalEmployees,
                        "Total RAUM": totalRAUM,
                        "Number of Accounts": numberOfAccounts,
                        "City": city,
                        "State": state,
                        "Country": country,
                        "Phone Number": phoneNumber,
                        "Postal Code": postalCode,
                        "Street": street,
                        "Street 2": street2,
                        "Filing Date": fillingDate,
                        "Form Version": formVersion
                    }
                }
            ]
        };

        await processData.createRecord(recordData);
    }
}

// removes files and directories (/downloads)
function removeFilesAndDirectories(dirPath) {
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            const filePath = path.join(dirPath + "/" +file);
            if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            } else {
                removeFilesAndDirectories(filePath);
            }
        }

        fs.rmdirSync(dirPath);
    }
}

// downloads the XML from te SEC site by opening
// a web browser and clicking the download button on the page
const downloadXML = async () => {

    // launches a browser
    const browser = await puppeteer.launch({headless: true});
    // opens up a page
    const page = await browser.newPage();


    // allows to set up how to download files
    const cdpsession = await page.target().createCDPSession();
    cdpsession.send("Browser.setDownloadBehavior", {behavior: "allow", downloadPath: path.resolve('./downloads')});

    // the url to go to
    await page.goto(
        'https://adviserinfo.sec.gov/compilation',
        {waitUntil: 'networkidle2'}
    );

    // grabs the first button and clicks it
    const buttons = await page.$$('p a[download=""]')
    await buttons[0].click();

    // makes sure the files is downloaded before closing the browser
    await waitForDownload();

    await browser.close();
}

// the data is compressed in .gz format so we have to decompress it
const unzipFile = async ()=>{

    const filePath = path.join(__dirname + '/downloads');

    const inputFilePath = filePath + '/' + fs.readdirSync(filePath)[0];

    const outputFilePath = filePath + '/sec.xml';

    const input = fs.createReadStream(inputFilePath);
    const output = fs.createWriteStream(outputFilePath);

    input.pipe(zlib.createUnzip()).pipe(output);

    // event listener when the decompression is done
    output.on('finish', async () => {
        console.log('File Decompressed')

        // once the decompression is done, parse the xml to json
        await getXMLData();


        const folderToDownload = path.join(__dirname + '/downloads');
        // checks if the /downloads folder was removed
        while(fs.existsSync(folderToDownload)){

            // remove the downloads folder so when the next job starts, we start clean again
            removeFilesAndDirectories(folderToDownload);

        }

        console.log('Deleted /downloads folder');

    });

}


// function that runs a while loop infinitely until the file is downloaded
// this is because if we close the browser without checking if it's downloaded
// then it may not finish saving it locally
async function waitForDownload() {
    while (true) {

        const filePath = path.join(__dirname + '/downloads');

        if (fs.existsSync(filePath) &&
            fs.readdirSync(filePath).length > 0 &&
            !fs.readdirSync(filePath)[0].includes("crdownload") // makes sure chrome finish downloading the file
        ) {

            // unzips the .gz file
            await unzipFile();
            break; // exits the infinite loop once everything is done
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again.
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
            // const data = await response.json();
            // console.log('Record created successfully:', data);
        } else {
            console.error('Failed to create record:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const main = async ()=>{

    await downloadXML(); // downloads the xml
    // await getXMLData(); // parses the xml and gets the data
}

main();

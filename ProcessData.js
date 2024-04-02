const fs = require("fs")
const path = require("path")
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});

// class to process the data that will be sent to the air table
class ProcessData{

    #API_KEY = process.env.API_KEY;
    #BASE_ID = process.env.BASE_ID; //Assuming the base id is constant, no need to pass in constructor
    #TABLE;

    constructor(table) {

        // this.#BASE_ID = baseId;
        this.#TABLE = table;
    }

    async createRecord(recordData){

        const airtableURL = `https://api.airtable.com/v0/${this.#BASE_ID}/${this.#TABLE}`;

        try {
            const response = await fetch(airtableURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.#API_KEY}`,
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

    async updateRecord(recordData, id){

        const airtableURL = `https://api.airtable.com/v0/${this.#BASE_ID}/${this.#TABLE}/${id}`;


        try {
            const response = await fetch(airtableURL, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.#API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recordData)
            });

            const data = await response.json();

            if (response.ok) {

                console.log('RECORD UPDATED', data)
            } else {
                console.error('Failed to update record:', response.statusText);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    async getRecord (params){

        let airtableURL;
        //Utilizing object keys to aid in flexibility of the getRecord method, 
        // more flexibility w/ num of params could be further implemented
        //Also moved this into the try-catch to actually catch errors thrown by a possible undefined URL

        try {

            if (Object.keys(params).length === 1) {
                airtableURL = `https://api.airtable.com/v0/${this.#BASE_ID}/${this.#TABLE}?filterByFormula={${Object.keys(params)[0]}} = "${encodeURIComponent(Object.values(params)[0])}"`;
            } else if (Object.keys(params).length === 2) {
                airtableURL = `https://api.airtable.com/v0/${this.#BASE_ID}/${this.#TABLE}?filterByFormula=AND({${Object.keys(params)[0]}} = "${encodeURIComponent(Object.values(params)[0])}", {${Object.keys(params)[1]}} = "${encodeURIComponent(Object.values(params)[1])}")`;
                console.log(airtableURL);
            }

            const response = await fetch(airtableURL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.#API_KEY}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error:', error);
            throw error; //Helping to return any trailing errors that would be missed
        }
    }

}

module.exports = ProcessData;
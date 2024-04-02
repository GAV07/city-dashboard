/* An API endpoint implementation allowing the caller to retrieve employment stats by industry and/or year
*/
exports.handler = async function (event, context) {
const ProcessData = require('../../ProcessData');
//const baseId = process.env.BASE_ID;
const table = process.env.EMPLOYMENT_BY_INDUSTRY_TABLE;

    try {
      const process = new ProcessData(table);
      const {year, industry} = event.queryStringParameters; 
      let filterParams = {}; //Adding a filtering to allow the caller to choose from one or both params
        if (year) {
            filterParams.Year = year;
        }

        if (industry) { //Need some way to allow for partial matching due to long Industry names
            filterParams.Industry = industry;
        } 

      const data =  await process.getRecord(filterParams);

        return {
            statusCode: 200,
            headers: { "content-type": "application/json" },
            body: JSON.stringify(data),
        }
      } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process request' }) };
      }
};
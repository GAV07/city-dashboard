exports.handler = async function (event, context) {
    try {
        
        // Return the formatted response
        return {
            statusCode: 200,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: "This is only an API endpoint for the labor force data. It does not return any data. Please use the other endpoints to get the data. To get all the data append .netlify/functions/all-data to the end of the URL. To get the unemployment data append .netlify/functions/unemployment to the end of the URL. To get the tax data append .netlify/functions/tax to the end of the URL. To get the sec data append .netlify/functions/sec to the end of the URL. To get the labor industry data append .netlify/functions/labor-industry to the end of the URL. To get the labor income data append .netlify/functions/labor-inc to the end of the URL. To get the labor poverty data append .netlify/functions/labor-pov to the end of the URL. To get the labor population data append .netlify/functions/labor-pop to the end of the URL. To get the labor education data append .netlify/functions/labor-edu to the end of the URL."}),
        }
      } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process request' }) };
      }
};
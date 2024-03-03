exports.handler = async function (event, context) {
    const { unemployment } = require('../../unemployment-script/unemployment-script.js');
    const { tax } = require('../../tax-script/tax-script.js');
    const { sec } = require('../../sec-script/sec-script.js');
    const { laborIndustry } = require('../../labor-force-scripts/employment-by-industry-script.js');
    const { laborInc } = require('../../labor-force-scripts/mean-median-inc-over-years-script.js');
    const { laborPov } = require('../../labor-force-scripts/overall-pov-inc-over-years-script.js');
    const { laborPop } = require('../../labor-force-scripts/pop-by-income-script.js');
    const { laborEdu } = require('../../labor-force-scripts/poverty-level-by-edu-script.js');



    try {
        // Suppose we get some data from the event object
        const requestData = parseInt(event.queryStringParameters.data, 10);
        
        // Call the functions
        const unemployment = unemployment;
        const tax = tax;
        const sec = sec;
        const laborIndustry = laborIndustry;
        const laborInc = laborInc;
        const laborPov = laborPov;
        const laborPop = laborPop;
        const laborEdu = laborEdu;
        
        // Return the formatted response
        return {
            statusCode: 200,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: "Functions successfully executed"}),
        }
      } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process request' }) };
      }
};
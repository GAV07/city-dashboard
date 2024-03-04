exports.handler = async function (event, context) {

    try {
        
        return {
            statusCode: 200,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: "This is a test showing that the API is working properly."}),
        }
      } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process request' }) };
      }
};
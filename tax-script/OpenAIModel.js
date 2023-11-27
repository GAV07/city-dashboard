let { Configuration, OpenAIApi, OpenAI } = require("openai");

const path = require("path");

const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');  // path of .env because we can only use environment variables if .env is in the root, so we need to specify it's location
dotenv.config({path: envPath});

const configuration = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// const model = 'text-embedding-ada-002';
const model = 'gpt-3.5-turbo';

const getAIResponse = async (content) => {

    const chatCompletion = await configuration.chat.completions.create(
    {
            model: model,
            messages: [{ role: "user", content: content }],
        }
    );

    let message = chatCompletion.choices[0].message;

    return message;
};

module.exports = { getAIResponse };

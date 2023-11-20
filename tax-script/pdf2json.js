const fs = require('fs');
const PDFParser = require('pdf2json');

const pdfPath = __dirname + '/downloads/2020.pdf';

let pdfParser = new PDFParser(null, 1);

pdfParser.on('pdfParser_dataError', errData =>
    console.error('Error while parsing PDF:', errData.parserError)
);

pdfParser.on('pdfParser_dataReady', pdfData => {
    console.log('Parsed PDF Data:', pdfParser.getRawTextContent());
    fs.writeFileSync("./content.txt", pdfParser.getRawTextContent());
});

// Read the PDF file and start parsing
const pdfBuffer = fs.readFileSync(pdfPath);
pdfParser.parseBuffer(pdfBuffer);

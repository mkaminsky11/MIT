var fs = require('fs');
var PDFParser = require("pdf2json");

var pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFile("F1040EZ.json", JSON.stringify(pdfData));
});

pdfParser.loadPDF("./plans/62_2.pdf");
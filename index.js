const browserObject = require('./browser');
const scraperController = require('./pageController');
const XLSX = require('xlsx')

//Start the browser and create a browser instance
let browserInstance = browserObject.startBrowser();

// Pass the browser instance to the scraper controller
const workbook = XLSX.readFile('in.xlsx',  {
    type: 'binary',
    cellDates: true,
    cellNF: false,
    cellText: false
});
const sheet_name_list = workbook.SheetNames;
const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

scraperController(browserInstance, xlData)
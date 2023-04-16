const pageScraper = require('./pageScraper');

async function scrapeAll(browserInstance, xlData){
	let browser;
	try{
		browser = await browserInstance;
		await pageScraper.scraper(browser, xlData);	
		
	}
	catch(err){
		console.log("Не могу создать экземпляр браузера => ", err);
	}
}

module.exports = (browserInstance, xlData) => scrapeAll(browserInstance, xlData)
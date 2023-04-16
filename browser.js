const puppeteer = require('puppeteer');

async function startBrowser(){
	let browser;
	try {
	    console.log("Opening the browser......");
	    browser = await puppeteer.launch({
	        headless: false,
	        args: ["--disable-setuid-sandbox", `--window-size=1920,1080`],
	        'ignoreHTTPSErrors': true,
			defaultViewport: {
				width: 1920,
				height: 1080
			}
	    });
	} catch (err) {
	    console.log("Не могу создать браузер => : ", err);
	}
	return browser;
}

module.exports = {
	startBrowser
};
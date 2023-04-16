const XLSX = require('xlsx');

const saveFile = (result) => {
    const worksheet = XLSX.utils.json_to_sheet(result);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Люди");

    const phones_width = result.reduce((w, person) => Math.max(w, person['Номера Телефонов']?.length || 10), 10);
    const fio_width = result.reduce((w, person) => Math.max(w, person['ФИО - группа'].length), 10);
    const address_width = result.reduce((w, person) => Math.max(w, person['Адрес места жительства'].length), 10);

    worksheet["!cols"] = [ { wch: fio_width }, { wch: address_width }, { wch: phones_width } ];
    XLSX.writeFile(workbook, 'out.xlsx');
}

const parseHome = (address) => {
    const regexStreet = /\s[А-Я]{3,}\s/g;
    const regexHome = /\sд\.\s\d{1,}\s?[А-Я]?/g;
    const regexFlat = /\sкв\.\s\d{1,}\s?[А-Я]?/g;

    const streetName = address.match(regexStreet).join(' ').trim();
    const homeNumber = address.match(regexHome).join().trim().slice(2);
    const flatNumber = address.match(regexFlat).join().trim().slice(3);
        return {
            streetName,
            flatNumber,
            homeNumber
        }
}

const filterIndentical = (result) => {
    return result.filter(
        (obj, index) =>
        result.findIndex(
            (item) => item['Номера Телефонов'] === obj['Номера Телефонов'] && item['ФИО - группа'] === obj['ФИО - группа']
          ) === index
      )
}

const joinPeopleWithNumbers = (result) => {
     result.forEach((person, personIndex) => {
        const cloneIndex = result.findIndex((clone, cloneIndex) => clone['ФИО - группа'] === person['ФИО - группа'] && personIndex !== cloneIndex);

        if (cloneIndex !== -1) {
            person['Номера Телефонов'] = person['Номера Телефонов'] + ';\n' + result[cloneIndex]['Номера Телефонов'];
            result.splice(cloneIndex, 1);
        }
    });

    return result;
}

const addDateBirth = (addressData, searchRow) => {
    const personIndex = addressData.findIndex(person => searchRow['ФИО - группа'].toUpperCase() === person['ФИО - группа']);
    if ( personIndex !== -1 ) {
        addressData[personIndex]['Дата рождения'] = new Date(searchRow['Дата рождения']).toLocaleDateString("en-GB");
    } else {
        addressData.push({
            ['ФИО - группа']: searchRow['ФИО - группа'].toUpperCase(),
            ['Адрес места жительства']: searchRow['Адрес места жительства'],
            ['Дата рождения']: new Date(searchRow['Дата рождения']).toLocaleDateString("en-GB")
        })
    }
}

const scraperObject = {
	url: 'https://to.domspravka.com/vladivostok/',
	async scraper(browser, searchData){
		let page = await browser.newPage();
		console.log(`Идем по адресу ${this.url}...`);

        const parseAddress = async (searchRow) => {
            await page.goto(this.url);
            // Wait for the required DOM to be rendered
            await page.waitForSelector('.wrapper');

            const address = parseHome(searchRow['Адрес места жительства']);

            if (address) {
                await page.type('input[name=st]', String(address.streetName));
                await page.type('input[name=dom]', String(address.homeNumber));
                await page.type('input[name=nkv]', String(address.flatNumber));
                await page.click('.button.search-button');
                await page.waitForSelector('.people');
        
                let peopleData = await page.$$eval('.rounded tr td', cells => {
                    let rows = [];
                    let cellsContent =  cells.map(c => c.textContent);
                    let count = cellsContent.length - 1;
        
                    while (count > 0) {
                        rows.push({
                            ['ФИО - группа']: cellsContent[count - 1],
                            ['Адрес места жительства']: cellsContent[count],
                            ['Номера Телефонов']: cellsContent[count - 2],
                        });

                        count = count - 3;
                    }
        
                    return rows;
                });

                return peopleData;
            } else {
                return [];
            }
            
        }

        let result = [];

        for (searchRow of searchData) {
            let addressData = await parseAddress(searchRow);

            addDateBirth(addressData, searchRow);

            result = [...result, ...addressData];
        }

        const filterIndenticalResult = filterIndentical(result)
        const res = joinPeopleWithNumbers(filterIndenticalResult);

        saveFile(res);

        console.log(`Файл сохранён out.xlsx`);
        browser.close();
	}
}

module.exports = scraperObject;
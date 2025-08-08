const puppeteer = require('puppeteer');

async function searchSumashTech(model) {
    console.log(`\n🔍 [SumashTech] Searching for: "${model}"`);

    const browser = await puppeteer.launch({ headless: true });  // Headless mode (no browser UI)
    const page = await browser.newPage();
    await page.goto('https://www.sumashtech.com/category/phone', { waitUntil: 'networkidle2' });

    // ✅ Updated selector
    await page.waitForSelector('input.filterInput[placeholder="Please specify the product you are looking for"]');
    await page.type('input.filterInput[placeholder="Please specify the product you are looking for"]', model, { delay: 100 });

    // ✅ Press Enter instead of clicking search button
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await autoScroll(page);
    await new Promise(resolve => setTimeout(resolve, 3000));

    const productLink = await page.evaluate((model) => {
        const cards = Array.from(document.querySelectorAll('.product__content'));
        const searchTerm = model.trim().toLowerCase().replace(/\s+/g, ' ');
        for (const card of cards) {
            const title = card.querySelector('.product__title')?.innerText.trim().toLowerCase().replace(/\s+/g, ' ');
            if (title && title.includes(searchTerm)) {
                return card.querySelector('a')?.href || null;
            }
        }
        return null;
    }, model);

    if (!productLink) {
        await browser.close();
        return { found: false };
    }

    await page.goto(productLink, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1.product__title', { timeout: 10000 });

    const data = await page.evaluate(() => {
        return {
            title: document.querySelector('h1.product__title')?.innerText?.trim() || '',
            subTitle: document.querySelector('.product__sub_title')?.innerText?.trim() || '',
            salePrice: document.querySelector('.product__sale_price b')?.innerText?.trim() || '',
            regularPrice: document.querySelector('.product__regular_price')?.innerText?.trim() || '',
            shortDesc: document.querySelector('.product__short_description')?.innerText?.trim() || '',
            status: document.querySelector('.stock-status + b')?.innerText?.trim() || '',
            sku: document.querySelector('.sku-status + b')?.innerText?.trim() || '',
            image: document.querySelector('.selected__image')?.src || ''
        };
    });

    await browser.close();
    return { found: true, ...data, link: productLink };
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise(resolve => {
            let totalHeight = 0;
            const distance = 500;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 300);
        });
    });
}

module.exports = { searchSumashTech };

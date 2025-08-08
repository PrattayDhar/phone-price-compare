const puppeteer = require('puppeteer');

async function searchAppleGadgets(model) {
    console.log(`\n🔍 [AppleGadgets] Searching for: "${model}"`);

    const browser = await puppeteer.launch({ headless: true });  // Headless mode (no browser UI)
    const page = await browser.newPage();

    const searchUrl = `https://www.applegadgetsbd.com/search?query=${encodeURIComponent(model)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    // Close popup if present
    try {
        await page.waitForSelector('button.absolute.top-2\\.5.right-2\\.5', { timeout: 5000 });
        await page.click('button.absolute.top-2\\.5.right-2\\.5');
        console.log('✅ Popup closed');
    } catch {
        console.log('⚠️ No popup detected');
    }

    // Scroll to load all products
    await autoScroll(page);

    // Wait for product cards
    await page.waitForSelector('article.group', { timeout: 10000 });

    // Scrape product list with title, link, price, image
    const products = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('article.group')).map(article => {
            const title = article.querySelector('p.px-3.md\\:px-4.text-sm.md\\:text-xl.text-gray-900.leading-6.font-semibold.line-clamp-2')?.innerText.trim() || '';
            const link = article.querySelector('a')?.href || '';
            // UPDATED price selector:
            const price = article.querySelector('span.text-base')?.innerText.trim() || '';
            const image = article.querySelector('img.object-cover')?.src || '';
            return { title, link, price, image };
        });
    });

    // Normalize for matching
    const normalize = str => str.toLowerCase().replace(/\s+/g, ' ').trim();
    const searchTerm = normalize(model);

    // Find best product match:
    const match = products.find(p =>
        normalize(p.title).includes(searchTerm) ||
        searchTerm.split(' ').every(word => normalize(p.title).includes(word))
    );

    if (!match) {
        console.log(`❌ [AppleGadgets] No matching product found for "${model}"`);
        await browser.close();
        return { found: false };
    }

    console.log(`✅ Matched product: ${match.title} - ${match.price}`);

    await browser.close();

    // Return only necessary data
    return {
        found: true,
        title: match.title,
        price: match.price,
        image: match.image,
        link: match.link
    };
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

module.exports = { searchAppleGadgets };

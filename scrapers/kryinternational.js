const puppeteer = require('puppeteer');

async function searchKryInternational(model) {
    console.log(`\n🔍 [KryInternational] Searching for: "${model}"`);

    const browser = await puppeteer.launch({ headless: true });  // Headless mode (no browser UI)
    const page = await browser.newPage();

    const searchUrl = `https://kryinternational.com/products?search=${encodeURIComponent(model)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    await page.waitForSelector('.relative.group.bg-white.shadow-lg', { timeout: 10000 });

    const domain = 'https://kryinternational.com';

    const products = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.relative.group.bg-white.shadow-lg')).map(card => {
            const linkPartial = card.querySelector('a')?.getAttribute('href') || '';
            const link = linkPartial.startsWith('http') ? linkPartial : 'https://kryinternational.com' + linkPartial;

            const title = card.querySelector('h3')?.innerText.trim() || '';
            const price = card.querySelector('h2 span.font-bold')?.innerText.trim() || '';
            const image = card.querySelector('a div.relative img')?.src || '';

            return { title, link, price, image };
        });
    });

    await browser.close();

    const normalize = str => str.toLowerCase().replace(/\s+/g, ' ').trim();
    const searchTerm = normalize(model);

    // Match only if title equals searchTerm exactly OR
    // title starts with searchTerm followed by nothing or only allowed small words (like 'series', 'edition') optionally
    const matched = products.find(p => {
        const title = normalize(p.title);

        // exact match
        if (title === searchTerm) return true;

        // title starts with searchTerm + only allows these suffix words (optional)
        const suffixAllowed = ['series', 'edition'];
        if (title.startsWith(searchTerm + ' ')) {
            const suffix = title.slice(searchTerm.length).trim().split(' ')[0];
            if (suffixAllowed.includes(suffix)) return true;
        }

        return false;
    });


    // Clean price to digits only for comparison later
    const cleanPrice = (str) => {
        const digits = str.replace(/[^\d]/g, '');
        return digits ? digits : null;
    };

    // Return structured single product object
    const result = {
        found: true,
        title: matched.title,
        link: matched.link,
        price: matched.price,
        salePrice: matched.price,  // you can separate if there's sale price element later
        image: matched.image,
        site: 'KryInternational'
    };

    console.log(`✅ [KryInternational] Matched product:`, result);
    return result;
}

module.exports = { searchKryInternational };

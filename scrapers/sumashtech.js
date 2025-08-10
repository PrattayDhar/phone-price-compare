const axios = require('axios');
const cheerio = require('cheerio');

async function searchSumashTech(model) {
    console.log(`\n🔍 [SumashTech] Searching for: "${model}"`);

    try {
        // Step 1: Search page request
        const searchUrl = `https://www.sumashtech.com/search?query=${encodeURIComponent(model)}`;
        const { data: searchHtml } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(searchHtml);

        const products = [];
        $('.product__content').each((_, card) => {
            const title = $(card).find('.product__title').text().trim();
            const linkPartial = $(card).find('a').attr('href') || '';
            const link = linkPartial.startsWith('http')
                ? linkPartial
                : `https://www.sumashtech.com${linkPartial}`;
            products.push({ title, link });
        });

        if (!products.length) {
            console.log(`❌ [SumashTech] No products found in search`);
            return { found: false };
        }

        // Step 2: Match product by name
        const normalize = str => str.toLowerCase().replace(/\s+/g, ' ').trim();
        const searchTerm = normalize(model);
        const matched = products.find(p => normalize(p.title).includes(searchTerm));

        if (!matched) {
            console.log(`❌ [SumashTech] No exact match for "${model}"`);
            return { found: false };
        }

        // Step 3: Get product details page
        const { data: productHtml } = await axios.get(matched.link, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $$ = cheerio.load(productHtml);

        const result = {
            found: true,
            title: $$('.product__title').text().trim(),
            subTitle: $$('.product__sub_title').text().trim(),
            salePrice: $$('.product__sale_price b').text().trim(),
            regularPrice: $$('.product__regular_price').text().trim(),
            shortDesc: $$('.product__short_description').text().trim(),
            status: $$('.stock-status + b').text().trim(),
            sku: $$('.sku-status + b').text().trim(),
            image: $$('.selected__image').attr('src') || '',
            link: matched.link,
            site: 'SumashTech'
        };

        console.log(`✅ [SumashTech] Matched product:`, result);
        return result;

    } catch (error) {
        console.error(`❌ [SumashTech] Error:`, error.message);
        return { found: false, error: error.message };
    }
}

module.exports = { searchSumashTech };

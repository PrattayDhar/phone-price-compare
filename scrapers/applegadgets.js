const axios = require('axios');
const cheerio = require('cheerio');

async function searchKryInternational(model) {
    console.log(`\n🔍 [KryInternational] Searching for: "${model}"`);

    try {
        const searchUrl = `https://kryinternational.com/products?search=${encodeURIComponent(model)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' } // helps prevent blocking
        });
        const $ = cheerio.load(data);

        const products = [];
        $('.relative.group.bg-white.shadow-lg').each((_, card) => {
            const linkPartial = $(card).find('a').attr('href') || '';
            const link = linkPartial.startsWith('http')
                ? linkPartial
                : `https://kryinternational.com${linkPartial}`;

            const title = $(card).find('h3').text().trim();
            const price = $(card).find('h2 span.font-bold').text().trim();
            const imagePartial = $(card).find('a div.relative img').attr('src') || '';
            const image = imagePartial.startsWith('http')
                ? imagePartial
                : `https://kryinternational.com${imagePartial}`;

            products.push({ title, link, price, image });
        });

        if (!products.length) {
            console.log(`❌ [KryInternational] No products found in HTML`);
            return { found: false };
        }

        // Normalize for matching
        const normalize = str => str.toLowerCase().replace(/\s+/g, ' ').trim();
        const searchTerm = normalize(model);
        const suffixAllowed = ['series', 'edition'];

        const matched = products.find(p => {
            const title = normalize(p.title);
            if (title === searchTerm) return true;
            if (title.startsWith(searchTerm + ' ')) {
                const suffix = title.slice(searchTerm.length).trim().split(' ')[0];
                if (suffixAllowed.includes(suffix)) return true;
            }
            return false;
        });

        if (!matched) {
            console.log(`❌ [KryInternational] No exact match for "${model}"`);
            return { found: false };
        }

        // Clean price for numeric comparison
        const cleanPrice = str => {
            const digits = str.replace(/[^\d]/g, '');
            return digits ? parseInt(digits, 10) : null;
        };

        const result = {
            found: true,
            title: matched.title,
            link: matched.link,
            price: matched.price,
            salePrice: matched.price,
            priceNumber: cleanPrice(matched.price),
            image: matched.image,
            site: 'KryInternational'
        };

        console.log(`✅ [KryInternational] Matched product:`, result);
        return result;

    } catch (error) {
        console.error(`❌ [KryInternational] Error:`, error.message);
        return { found: false, error: error.message };
    }
}

module.exports = { searchKryInternational };

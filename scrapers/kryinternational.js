const axios = require('axios');
const cheerio = require('cheerio');

async function searchKryInternational(model) {
    console.log(`\n🔍 [KryInternational] Searching for: "${model}"`);

    const searchUrl = `https://kryinternational.com/products?search=${encodeURIComponent(model)}`;
    const { data } = await axios.get(searchUrl);
    const $ = cheerio.load(data);

    const products = [];
    $('.relative.group.bg-white.shadow-lg').each((_, card) => {
        const linkPartial = $(card).find('a').attr('href') || '';
        const link = linkPartial.startsWith('http')
            ? linkPartial
            : `https://kryinternational.com${linkPartial}`;

        const title = $(card).find('h3').text().trim();
        const price = $(card).find('h2 span.font-bold').text().trim();
        const image = $(card).find('a div.relative img').attr('src') || '';

        products.push({ title, link, price, image });
    });

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
        console.log(`❌ [KryInternational] No match found for "${model}"`);
        return { found: false };
    }

    const result = {
        found: true,
        title: matched.title,
        link: matched.link,
        price: matched.price,
        salePrice: matched.price,
        image: matched.image,
        site: 'KryInternational'
    };

    console.log(`✅ [KryInternational] Matched product:`, result);
    return result;
}

module.exports = { searchKryInternational };

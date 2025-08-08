// index.js
const express = require('express');
const cors = require('cors');
const { searchSumashTech } = require('./scrapers/sumashtech');
const { searchAppleGadgets } = require('./scrapers/applegadgets');
const { searchKryInternational } = require('./scrapers/kryinternational');
const { getCheapest, cleanPrice } = require('./utils/compare');

const app = express();
app.use(cors());

// Define supported scrapers to make it scalable
const scrapers = [
    { site: 'SumashTech', fn: searchSumashTech },
    { site: 'AppleGadgets', fn: searchAppleGadgets },
    { site: 'KryInternational', fn: searchKryInternational }
];

app.get('/search', async (req, res) => {
    const { model } = req.query;
    if (!model) return res.status(400).json({ error: 'Phone model required' });

    const results = [];

    try {
        // Run all scrapers in parallel
        const scrapes = await Promise.allSettled(scrapers.map(scraper => scraper.fn(model)));

        scrapes.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.found) {
                results.push({ ...result.value, site: scrapers[index].site });
            }
        });

        if (results.length === 0) {
            return res.json({ found: false, message: 'No matching product on any site.' });
        }

        const recommended = getCheapest(results);

        const comparison = results.map(item => ({
            site: item.site,
            title: item.title,
            price: cleanPrice(item.salePrice || item.price)
        })).sort((a, b) => a.price - b.price);

        return res.json({ found: true, results, recommended, comparison });
    } catch (err) {
        console.error('❌ Error:', err);
        res.status(500).json({ error: 'Scraping failed', details: err.message });
    }
});




app.listen(3000, () => {
    console.log('\n🚀 Server running at http://localhost:3000');
});

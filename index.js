const express = require('express');
const cors = require('cors');
const path = require('path');
const { searchSumashTech } = require('./scrapers/sumashtech');
const { searchAppleGadgets } = require('./scrapers/applegadgets');
const { searchKryInternational } = require('./scrapers/kryinternational');
const { getCheapest, cleanPrice } = require('./utils/compare');

const app = express();
app.use(cors());

// If you want to serve frontend from here, uncomment below:
// app.use(express.static(path.join(__dirname, 'public')));

const scrapers = [
    { site: 'SumashTech', fn: searchSumashTech },
    { site: 'AppleGadgets', fn: searchAppleGadgets },
    { site: 'KryInternational', fn: searchKryInternational }
];

// Basic root route (optional)
app.get('/', (req, res) => {
    res.send('📱 Phone Price Comparison API is running!');
});

app.get('/search', async (req, res) => {
    const { model } = req.query;
    if (!model) return res.status(400).json({ error: 'Phone model required' });

    const results = [];

    try {
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

// Use PORT environment variable or 3000 locally
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`\n🚀 Server running at http://localhost:${port}`);
});

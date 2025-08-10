// const express = require('express');
// const cors = require('cors');
// const { searchSumashTech } = require('./scrapers/sumashtech');
// const { searchAppleGadgets } = require('./scrapers/applegadgets');
// const { searchKryInternational } = require('./scrapers/kryinternational');
// const { getCheapest, cleanPrice } = require('./utils/compare');

// const app = express();
// app.use(cors());

// const scrapers = [
//     { site: 'SumashTech', fn: searchSumashTech },
//     { site: 'AppleGadgets', fn: searchAppleGadgets },
//     { site: 'KryInternational', fn: searchKryInternational }
// ];

// app.get('/search', async (req, res) => {
//     const { model } = req.query;
//     if (!model) return res.status(400).json({ error: 'Phone model required' });

//     const results = [];

//     try {
//         const scrapes = await Promise.allSettled(scrapers.map(scraper => scraper.fn(model)));

//         scrapes.forEach((result, index) => {
//             if (result.status === 'fulfilled' && result.value.found) {
//                 results.push({ ...result.value, site: scrapers[index].site });
//             }
//         });

//         if (results.length === 0) {
//             return res.json({ found: false, message: 'No matching product on any site.' });
//         }

//         const recommended = getCheapest(results);

//         const comparison = results.map(item => ({
//             site: item.site,
//             title: item.title,
//             price: cleanPrice(item.salePrice || item.price)
//         })).sort((a, b) => a.price - b.price);

//         return res.json({ found: true, results, recommended, comparison });
//     } catch (err) {
//         console.error('❌ Error:', err);
//         res.status(500).json({ error: 'Scraping failed', details: err.message });
//     }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`\n🚀 Server running at http://localhost:${PORT}`);
// });
const express = require('express');
const cors = require('cors');
const path = require('path'); // Import path module
const { searchSumashTech } = require('./scrapers/sumashtech');
const { searchAppleGadgets } = require('./scrapers/applegadgets');
const { searchKryInternational } = require('./scrapers/kryinternational');
const { getCheapest, cleanPrice } = require('./utils/compare');

const app = express();
app.use(cors());

// CHANGE 1: Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

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
        const scrapes = await Promise.allSettled(scrapers.map(scraper => scraper.fn(model)));

        scrapes.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.found) {
                results.push({ ...result.value, site: scrapers[index].site });
            } else if (result.status === 'rejected') {
                console.error(`Scraper for ${scrapers[index].site} failed:`, result.reason);
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

// Serve the main HTML file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
});
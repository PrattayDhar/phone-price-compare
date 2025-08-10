const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const fs = require('fs');

const { searchSumashTech } = require('./scrapers/sumashtech');
const { searchAppleGadgets } = require('./scrapers/applegadgets');
const { searchKryInternational } = require('./scrapers/kryinternational');
const { getCheapest, cleanPrice } = require('./utils/compare');

const app = express();

console.log('Server started. __dirname:', __dirname);

const publicPath = path.join(__dirname, 'public');
console.log('Public folder path:', publicPath);
console.log('Does public folder exist?', fs.existsSync(publicPath));

if (fs.existsSync(publicPath)) {
    console.log('Public folder contents:', fs.readdirSync(publicPath));
} else {
    console.error('Public folder NOT found! Make sure it is committed and deployed correctly.');
}

app.use(cors());

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "blob:", "'unsafe-inline'", "https://infird.com"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
            },
        },
    })
);

// Serve static files from public folder
app.use(express.static(publicPath));

const scrapers = [
    { site: 'SumashTech', fn: searchSumashTech },
    { site: 'AppleGadgets', fn: searchAppleGadgets },
    { site: 'KryInternational', fn: searchKryInternational }
];

app.get('/search', async (req, res) => {
    const { model } = req.query;
    if (!model) {
        return res.status(400).json({ error: 'Phone model required' });
    }

    try {
        const scrapes = await Promise.allSettled(scrapers.map(s => s.fn(model)));
        const results = [];

        scrapes.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.found) {
                results.push({ ...result.value, site: scrapers[index].site });
            } else if (result.status === 'rejected') {
                console.error(`❌ ${scrapers[index].site} scraper failed:`, result.reason);
            }
        });

        if (!results.length) {
            return res.json({ found: false, message: 'No matching product on any site.' });
        }

        const recommended = getCheapest(results);
        const comparison = results
            .map(item => ({
                site: item.site,
                title: item.title,
                price: cleanPrice(item.salePrice || item.price)
            }))
            .sort((a, b) => a.price - b.price);

        return res.json({ found: true, results, recommended, comparison });
    } catch (err) {
        console.error('❌ Error:', err);
        return res.status(500).json({ error: 'Scraping failed', details: err.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running locally at http://localhost:${PORT}`);
});

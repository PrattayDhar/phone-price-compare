const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); // Import helmet middleware for security headers

// Import your scraping and utility functions
const { searchSumashTech } = require('./scrapers/sumashtech');
const { searchAppleGadgets } = require('./scrapers/applegadgets');
const { searchKryInternational } = require('./scrapers/kryinternational');
const { getCheapest, cleanPrice } = require('./utils/compare');

const app = express();

// Use CORS to allow cross-origin requests from your front-end
app.use(cors());

// Add the helmet middleware to set various security headers.
// We configure Content-Security-Policy (CSP) specifically to fix your error.
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                // Allows resources to be loaded from the same origin ('self')
                defaultSrc: ["'self'"],
                // Specifically allows scripts from the same origin and from 'blob:' URLs
                // The 'blob:' part is the key fix for your error
                scriptSrc: ["'self'", "blob:"],
                // Allows stylesheets from the same origin and inline styles (if needed)
                styleSrc: ["'self'", "'unsafe-inline'"],
                // Allows images from the same origin and 'data:' URLs (e.g., base64 images)
                imgSrc: ["'self'", "data:"],
                // Allows connections (fetch, XHR) to the same origin
                connectSrc: ["'self'"],
            },
        },
    })
);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define the scraper functions with their corresponding site names
const scrapers = [
    { site: 'SumashTech', fn: searchSumashTech },
    { site: 'AppleGadgets', fn: searchAppleGadgets },
    { site: 'KryInternational', fn: searchKryInternational }
];

// Define the API endpoint for searching phone models
app.get('/search', async (req, res) => {
    const { model } = req.query;
    if (!model) {
        return res.status(400).json({ error: 'Phone model required' });
    }

    const results = [];

    try {
        // Use Promise.allSettled to run all scrapers in parallel without stopping
        // if one of them fails.
        const scrapes = await Promise.allSettled(scrapers.map(scraper => scraper.fn(model)));

        // Process the results from each scraper
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

        // Find the cheapest phone among the results
        const recommended = getCheapest(results);

        // Format the comparison data and sort by price
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

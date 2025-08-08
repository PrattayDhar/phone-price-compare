// utils/compare.js
function cleanPrice(priceStr) {
    if (typeof priceStr !== 'string') return Infinity;  // Return Infinity if no valid price
    const cleaned = priceStr.replace(/[^\d]/g, '');
    return cleaned ? Number(cleaned) : Infinity;
}

function getCheapest(products) {
    return products.reduce((lowest, current) => {
        const currentPrice = cleanPrice(current.salePrice || current.price || '');
        const lowestPrice = cleanPrice(lowest.salePrice || lowest.price || '');
        return currentPrice < lowestPrice ? current : lowest;
    });
}

module.exports = { cleanPrice, getCheapest };
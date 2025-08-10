function cleanPrice(priceStr) {
    if (typeof priceStr !== 'string') return Infinity;  // Return Infinity if no valid price
    const cleaned = priceStr.replace(/[^\d]/g, '');
    return cleaned ? Number(cleaned) : Infinity;
}

function getCheapest(products) {
    return products.reduce((lowest, current) => {
        // Prefer priceNumber if available, else fallback to cleaned price string
        const currentPrice = typeof current.priceNumber === 'number' ? current.priceNumber : cleanPrice(current.salePrice || current.price || '');
        const lowestPrice = typeof lowest.priceNumber === 'number' ? lowest.priceNumber : cleanPrice(lowest.salePrice || lowest.price || '');
        return currentPrice < lowestPrice ? current : lowest;
    });
}

module.exports = { cleanPrice, getCheapest };

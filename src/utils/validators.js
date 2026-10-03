export function parsePrice(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    const s = String(value).trim();
    return /^\d{1,10}(\.\d{1,2})?$/.test(s) ? s : null;
}

export function parseStock(value) {
    return Number.isInteger(value) && value >= 0 ? value : null;
}
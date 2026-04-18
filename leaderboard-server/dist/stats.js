export function sortedNumbers(values) {
    return [...values].sort((a, b) => a - b);
}
export function mean(values) {
    if (values.length === 0)
        return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
}
export function median(sorted) {
    if (sorted.length === 0)
        return null;
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}
/** Linear interpolation quantile (type-7), q in [0, 1]. */
export function quantile(sorted, q) {
    if (sorted.length === 0)
        return null;
    if (q <= 0)
        return sorted[0];
    if (q >= 1)
        return sorted[sorted.length - 1];
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi)
        return sorted[lo];
    return sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo]);
}
export function standardDeviation(values, m) {
    if (values.length < 2)
        return null;
    const v = values.reduce((acc, x) => acc + (x - m) * (x - m), 0) / (values.length - 1);
    return Math.sqrt(v);
}
/** Percentile rank of value in sorted ascending array: fraction of scores strictly below. */
export function percentileRank(sorted, value) {
    if (sorted.length === 0)
        return 0;
    let below = 0;
    for (const s of sorted) {
        if (s < value)
            below++;
        else
            break;
    }
    return below / sorted.length;
}
export function histogram(sorted, binCount) {
    if (sorted.length === 0)
        return null;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    if (min === max) {
        return {
            min,
            max,
            bins: [{ start: min, end: max, count: sorted.length }],
        };
    }
    const bins = [];
    const width = (max - min) / binCount;
    for (let i = 0; i < binCount; i++) {
        const start = min + i * width;
        const end = i === binCount - 1 ? max : min + (i + 1) * width;
        bins.push({ start, end, count: 0 });
    }
    for (const v of sorted) {
        let idx = Math.min(binCount - 1, Math.floor((v - min) / width));
        if (idx < 0)
            idx = 0;
        bins[idx].count++;
    }
    return { min, max, bins };
}

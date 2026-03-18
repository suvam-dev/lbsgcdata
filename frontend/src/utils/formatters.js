export const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n;
export const pct = (a, b) => b === 0 ? "0%" : `${((a/b)*100).toFixed(1)}%`;

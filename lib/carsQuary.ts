export function parseNumber(v: string | null, fallback?: number) {
    if (!v) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  
  export function normalizeText(v: string | null) {
    if (!v) return undefined;
    const s = v.trim();
    return s.length ? s : undefined;
  }
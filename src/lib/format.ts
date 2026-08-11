export const num = (n: number) => n.toLocaleString('ja-JP');
export const signed = (n: number) => (n > 0 ? '+' : '') + n.toLocaleString('ja-JP');
export const signClass = (n: number) => (n > 0 ? 'text-success' : n < 0 ? 'text-danger' : 'text-muted');

/** 3枚掛け前提の出玉率(%) */
export const payoutRate = (payoutResult: number, gameTotal: number) =>
  gameTotal > 0 ? (1 + payoutResult / (gameTotal * 3)) * 100 : null;

export const mmdd = (day: string) => day.slice(5).replace('-', '/');

export function dateRange(from: string, to: string, max = 62): string[] {
  const a = Date.parse(from + 'T00:00:00Z');
  const b = Date.parse(to + 'T00:00:00Z');
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return [];
  const out: string[] = [];
  for (let t = a; t <= b && out.length < max; t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

export const PALETTE = [
  '#206bc4', '#d63939', '#2fb344', '#f76707', '#ae3ec9',
  '#0ca678', '#f59f00', '#4299e1', '#74b816', '#d6336c',
];

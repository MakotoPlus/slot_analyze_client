import type { CSSProperties } from 'react';

export const num = (n: number) => n.toLocaleString('ja-JP');
export const signed = (n: number) => (n > 0 ? '+' : '') + n.toLocaleString('ja-JP');
export const signClass = (n: number) => (n > 0 ? 'text-success' : n < 0 ? 'text-danger' : 'text-muted');

/** 3枚掛け前提の出玉率(%) */
export const payoutRate = (payoutResult: number, gameTotal: number) =>
  gameTotal > 0 ? (1 + payoutResult / (gameTotal * 3)) * 100 : null;

const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'];

export const mmdd = (day: string) => {
  const md = day.slice(5).replace('-', '/');
  const weekday = WEEKDAY_JA[new Date(day + 'T00:00:00Z').getUTCDay()];
  return `${md}(${weekday})`;
};

function weekendBg(day: string): string | undefined {
  const wd = new Date(day + 'T00:00:00Z').getUTCDay();
  if (wd === 0) return '#fdecec'; // 日
  if (wd === 6) return '#eaf2ff'; // 土
  return undefined;
}

/**
 * 土日の列に付与するセルスタイル。
 * table-striped は縞模様を box-shadow(inset) + CSS変数 --tblr-table-accent-bg で描画しており、
 * 単純な background だけだと縞模様に上書きされてしまうため、その変数ごと上書きする。
 */
export function weekendCellStyle(day: string): CSSProperties | undefined {
  const bg = weekendBg(day);
  if (!bg) return undefined;
  return { background: bg, '--tblr-table-accent-bg': bg } as CSSProperties;
}

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

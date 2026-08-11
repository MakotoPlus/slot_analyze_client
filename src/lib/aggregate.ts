import type { CompareResult, Dimension, Payout, SlotModel, Store } from '@/types/api';
import { PALETTE, dateRange } from './format';

/** 対象（＝表の行 / グラフの1系列）の候補 */
export interface Target {
  key: string;
  label: string;
  sub: string;
  /** この対象に属する payout かどうか */
  match: (p: Payout) => boolean;
}

export function buildTargets(
  dimension: Dimension,
  stores: Store[],
  models: SlotModel[],
  payouts: Payout[],
): Target[] {
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const modelById = new Map(models.map((m) => [m.id, m]));

  if (dimension === 'store') {
    return stores.map((s) => {
      const modelIds = new Set(models.filter((m) => m.store === s.id).map((m) => m.id));
      return {
        key: `store:${s.id}`,
        label: s.store_name,
        sub: `${modelIds.size}機種`,
        match: (p) => modelIds.has(p.slot_model),
      };
    });
  }

  if (dimension === 'unit') {
    const seen = new Map<string, Payout>();
    for (const p of payouts) {
      const k = `${p.slot_model}:${p.slot_num}`;
      if (!seen.has(k)) seen.set(k, p);
    }
    return [...seen.entries()].map(([key, p]) => {
      const m = modelById.get(p.slot_model);
      const store = m ? storeById.get(m.store) : undefined;
      return {
        key: `unit:${key}`,
        label: `${m?.slot_model_name ?? p.slot_model} #${p.slot_num}`,
        sub: store?.store_name ?? '',
        match: (x) => x.slot_model === p.slot_model && x.slot_num === p.slot_num,
      };
    });
  }

  return models.map((m) => ({
    key: `model:${m.id}`,
    label: m.slot_model_name,
    sub: storeById.get(m.store)?.store_name ?? '',
    match: (p) => p.slot_model === m.id,
  }));
}

/** 選択された対象 × 日付 で差枚・ゲーム数・台数を集計する */
export function aggregate(
  targets: Target[],
  payouts: Payout[],
  dateFrom: string,
  dateTo: string,
): CompareResult {
  const days = dateRange(dateFrom, dateTo);
  const dayIndex = new Map(days.map((d, i) => [d, i]));

  const series = targets.map((t, i) => {
    const payoutResult = new Array<number>(days.length).fill(0);
    const gameTotal = new Array<number>(days.length).fill(0);
    const bbNum = new Array<number>(days.length).fill(0);
    const rbNum = new Array<number>(days.length).fill(0);
    const artNum = new Array<number>(days.length).fill(0);
    const units = days.map(() => new Set<string>());

    for (const p of payouts) {
      const idx = dayIndex.get(p.operational_day.slice(0, 10));
      if (idx === undefined || !t.match(p)) continue;
      payoutResult[idx] += p.payout_result ?? 0;
      gameTotal[idx] += p.game_total ?? 0;
      bbNum[idx] += p.bb_num ?? 0;
      rbNum[idx] += p.rb_num ?? 0;
      artNum[idx] += p.art_num ?? 0;
      units[idx].add(p.slot_num);
    }

    return {
      key: t.key,
      label: t.label,
      sub: t.sub,
      color: PALETTE[i % PALETTE.length],
      payoutResult,
      gameTotal,
      unitCount: units.map((s) => s.size),
      bbNum,
      rbNum,
      artNum,
    };
  });

  return { days, series };
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const peak = (xs: number[]) => (xs.length ? Math.max(...xs) : 0);

import type { CompareResult, Dimension, SlotModel, Store, SummarySeries } from '@/types/api';
import { PALETTE } from './format';

/**
 * 対象（＝表の行 / グラフの1系列）の候補。key は /scraping/summary/ が返す key と同じ形式。
 * groupId は「1つ下位の粒度へドリルダウンする際にどの親に属すか」を表す（例: 機種の groupId は店舗 id）。
 */
export interface Target {
  key: string;
  label: string;
  sub: string;
  groupId?: number;
}

/** store / model 単位の対象候補一覧（店舗・機種マスタから作る。期間内のデータ有無は問わない） */
export function catalogTargets(dimension: 'store' | 'model', stores: Store[], models: SlotModel[]): Target[] {
  const storeById = new Map(stores.map((s) => [s.id, s]));

  if (dimension === 'store') {
    return stores.map((s) => ({
      key: `store:${s.id}`,
      label: s.store_name,
      sub: `${models.filter((m) => m.store === s.id).length}機種`,
    }));
  }

  // 紐づく store の id 昇順 → 機種 id 降順
  const sortedModels = [...models].sort((a, b) => a.store - b.store || b.id - a.id);
  return sortedModels.map((m) => ({
    key: `model:${m.id}`,
    label: m.slot_model_name,
    sub: storeById.get(m.store)?.store_name ?? '',
    groupId: m.store,
  }));
}

/** 店舗→機種、機種→台 のドリルダウン先 URL（末端の台にはドリルダウン先が無いので null） */
export function drillHref(dimension: Dimension, key: string, dateFrom: string, dateTo: string): string | null {
  const [kind, id] = key.split(':');
  const qs = `parentId=${id}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
  if (dimension === 'store' && kind === 'store') return `/compare/model?${qs}`;
  if (dimension === 'model' && kind === 'model') return `/compare/unit?${qs}`;
  return null;
}

/** /scraping/summary/ のレスポンス（対象 × 日別）を表・グラフ用の CompareResult に変換する */
export function toCompareResult(days: string[], series: SummarySeries[]): CompareResult {
  const dayIndex = new Map(days.map((d, i) => [d, i]));

  return {
    days,
    series: series.map((s, i) => {
      const payoutResult = new Array<number>(days.length).fill(0);
      const gameTotal = new Array<number>(days.length).fill(0);
      const bbNum = new Array<number>(days.length).fill(0);
      const rbNum = new Array<number>(days.length).fill(0);
      const artNum = new Array<number>(days.length).fill(0);
      const unitCount = new Array<number>(days.length).fill(0);

      for (const d of s.daily) {
        const idx = dayIndex.get(d.day);
        if (idx === undefined) continue;
        payoutResult[idx] = d.payout_result ?? 0;
        gameTotal[idx] = d.game_total ?? 0;
        bbNum[idx] = d.bb_num ?? 0;
        rbNum[idx] = d.rb_num ?? 0;
        artNum[idx] = d.art_num ?? 0;
        unitCount[idx] = d.unit_count;
      }

      return {
        key: s.key,
        label: s.label,
        sub: s.sub,
        color: PALETTE[i % PALETTE.length],
        payoutResult,
        gameTotal,
        unitCount,
        bbNum,
        rbNum,
        artNum,
      };
    }),
  };
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const peak = (xs: number[]) => (xs.length ? Math.max(...xs) : 0);

// NEXT_PUBLIC_USE_MOCK=true のときだけ使われるダミーデータ。
// バックエンド未起動でも画面を確認できるようにするための開発用。
// 形は DRF の serializers.py と同じ。

import type { Dimension, Payout, SlotModel, Store, SummaryDaily, SummarySeries } from '@/types/api';

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const STORE_NAMES = ['大宮楽園', '川越キング', '池袋ジャンボ', '横浜スターダスト', '千葉マリンホール'];
const MACHINES = ['北斗の拳', 'マイジャグラーV', 'まどか☆マギカ', '沖ドキ！GOLD', 'バジリスク絆2', '押忍!番長ZERO', 'ハナハナホウオウ', 'Re:ゼロ season2'];

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
const rnd = (s: string) => (hash(s) % 100000) / 100000;

export const mockStores: Store[] = STORE_NAMES.map((store_name, i) => ({
  id: i + 1, store_name, hp_url: 'https://example.com/' + (i + 1), updated_at: new Date().toISOString(),
}));

export const mockSlotModels: SlotModel[] = mockStores.flatMap((store, si) =>
  Array.from({ length: 5 }, (_, k) => {
    const machine = MACHINES[(si * 2 + k) % MACHINES.length];
    return {
      id: store.id * 100 + k,
      slot_model_name: `${store.store_name} ${machine}`,
      slot_model_keyword: machine,
      store: store.id,
      max_payout_url: null,
      updated_at: new Date().toISOString(),
    };
  }),
);

const mockUnits = mockSlotModels.flatMap((m, mi) =>
  Array.from({ length: 4 + Math.floor(rnd('u' + m.id) * 5) }, (_, j) => ({
    model: m, slot_num: String(100 + (mi % 5) * 20 + j * 2),
  })),
);

/** 指定期間の payout を生成する（1台1日1レコード、約8%は休業で欠測） */
export function mockPayouts(dateFrom: string, dateTo: string): Payout[] {
  const a = Date.parse(dateFrom + 'T00:00:00Z');
  const b = Date.parse(dateTo + 'T00:00:00Z');
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return [];

  const out: Payout[] = [];
  let id = 1;
  for (let t = a; t <= b; t += 86400000) {
    const day = new Date(t).toISOString().slice(0, 10);
    for (const u of mockUnits) {
      const key = u.model.id + '-' + u.slot_num + day;
      const g0 = rnd(key + 'g');
      if (g0 < 0.08) continue;
      const game_total = Math.round(600 + g0 * 7400);
      const bias = (rnd('m' + u.model.id) - 0.5) * 0.1;
      const payout_result = Math.round(((rnd(key + 's') - 0.5) * 0.62 + bias) * game_total);
      const bb_num = Math.round(game_total / (240 + rnd(key + 'b') * 180));
      const rb_num = Math.round(game_total / (200 + rnd(key + 'r') * 200));
      out.push({
        id: id++, slot_model: u.model.id, slot_num: u.slot_num,
        operational_day: day + 'T00:00:00Z',
        game_total, bb_num, rb_num,
        art_num: Math.round(game_total / (90 + rnd(key + 'a') * 130)),
        payout_max: Math.round(1000 + rnd(key + 'p') * 3000),
        payout_result, payout_result_pic: null,
        updated_at: new Date().toISOString(),
      });
    }
  }
  return out;
}

const modelById = new Map(mockSlotModels.map((m) => [m.id, m]));
const storeById = new Map(mockStores.map((s) => [s.id, s]));

/**
 * バックエンドの GET /scraping/summary/（店舗/機種/台 単位で日別に Payout を集計するAPI）を
 * モックモードで再現する。実APIと同じ SummarySeries[] を返すことで、集計結果を消費する側の
 * コード（toCompareResult）をモックと実APIで共通化できる。
 */
export function mockSummary(dimension: Dimension, dateFrom: string, dateTo: string): SummarySeries[] {
  const groups = new Map<string, { label: string; sub: string; days: Map<string, SummaryDaily & { units: Set<string> }> }>();

  for (const p of mockPayouts(dateFrom, dateTo)) {
    const model = modelById.get(p.slot_model);
    if (!model) continue;
    const store = storeById.get(model.store);

    const { key, label, sub } =
      dimension === 'store'
        ? { key: `store:${model.store}`, label: store?.store_name ?? '', sub: '' }
        : dimension === 'model'
        ? { key: `model:${model.id}`, label: model.slot_model_name, sub: store?.store_name ?? '' }
        : { key: `unit:${model.id}:${p.slot_num}`, label: `${model.slot_model_name} #${p.slot_num}`, sub: p.slot_num };

    let group = groups.get(key);
    if (!group) {
      group = { label, sub, days: new Map() };
      groups.set(key, group);
    }
    const day = p.operational_day.slice(0, 10);
    let d = group.days.get(day);
    if (!d) {
      d = { day, payout_result: 0, game_total: 0, bb_num: 0, rb_num: 0, art_num: 0, unit_count: 0, units: new Set() };
      group.days.set(day, d);
    }
    d.payout_result = (d.payout_result ?? 0) + (p.payout_result ?? 0);
    d.game_total = (d.game_total ?? 0) + (p.game_total ?? 0);
    d.bb_num = (d.bb_num ?? 0) + (p.bb_num ?? 0);
    d.rb_num = (d.rb_num ?? 0) + (p.rb_num ?? 0);
    d.art_num = (d.art_num ?? 0) + (p.art_num ?? 0);
    d.units.add(p.slot_num);
    d.unit_count = d.units.size;
  }

  return [...groups.entries()].map(([key, g]) => ({
    key,
    label: g.label,
    sub: g.sub,
    daily: [...g.days.values()]
      .sort((a, b) => (a.day < b.day ? -1 : 1))
      .map(({ units, ...rest }) => rest),
  }));
}

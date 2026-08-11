// NEXT_PUBLIC_USE_MOCK=true のときだけ使われるダミーデータ。
// バックエンド未起動でも画面を確認できるようにするための開発用。
// 形は DRF の serializers.py と同じ。

import type { Payout, SlotModel, Store } from '@/types/api';

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

// DRF serializers.py と 1:1 (workspace/scraping/serializers.py)

export interface Store {
  id: number;
  store_name: string;
  hp_url: string;
  updated_at: string;
}

export interface SlotModel {
  id: number;
  slot_model_name: string;
  slot_model_keyword: string;
  store: number;
  max_payout_url: string | null;
  updated_at: string;
}

export interface Payout {
  id: number;
  slot_model: number;
  slot_num: string;
  operational_day: string; // ISO datetime
  game_total: number | null;
  bb_num: number | null;
  rb_num: number | null;
  art_num: number | null;
  payout_max: number | null;
  payout_result: number | null;
  payout_result_pic: string | null;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type Dimension = 'model' | 'store' | 'unit';

export interface SearchCriteria {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  ids: string[];    // 選択された対象キー
}

/** 1対象 × 期間 の集計結果 */
export interface Series {
  key: string;
  label: string;
  sub: string;
  color: string;
  payoutResult: number[]; // 日別 合計差枚
  gameTotal: number[];    // 日別 合計ゲーム数
  unitCount: number[];    // 日別 台数
  bbNum: number[];        // 日別 BIG回数
  rbNum: number[];        // 日別 REG回数
  artNum: number[];       // 日別 ART回数
}

export interface CompareResult {
  days: string[];
  series: Series[];
}

/** GET /scraping/summary/ の group_by（サーバー側で店舗/機種/台単位に集計する） */
export type GroupBy = 'store' | 'slot_model' | 'slot_num';

export interface SummaryDaily {
  day: string; // YYYY-MM-DD
  payout_result: number | null;
  game_total: number | null;
  unit_count: number;
  bb_num: number | null;
  rb_num: number | null;
  art_num: number | null;
}

/** GET /scraping/summary/ の1系列（store:<id> / model:<id> / unit:<slot_model_id>:<slot_num>） */
export interface SummarySeries {
  key: string;
  label: string;
  sub: string;
  daily: SummaryDaily[];
}

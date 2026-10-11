# slot-analyze-client

スロットのスクレイピング結果（DRF: `MakotoPlus/slot_analyze`）を比較する管理画面。
Next.js 14 (App Router) + TypeScript + Tabler + Chart.js。すべて無料 OSS。

## 起動

```bash
cp .env.local.example .env.local
npm install
npm run dev          # http://localhost:3000
```

### バックエンド無しで動かす（モックモード）

`.env.local` に `NEXT_PUBLIC_USE_MOCK=true` を入れると、API を叩かずダミーデータで動く。
このときログインは **demo / demo**。実 API に繋ぐときは `false` にするか行ごと消す。

## 認証

SimpleJWT。`/login` でトークンを取得し、`/compare` 配下は `AuthGuard` で保護される。
API 呼び出しは `Authorization: Bearer <access>` を付与し、401 なら refresh して 1 度だけ再試行する。

バックエンド側は `config/urls.py` に `api/token/` `api/token/refresh/` が登録済み（`workspace/openapi.yaml` 参照）。
`docker-compose.yml` の `slot-analyze` サービスは `8083` で公開される（`nginx` 経由なら `8080`）。

## 画面

| ルート | 画面 |
| --- | --- |
| `/login` | ログイン |
| `/compare/model` | 機種単位サマリ比較 |
| `/compare/store` | 店舗単位サマリ比較 |
| `/compare/unit`  | 台単位サマリ比較 |

3画面は `CompareView` の `dimension` prop 違いで、同一レイアウト（左＝検索、中央上＝表、中央下＝グラフ）。

## バックエンドAPI

比較画面の集計は `GET /scraping/summary/` に寄せている（`src/hooks/useCompareData.ts`）。
店舗/機種/台単位の日別集計はすべてバックエンド（`scraping/views/summary_view.py`）で行われ、
クライアントは対象一覧の取得と、選んだ対象での絞り込み表示だけを行う。

```
GET /scraping/store/                        -- 店舗マスタ（store/model 画面の対象候補）
GET /scraping/slot_model/                   -- 機種マスタ（store/model 画面の対象候補）
GET /scraping/summary/?group_by=store|slot_model|slot_num&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
  -> [{ key, label, sub, daily: [{ day, payout_result, game_total, unit_count, bb_num, rb_num, art_num }] }]
```

`group_by=slot_num`（台単位画面）は台のマスタが存在しないため、`ids` 指定なしで叩いた
`summary` のレスポンスをそのまま対象候補一覧としても利用している。
レスポンス整形（`SummarySeries[]` → 表・グラフ用の `CompareResult`）は `src/lib/aggregate.ts` の
`toCompareResult` に集約してあるので、`ids` の絞り込みをサーバ側に寄せるなど拡張する場合はここを触ればよい。

## 指標

- 合計差枚 = `SUM(payout.payout_result)`
- 合計累計ゲーム数 = `SUM(payout.game_total)`
- 台数 = 対象日にデータのある `slot_num` のユニーク数（期間最大値）
- 平均差枚/台 = 合計差枚 ÷ 台数
- 出玉率(%) = `(1 + 合計差枚 / (合計G数 × 3)) × 100`（3枚掛け前提／日別表は `RateTable`）
- BIG/REG/ART = `payout.bb_num / rb_num / art_num`（台単位画面のみ `BonusTable` で表示）
- 各確率 = `合計G数 ÷ 回数` を `1/N` 表記

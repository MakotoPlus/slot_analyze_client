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

バックエンド側に以下の登録が必要（現状 `scraping/urls.py` は `TokenRefreshView` を import しているだけで未登録）:

```python
# config/urls.py
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns += [
    path("api/token/", TokenObtainPairView.as_view()),
    path("api/token/refresh/", TokenRefreshView.as_view()),
]
# settings.py: REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] に JWTAuthentication、
#              DEFAULT_PERMISSION_CLASSES に IsAuthenticated を設定する
```

## 画面

| ルート | 画面 |
| --- | --- |
| `/login` | ログイン |
| `/compare/model` | 機種単位サマリ比較 |
| `/compare/store` | 店舗単位サマリ比較 |
| `/compare/unit`  | 台単位サマリ比較 |

3画面は `CompareView` の `dimension` prop 違いで、同一レイアウト（左＝検索、中央上＝表、中央下＝グラフ）。

## バックエンドAPI

現状の DRF は `ModelViewSet` のみでフィルタが無いため、クライアントで全件取得→集計している。
実運用では以下のクエリパラメータ追加を推奨（`django-filter` + 集計エンドポイント）。

```
GET /scraping/slot_model/?store=<id>&is_active=true
GET /scraping/payout/?operational_day__gte=YYYY-MM-DD&operational_day__lte=YYYY-MM-DD
                     &slot_model__in=1,2,3&slot_num__in=101,103&page_size=1000
# 望ましい集計API（サーバ集計にすれば転送量が激減する）
GET /scraping/summary/?group_by=slot_model|store|slot_num&date_from=&date_to=&ids=
  -> [{ key, label, sub, daily: [{ day, payout_result, game_total, unit_count }] }]
```

集計ロジックは `src/lib/aggregate.ts` に集約してあるので、
サーバ集計に移行する際は `useCompareData` の中身だけ差し替えればよい。

## 指標

- 合計差枚 = `SUM(payout.payout_result)`
- 合計累計ゲーム数 = `SUM(payout.game_total)`
- 台数 = 対象日にデータのある `slot_num` のユニーク数（期間最大値）
- 平均差枚/台 = 合計差枚 ÷ 台数
- 出玉率(%) = `(1 + 合計差枚 / (合計G数 × 3)) × 100`（3枚掛け前提／日別表は `RateTable`）
- BIG/REG/ART = `payout.bb_num / rb_num / art_num`（台単位画面のみ `BonusTable` で表示）
- 各確率 = `合計G数 ÷ 回数` を `1/N` 表記

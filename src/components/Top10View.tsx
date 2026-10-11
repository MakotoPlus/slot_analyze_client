'use client';

import { Suspense, useMemo, useState } from 'react';
import { FilterSlot } from './FilterSlot';
import { SingleStoreFilterPanel } from './SingleStoreFilterPanel';
import { Top10ScatterChart } from './Top10ScatterChart';
import { useSlotModels, useStores } from '@/hooks/useCompareData';
import { useTop10Records } from '@/hooks/useTop10Data';
import { catalogTargets } from '@/lib/aggregate';
import { dateRange, defaultDateRangeCriteria, mmdd, payoutRate, signClass, signed, weekendCellStyle } from '@/lib/format';
import { openPayoutImageWindow } from '@/lib/imageWindow';
import type { SearchCriteria, TopPayoutRecord } from '@/types/api';

const TOP_N = 10;

type SortKey = 'day' | 'model' | 'payout' | 'rate';
interface SortSpec { key: SortKey; dir: 1 | -1 }
const DEFAULT_SORT: SortSpec[] = [{ key: 'day', dir: -1 }];

export interface Row {
  day: string;
  storeName: string;
  modelName: string;
  slotNum: string;
  payout: number;
  rate: number | null;
  /** その日のTOP10内での順位（1が最上位） */
  rank: number;
  /** 実績画像URL（無い場合は null） */
  pic: string | null;
}

export function Top10View() {
  return (
    <Suspense fallback={null}>
      <Top10ViewInner />
    </Suspense>
  );
}

function Top10ViewInner() {
  const stores = useStores();
  const models = useSlotModels();
  const [criteria, setCriteria] = useState<SearchCriteria>(() => defaultDateRangeCriteria());

  const storeTargets = useMemo(
    () => catalogTargets('store', stores.data ?? [], models.data ?? []),
    [stores.data, models.data],
  );

  // 選択された店舗（1つだけ）の id をサーバ側の絞り込み（store_id）に渡す
  const selectedStoreKey = criteria.ids[0];
  const selectedStoreId = selectedStoreKey ? Number(selectedStoreKey.split(':')[1]) : undefined;
  const selectedStoreLabel = storeTargets.find((t) => t.key === selectedStoreKey)?.label ?? null;

  const { data: records = [], isFetching, error } = useTop10Records(criteria.dateFrom, criteria.dateTo, selectedStoreId);

  // 日付ごとに差枚TOP10を抽出する（レコードは store_id で既に絞り込み済み）
  const rows: Row[] = useMemo(() => {
    const byDay = new Map<string, TopPayoutRecord[]>();
    for (const r of records) {
      const day = r.operational_day.slice(0, 10);
      const list = byDay.get(day);
      if (list) list.push(r);
      else byDay.set(day, [r]);
    }
    const out: Row[] = [];
    for (const list of byDay.values()) {
      const top = [...list].sort((a, b) => b.payout_result - a.payout_result).slice(0, TOP_N);
      top.forEach((r, idx) => {
        out.push({
          day: r.operational_day.slice(0, 10),
          storeName: r.store_name,
          modelName: r.slot_model_name,
          slotNum: r.slot_num,
          payout: r.payout_result,
          rate: payoutRate(r.payout_result, r.game_total),
          rank: idx + 1,
          pic: r.payout_result_pic,
        });
      });
    }
    return out;
  }, [records]);

  const allDays = useMemo(() => dateRange(criteria.dateFrom, criteria.dateTo), [criteria.dateFrom, criteria.dateTo]);

  // クリックした列が常に最優先キーになり、それまでのキーは下位の並び替え条件として残る
  // （Excel のオートフィルタ的な挙動。修飾キー不要で自然に複合ソートになる）
  const [sorts, setSorts] = useState<SortSpec[]>(DEFAULT_SORT);
  const toggleSort = (key: SortKey) =>
    setSorts((prev) => {
      const idx = prev.findIndex((s) => s.key === key);
      if (idx === 0) return [{ key, dir: (prev[0].dir * -1) as 1 | -1 }, ...prev.slice(1)];
      if (idx > 0) return [prev[idx], ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      return [{ key, dir: -1 }, ...prev];
    });
  const resetSort = () => setSorts(DEFAULT_SORT);

  const rateOrMinus = (r: Row) => r.rate ?? -Infinity;
  const CMP: Record<SortKey, (a: Row, b: Row) => number> = {
    day: (a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0),
    model: (a, b) => a.modelName.localeCompare(b.modelName, 'ja'),
    payout: (a, b) => a.payout - b.payout,
    rate: (a, b) => rateOrMinus(a) - rateOrMinus(b),
  };
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      for (const s of sorts) {
        const d = CMP[s.key](a, b) * s.dir;
        if (d !== 0) return d;
      }
      return 0;
    });
  }, [rows, sorts]);

  // TOP10 入りした機種の出現回数（多い順）
  const modelCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.modelName, (m.get(r.modelName) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const sortMark = (key: SortKey) => {
    const idx = sorts.findIndex((s) => s.key === key);
    if (idx === -1) return null;
    const arrow = sorts[idx].dir === 1 ? '▲' : '▼';
    return <span className="text-primary ms-1">{arrow}{sorts.length > 1 ? idx + 1 : ''}</span>;
  };

  const hasSelection = criteria.ids.length > 0;

  return (
    <>
      <FilterSlot>
        <SingleStoreFilterPanel
          targets={storeTargets}
          initial={criteria}
          onSearch={setCriteria}
        />
      </FilterSlot>

      <div className="d-flex flex-column sc-main" style={{ gap: 16, padding: '20px 22px 40px' }}>
        <div>
          <h1 className="sc-title" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>TOP10分析</h1>
          <div className="text-muted" style={{ fontSize: 12.5, marginTop: 3 }}>
            {`${criteria.dateFrom} 〜 ${criteria.dateTo} ／ ${selectedStoreLabel ?? '店舗未選択'} ／ ${sortedRows.length}件`}
          </div>
        </div>

        {error && <div className="alert alert-danger">API エラー: {(error as Error).message}</div>}
        {isFetching && <div className="card"><div className="card-body text-muted text-center p-5">読み込み中…</div></div>}

        {!isFetching && !hasSelection && (
          <div className="card">
            <div className="card-body text-muted text-center" style={{ padding: 56, fontSize: 13.5 }}>
              左の検索条件で店舗を選び「検索」を押してください。
            </div>
          </div>
        )}

        {!isFetching && hasSelection && (
          <>
            <Top10ScatterChart rows={rows} days={allDays} />

            <div className="card">
              <div className="card-body d-flex align-items-center justify-content-between" style={{ padding: '14px 16px 8px' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>日別 差枚TOP10</span>
                  <span className="text-muted ms-2" style={{ fontSize: 12 }}>
                    列見出しをクリックした順に優先される複合ソートです（直近クリックが最優先）
                  </span>
                </div>
                {sorts.length > 1 && (
                  <button type="button" className="btn btn-sm" onClick={resetSort}>ソートをリセット</button>
                )}
              </div>
              <div className="table-responsive" style={{ maxHeight: '60vh' }}>
                <table className="table table-sm table-vcenter card-table table-striped">
                  <thead>
                    <tr>
                      <th className="text-end" style={{ width: 44 }}>No</th>
                      <th
                        className="sc-sticky"
                        style={{ minWidth: 110, cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => toggleSort('day')}
                      >
                        日付{sortMark('day')}
                      </th>
                      <th style={{ minWidth: 220, cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('model')}>
                        機種{sortMark('model')}
                      </th>
                      <th className="text-end">台No</th>
                      <th className="text-end" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('payout')}>
                        差枚{sortMark('payout')}
                      </th>
                      <th className="text-end" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('rate')}>
                        機械割{sortMark('rate')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((r, i) => {
                      const rateText = r.rate === null ? '—' : r.rate.toFixed(1) + '%';
                      const openPic = () => r.pic && openPayoutImageWindow(r.pic, `${mmdd(r.day)} ${r.modelName} #${r.slotNum}`);
                      return (
                        <tr key={`${r.day}-${r.modelName}-${r.slotNum}`}>
                          <td className="text-end tabular text-muted" style={weekendCellStyle(r.day)}>{i + 1}</td>
                          <td className="sc-sticky tabular" style={weekendCellStyle(r.day)}>{mmdd(r.day)}</td>
                          <td style={{ fontSize: 12.5, ...weekendCellStyle(r.day) }}>{r.modelName}</td>
                          <td className="text-end tabular" style={weekendCellStyle(r.day)}>{r.slotNum}</td>
                          <td className={`text-end tabular fw-bold ${signClass(r.payout)}`} style={weekendCellStyle(r.day)}>
                            {r.pic ? <button type="button" className="sc-pic-link" onClick={openPic}>{signed(r.payout)}</button> : signed(r.payout)}
                          </td>
                          <td className="text-end tabular" style={weekendCellStyle(r.day)}>
                            {r.pic ? <button type="button" className="sc-pic-link" onClick={openPic}>{rateText}</button> : rateText}
                          </td>
                        </tr>
                      );
                    })}
                    {sortedRows.length === 0 && (
                      <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 32 }}>該当データがありません</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-body" style={{ padding: '14px 16px 8px' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>機種別 TOP10入り回数</span>
                <span className="text-muted ms-2" style={{ fontSize: 12 }}>期間内に何回 TOP10 入りしたか</span>
              </div>
              <div className="table-responsive" style={{ maxHeight: '40vh' }}>
                <table className="table table-sm table-vcenter card-table table-striped">
                  <thead>
                    <tr>
                      <th className="text-end" style={{ width: 44 }}>No</th>
                      <th>機種</th>
                      <th className="text-end">TOP10入り回数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelCounts.map(([modelName, count], i) => (
                      <tr key={modelName}>
                        <td className="text-end tabular text-muted">{i + 1}</td>
                        <td style={{ fontSize: 12.5 }}>{modelName}</td>
                        <td className="text-end tabular fw-bold">{count}</td>
                      </tr>
                    ))}
                    {modelCounts.length === 0 && (
                      <tr><td colSpan={3} className="text-center text-muted" style={{ padding: 32 }}>該当データがありません</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

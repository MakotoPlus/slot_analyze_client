'use client';

import { Suspense, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { BonusTable } from './BonusTable';
import { GameTotalChart, PayoutTrendChart } from './CompareCharts';
import { RateTable } from './RateTable';
import { FilterPanel } from './FilterPanel';
import { SummaryTable } from './SummaryTable';
import { useCompareData } from '@/hooks/useCompareData';
import { sum } from '@/lib/aggregate';
import { num, payoutRate, signed } from '@/lib/format';
import type { Dimension, SearchCriteria } from '@/types/api';

const META: Record<Dimension, { label: string; title: string; maxSelect: number }> = {
  model: { label: '機種', title: '機種単位サマリ比較', maxSelect: 10 },
  store: { label: '店舗', title: '店舗単位サマリ比較', maxSelect: 10 },
  unit: { label: '台', title: '台単位サマリ比較', maxSelect: 100 },
};

function defaultCriteria(): SearchCriteria {
  const to = new Date();
  const from = new Date(to.getTime() - 13 * 86400000);
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10), ids: [] };
}

/** Sidebar 内の #filter-slot に検索パネルを差し込む */
function FilterSlot({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    setHost(document.getElementById('filter-slot'));
  }, []);
  return host ? createPortal(children, host) : null;
}

export function CompareView({ dimension }: { dimension: Dimension }) {
  return (
    <Suspense fallback={null}>
      <CompareViewInner dimension={dimension} />
    </Suspense>
  );
}

function CompareViewInner({ dimension }: { dimension: Dimension }) {
  const meta = META[dimension];
  const searchParams = useSearchParams();
  // 上位粒度（店舗→機種／機種→台）からのドリルダウン時は URL の parentId で絞り込む対象を指定する
  const parentId = searchParams.get('parentId');

  // 初期値から criteria を確定させておく（null のままだと summary クエリが発火せず、
  // 台帳を持たない「台」の選択肢が検索前は空になってしまうため）
  const [criteria, setCriteria] = useState<SearchCriteria>(() => {
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    return dateFrom && dateTo ? { dateFrom, dateTo, ids: [] } : defaultCriteria();
  });
  const [filterVersion, setFilterVersion] = useState(0);
  const { targets, result, isLoading, error } = useCompareData(dimension, criteria);

  // parentId 指定時、対象一覧が揃い次第そこに属する対象を全選択する（一度だけ）
  const appliedParentRef = useRef(false);
  useEffect(() => {
    if (appliedParentRef.current || isLoading) return;
    appliedParentRef.current = true;
    if (!parentId) return;
    const matched = targets.filter((t) => String(t.groupId) === parentId).map((t) => t.key);
    if (matched.length > 0) {
      setCriteria((c) => ({ ...c, ids: matched }));
      setFilterVersion((v) => v + 1);
    }
  }, [isLoading, targets, parentId]);

  const grandPayout = sum(result.series.flatMap((s) => s.payoutResult));
  const grandGame = sum(result.series.flatMap((s) => s.gameTotal));
  const rate = payoutRate(grandPayout, grandGame);

  // 機種・台単位サマリでは、チェックを外した対象を差枚推移・累計ゲーム数グラフから除外できる
  const chartCheckable = dimension === 'unit' || dimension === 'model';
  const [excludedChartKeys, setExcludedChartKeys] = useState<Set<string>>(new Set());
  const toggleChartKey = (key: string) =>
    setExcludedChartKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const chartCheckedKeys = new Set(result.series.filter((s) => !excludedChartKeys.has(s.key)).map((s) => s.key));
  const uncheckAllChart = () => setExcludedChartKeys(new Set(result.series.map((s) => s.key)));

  return (
    <>
      <FilterSlot>
        <FilterPanel
          key={filterVersion}
          targetLabel={meta.label}
          targets={targets}
          maxSelect={Math.max(meta.maxSelect, criteria.ids.length)}
          initial={criteria}
          onSearch={setCriteria}
        />
      </FilterSlot>

      <div className="d-flex flex-column sc-main" style={{ gap: 16, padding: '20px 22px 40px' }}>
        <div className="d-flex align-items-end justify-content-between sc-head" style={{ gap: 16 }}>
          <div>
            <h1 className="sc-title" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{meta.title}</h1>
            <div className="text-muted" style={{ fontSize: 12.5, marginTop: 3 }}>
              {`${criteria.dateFrom} 〜 ${criteria.dateTo} ／ ${result.days.length}日 ／ ${result.series.length}${meta.label}`}
            </div>
          </div>
          {result.series.length > 0 && (
            <div className="d-flex sc-kpis" style={{ gap: 18 }}>
              {[
                { label: '合計差枚', value: signed(grandPayout) },
                { label: '合計G数', value: num(grandGame) },
                { label: '出玉率', value: rate === null ? '—' : rate.toFixed(1) + '%' },
              ].map((k) => (
                <div key={k.label} style={{ textAlign: 'right' }}>
                  <div className="text-muted" style={{ fontSize: 11 }}>{k.label}</div>
                  <div className="tabular" style={{ fontSize: 19, fontWeight: 600 }}>{k.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="alert alert-danger">API エラー: {error.message}</div>}
        {isLoading && <div className="card"><div className="card-body text-muted text-center p-5">読み込み中…</div></div>}

        {!isLoading && result.series.length === 0 && (
          <div className="card">
            <div className="card-body text-muted text-center" style={{ padding: 56, fontSize: 13.5 }}>
              左の検索条件で{meta.label}を選び「検索」を押してください。
            </div>
          </div>
        )}

        {result.series.length > 0 && (
          <>
            <SummaryTable
              title="日別 合計差枚数"
              targetLabel={meta.label}
              result={result}
              metric="payout"
              dimension={dimension}
              checkable={chartCheckable}
              checkedKeys={chartCheckedKeys}
              onToggleCheck={toggleChartKey}
              onUncheckAll={uncheckAllChart}
            />
            <PayoutTrendChart result={result} filterKeys={chartCheckable ? chartCheckedKeys : undefined} />
            <RateTable targetLabel={meta.label} result={result} dimension={dimension} />
            {dimension === 'unit' && <BonusTable result={result} />}
            <SummaryTable title="日別 合計累計ゲーム数" targetLabel={meta.label} result={result} metric="game" dimension={dimension} />
            <GameTotalChart result={result} filterKeys={chartCheckable ? chartCheckedKeys : undefined} />
          </>
        )}
      </div>
    </>
  );
}

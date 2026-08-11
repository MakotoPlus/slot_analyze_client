'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import { BonusTable } from './BonusTable';
import { CompareCharts } from './CompareCharts';
import { RateTable } from './RateTable';
import { FilterPanel } from './FilterPanel';
import { SummaryTable } from './SummaryTable';
import { useCompareData } from '@/hooks/useCompareData';
import { sum } from '@/lib/aggregate';
import { num, payoutRate, signed } from '@/lib/format';
import type { Dimension, SearchCriteria } from '@/types/api';

const META: Record<Dimension, { label: string; title: string }> = {
  model: { label: '機種', title: '機種単位サマリ比較' },
  store: { label: '店舗', title: '店舗単位サマリ比較' },
  unit: { label: '台', title: '台単位サマリ比較' },
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
  const meta = META[dimension];
  const [criteria, setCriteria] = useState<SearchCriteria | null>(null);
  const { targets, result, isLoading, error } = useCompareData(dimension, criteria);

  const grandPayout = sum(result.series.flatMap((s) => s.payoutResult));
  const grandGame = sum(result.series.flatMap((s) => s.gameTotal));
  const rate = payoutRate(grandPayout, grandGame);

  return (
    <>
      <FilterSlot>
        <FilterPanel
          targetLabel={meta.label}
          targets={targets}
          initial={criteria ?? defaultCriteria()}
          onSearch={setCriteria}
        />
      </FilterSlot>

      <div className="d-flex flex-column sc-main" style={{ gap: 16, padding: '20px 22px 40px' }}>
        <div className="d-flex align-items-end justify-content-between sc-head" style={{ gap: 16 }}>
          <div>
            <h1 className="sc-title" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{meta.title}</h1>
            <div className="text-muted" style={{ fontSize: 12.5, marginTop: 3 }}>
              {criteria
                ? `${criteria.dateFrom} 〜 ${criteria.dateTo} ／ ${result.days.length}日 ／ ${result.series.length}${meta.label}`
                : '条件未指定'}
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
            <SummaryTable title="日別 合計差枚数" targetLabel={meta.label} result={result} metric="payout" />
            <SummaryTable title="日別 合計累計ゲーム数" targetLabel={meta.label} result={result} metric="game" />
            <RateTable targetLabel={meta.label} result={result} />
            {dimension === 'unit' && <BonusTable result={result} />}
            <CompareCharts result={result} />
          </>
        )}
      </div>
    </>
  );
}

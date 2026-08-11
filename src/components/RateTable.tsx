'use client';

import { sum } from '@/lib/aggregate';
import { mmdd, num, payoutRate, signClass, signed } from '@/lib/format';
import type { CompareResult } from '@/types/api';

const rateClass = (r: number | null) => (r === null ? 'text-muted' : r >= 100 ? 'text-success' : 'text-danger');
const fmt = (r: number | null) => (r === null ? '—' : r.toFixed(1) + '%');

/** 回転数 (game_total) と 差枚数 (payout_result) から算出した日別出玉率 */
export function RateTable({ targetLabel, result }: { targetLabel: string; result: CompareResult }) {
  const { days, series } = result;
  return (
    <div className="card">
      <div className="card-body" style={{ padding: '14px 16px 8px' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>日別 出玉率</span>
        <span className="text-muted ms-2" style={{ fontSize: 12 }}>回転数と差枚数から算出（3枚掛け・100%が等価）</span>
      </div>
      <div className="table-responsive" style={{ maxHeight: '38vh' }}>
        <table className="table table-sm table-vcenter card-table table-striped">
          <thead>
            <tr>
              <th className="sc-sticky" style={{ minWidth: 210 }}>{targetLabel}</th>
              {days.map((d) => <th key={d} className="text-end fw-normal">{mmdd(d)}</th>)}
              <th className="text-end" style={{ borderLeft: '2px solid #e6e7e9' }}>合計回転数</th>
              <th className="text-end">合計差枚</th>
              <th className="text-end">期間出玉率</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => {
              const totalG = sum(s.gameTotal);
              const totalS = sum(s.payoutResult);
              const total = payoutRate(totalS, totalG);
              return (
                <tr key={s.key}>
                  <td className="sc-sticky">
                    <span className="d-inline-flex align-items-center" style={{ gap: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flex: '0 0 auto' }} />
                      <span>
                        <span style={{ display: 'block', fontSize: 12.5 }}>{s.label}</span>
                        <span className="text-muted" style={{ display: 'block', fontSize: 11 }}>{s.sub}</span>
                      </span>
                    </span>
                  </td>
                  {days.map((_, i) => {
                    const r = payoutRate(s.payoutResult[i], s.gameTotal[i]);
                    return <td key={i} className={`text-end tabular ${rateClass(r)}`}>{fmt(r)}</td>;
                  })}
                  <td className="text-end tabular" style={{ borderLeft: '2px solid #e6e7e9' }}>{num(totalG)}</td>
                  <td className={`text-end tabular ${signClass(totalS)}`}>{signed(totalS)}</td>
                  <td className={`text-end tabular fw-bold ${rateClass(total)}`}>{fmt(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { drillHref, sum, peak } from '@/lib/aggregate';
import { mmdd, num, payoutRate, signClass, signed, weekendCellStyle } from '@/lib/format';
import type { CompareResult, Dimension } from '@/types/api';

interface Props {
  title: string;
  targetLabel: string;
  result: CompareResult;
  metric: 'payout' | 'game';
  dimension: Dimension;
  /** true の場合、行にチェックボックスを表示する（折れ線グラフ表示対象の選択用） */
  checkable?: boolean;
  checkedKeys?: Set<string>;
  onToggleCheck?: (key: string) => void;
  onUncheckAll?: () => void;
}

export function SummaryTable({ title, targetLabel, result, metric, dimension, checkable, checkedKeys, onToggleCheck, onUncheckAll }: Props) {
  const { days, series } = result;
  const isPayout = metric === 'payout';
  const dateFrom = days[0];
  const dateTo = days[days.length - 1];

  return (
    <div className="card">
      <div className="card-body d-flex align-items-center justify-content-between" style={{ padding: '14px 16px 8px' }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
          <span className="text-muted ms-2" style={{ fontSize: 12 }}>行＝{targetLabel}／列＝稼働日</span>
          {checkable && (
            <span className="text-muted ms-2" style={{ fontSize: 12 }}>（チェックした{targetLabel}のみ下の折れ線・棒グラフに表示）</span>
          )}
        </div>
        {checkable && (
          <button type="button" className="btn btn-sm" onClick={onUncheckAll}>全解除</button>
        )}
      </div>
      <div className="table-responsive" style={{ maxHeight: '38vh' }}>
        <table className="table table-sm table-vcenter card-table table-striped">
          <thead>
            <tr>
              <th className="sc-sticky" style={{ minWidth: 210 }}>{targetLabel}</th>
              {days.map((d) => (
                <th key={d} className="text-end fw-normal" style={weekendCellStyle(d)}>{mmdd(d)}</th>
              ))}
              <th className="text-end" style={{ borderLeft: '2px solid #e6e7e9' }}>合計</th>
              <th className="text-end">台数</th>
              <th className="text-end">{isPayout ? '平均差枚/台' : '平均G/台'}</th>
              {isPayout && <th className="text-end">出玉率</th>}
            </tr>
          </thead>
          <tbody>
            {series.map((s) => {
              const values = isPayout ? s.payoutResult : s.gameTotal;
              const total = sum(values);
              const units = peak(s.unitCount);
              const rate = payoutRate(sum(s.payoutResult), sum(s.gameTotal));
              const href = drillHref(dimension, s.key, dateFrom, dateTo);
              return (
                <tr key={s.key}>
                  <td className="sc-sticky">
                    <span className="d-inline-flex align-items-center" style={{ gap: 8 }}>
                      {checkable && (
                        <input
                          type="checkbox"
                          className="form-check-input"
                          style={{ flex: '0 0 auto' }}
                          checked={checkedKeys?.has(s.key) ?? true}
                          onChange={() => onToggleCheck?.(s.key)}
                        />
                      )}
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flex: '0 0 auto' }} />
                      <span>
                        {href ? (
                          <Link href={href} style={{ display: 'block', fontSize: 12.5 }}>{s.label}</Link>
                        ) : (
                          <span style={{ display: 'block', fontSize: 12.5 }}>{s.label}</span>
                        )}
                        <span className="text-muted" style={{ display: 'block', fontSize: 11 }}>{s.sub}</span>
                      </span>
                    </span>
                  </td>
                  {values.map((v, i) => (
                    <td key={i} className={`text-end tabular ${isPayout ? signClass(v) : ''}`} style={weekendCellStyle(days[i])}>
                      {s.unitCount[i] === 0 ? '—' : isPayout ? signed(v) : num(v)}
                    </td>
                  ))}
                  <td className={`text-end tabular fw-bold ${isPayout ? signClass(total) : ''}`} style={{ borderLeft: '2px solid #e6e7e9' }}>
                    {isPayout ? signed(total) : num(total)}
                  </td>
                  <td className="text-end tabular text-muted">{units}</td>
                  <td className={`text-end tabular ${isPayout ? signClass(total) : ''}`}>
                    {units ? (isPayout ? signed(Math.round(total / units)) : num(Math.round(total / units))) : '—'}
                  </td>
                  {isPayout && <td className="text-end tabular">{rate === null ? '—' : rate.toFixed(1) + '%'}</td>}
                </tr>
              );
            })}
          </tbody>
          {isPayout && (
            <tfoot>
              <tr style={{ borderTop: '2px solid #e6e7e9' }}>
                <td className="sc-sticky fw-bold">全体</td>
                {days.map((d, i) => {
                  const v = series.reduce((a, s) => a + s.payoutResult[i], 0);
                  return (
                    <td key={i} className={`text-end tabular fw-bold ${signClass(v)}`} style={weekendCellStyle(d)}>
                      {signed(v)}
                    </td>
                  );
                })}
                <td className="text-end" colSpan={4} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

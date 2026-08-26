'use client';

import { sum } from '@/lib/aggregate';
import { mmdd, num, weekendCellStyle } from '@/lib/format';
import type { CompareResult } from '@/types/api';

const prob = (games: number, count: number) => (count > 0 ? `1/${Math.round(games / count)}` : '—');

/** 台単位専用: BIG / REG / ART の日別回数と確率 */
export function BonusTable({ result }: { result: CompareResult }) {
  const { days, series } = result;
  return (
    <div className="card">
      <div className="card-body" style={{ padding: '14px 16px 8px' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>日別 BIG / REG / ART</span>
        <span className="text-muted ms-2" style={{ fontSize: 12 }}>セルは BIG / REG / ART の回数</span>
      </div>
      <div className="table-responsive" style={{ maxHeight: '38vh' }}>
        <table className="table table-sm table-vcenter card-table table-striped">
          <thead>
            <tr>
              <th className="sc-sticky" style={{ minWidth: 210 }}>台</th>
              {days.map((d) => (
                <th key={d} className="text-end fw-normal" style={weekendCellStyle(d)}>{mmdd(d)}</th>
              ))}
              <th className="text-end" style={{ borderLeft: '2px solid #e6e7e9' }}>BIG計</th>
              <th className="text-end">REG計</th>
              <th className="text-end">ART計</th>
              <th className="text-end">BIG確率</th>
              <th className="text-end">REG確率</th>
              <th className="text-end">合算確率</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => {
              const bb = sum(s.bbNum);
              const rb = sum(s.rbNum);
              const art = sum(s.artNum);
              const games = sum(s.gameTotal);
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
                  {days.map((d, i) => (
                    <td key={i} className="text-end tabular" style={weekendCellStyle(d)}>
                      {s.unitCount[i] === 0 ? '—' : `${s.bbNum[i]} / ${s.rbNum[i]} / ${s.artNum[i]}`}
                    </td>
                  ))}
                  <td className="text-end tabular fw-bold" style={{ borderLeft: '2px solid #e6e7e9' }}>{num(bb)}</td>
                  <td className="text-end tabular fw-bold">{num(rb)}</td>
                  <td className="text-end tabular fw-bold">{num(art)}</td>
                  <td className="text-end tabular text-muted">{prob(games, bb)}</td>
                  <td className="text-end tabular text-muted">{prob(games, rb)}</td>
                  <td className="text-end tabular">{prob(games, bb + rb)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

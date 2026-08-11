'use client';

import { useMemo, useState } from 'react';
import type { Target } from '@/lib/aggregate';
import type { SearchCriteria } from '@/types/api';

interface Props {
  targetLabel: string;
  targets: Target[];
  maxSelect?: number;
  initial: SearchCriteria;
  onSearch: (c: SearchCriteria) => void;
}

export function FilterPanel({ targetLabel, targets, maxSelect = 10, initial, onSearch }: Props) {
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [ids, setIds] = useState<string[]>(initial.ids);
  const [q, setQ] = useState('');

  const options = useMemo(
    () => targets.filter((t) => !q || (t.label + t.sub).includes(q)).slice(0, 300),
    [targets, q],
  );

  const toggle = (key: string) =>
    setIds((cur) =>
      cur.includes(key) ? cur.filter((x) => x !== key) : cur.length >= maxSelect ? cur : [...cur, key],
    );

  const invalid = !dateFrom || !dateTo || dateTo < dateFrom;

  return (
    <div className="p-3 d-flex flex-column" style={{ gap: 14, overflow: 'auto', flex: 1 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#626976', marginBottom: 6 }}>稼働日</div>
        <div className="d-flex align-items-center" style={{ gap: 6 }}>
          <input type="date" className="form-control form-control-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="text-muted" style={{ fontSize: 12 }}>〜</span>
          <input type="date" className="form-control form-control-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="d-flex flex-column" style={{ flex: 1, minHeight: 0 }}>
        <div className="d-flex justify-content-between align-items-baseline mb-1">
          <span style={{ fontSize: 12, fontWeight: 600, color: '#626976' }}>{targetLabel}（複数選択）</span>
          <span className="text-muted" style={{ fontSize: 11.5 }}>{ids.length} / {maxSelect}</span>
        </div>
        <input type="search" className="form-control form-control-sm" placeholder="絞り込み" value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ border: '1px solid #e6e7e9', borderRadius: 6, marginTop: 6, overflow: 'auto', flex: 1, minHeight: 180 }}>
          {options.map((t) => (
            <label key={t.key} className="d-flex" style={{ gap: 8, padding: '7px 10px', borderBottom: '1px solid #f1f2f4', fontSize: 12.5, cursor: 'pointer' }}>
              <input type="checkbox" className="form-check-input" checked={ids.includes(t.key)} onChange={() => toggle(t.key)} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block' }}>{t.label}</span>
                <span className="text-muted" style={{ display: 'block', fontSize: 11 }}>{t.sub}</span>
              </span>
            </label>
          ))}
          {options.length === 0 && <div className="text-muted p-3" style={{ fontSize: 12 }}>該当なし</div>}
        </div>
        <div className="d-flex mt-2" style={{ gap: 6 }}>
          <button type="button" className="btn btn-sm" onClick={() => setIds([])}>全解除</button>
          <button type="button" className="btn btn-sm" onClick={() => setIds(targets.slice(0, maxSelect).map((t) => t.key))}>
            上位{maxSelect}件を選択
          </button>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary w-100"
        disabled={invalid}
        onClick={() => onSearch({ dateFrom, dateTo, ids })}
      >
        検索
      </button>
      {invalid && <div className="text-danger" style={{ fontSize: 11.5 }}>日付の範囲が不正です。</div>}
    </div>
  );
}

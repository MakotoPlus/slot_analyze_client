'use client';

import { useMemo, useState } from 'react';
import type { Target } from '@/lib/aggregate';
import type { SearchCriteria } from '@/types/api';

interface Props {
  targets: Target[];
  initial: SearchCriteria;
  onSearch: (c: SearchCriteria) => void;
}

/** TOP10分析用: 店舗は複数ではなく1つだけ選ぶ検索パネル（店内の機種傾向を見るための画面のため） */
export function SingleStoreFilterPanel({ targets, initial, onSearch }: Props) {
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [storeKey, setStoreKey] = useState<string | null>(initial.ids[0] ?? null);
  const [q, setQ] = useState('');

  const options = useMemo(
    () => targets.filter((t) => !q || (t.label + t.sub).includes(q)),
    [targets, q],
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
          <span style={{ fontSize: 12, fontWeight: 600, color: '#626976' }}>店舗（1つだけ選択）</span>
          <span className="text-muted" style={{ fontSize: 11.5 }}>{storeKey ? '1' : '0'} / 1</span>
        </div>
        <input type="search" className="form-control form-control-sm" placeholder="絞り込み" value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ border: '1px solid #e6e7e9', borderRadius: 6, marginTop: 6, overflow: 'auto', flex: 1, minHeight: 180 }}>
          {options.map((t) => (
            <label key={t.key} className="d-flex" style={{ gap: 8, padding: '7px 10px', borderBottom: '1px solid #f1f2f4', fontSize: 12.5, cursor: 'pointer' }}>
              <input
                type="radio"
                name="single-store"
                className="form-check-input"
                checked={storeKey === t.key}
                onChange={() => setStoreKey(t.key)}
              />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block' }}>{t.label}</span>
                <span className="text-muted" style={{ display: 'block', fontSize: 11 }}>{t.sub}</span>
              </span>
            </label>
          ))}
          {options.length === 0 && <div className="text-muted p-3" style={{ fontSize: 12 }}>該当なし</div>}
        </div>
        {storeKey && (
          <button type="button" className="btn btn-sm mt-2" style={{ alignSelf: 'flex-start' }} onClick={() => setStoreKey(null)}>
            選択解除
          </button>
        )}
      </div>

      <button
        type="button"
        className="btn btn-primary w-100"
        disabled={invalid || !storeKey}
        onClick={() => onSearch({ dateFrom, dateTo, ids: storeKey ? [storeKey] : [] })}
      >
        検索
      </button>
      {invalid && <div className="text-danger" style={{ fontSize: 11.5 }}>日付の範囲が不正です。</div>}
      {!invalid && !storeKey && <div className="text-muted" style={{ fontSize: 11.5 }}>店舗を1つ選んでください。</div>}
    </div>
  );
}

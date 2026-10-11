'use client';

import { useState } from 'react';
import { mmdd, weekendCellStyle } from '@/lib/format';

/** day が LABEL_KEY の場合は対象名（機種名・台番号）でのソート */
export const LABEL_KEY = '__label__';

export interface DaySort {
  day: string;
  dir: 'asc' | 'desc';
}

/**
 * 日付列ヘッダのクリックで、その日の値による行の昇順/降順ソートを切り替える。
 * 別の日をクリックしたときは降順（値の大きい順）から開始し、同じ日の再クリックで昇順/降順を反転する。
 */
export function useDaySort(enabled: boolean) {
  const [sort, setSort] = useState<DaySort | null>(null);
  const toggle = (day: string) =>
    setSort((s) =>
      s?.day === day
        ? { day, dir: s.dir === 'desc' ? 'asc' : 'desc' }
        // 日付は値の大きい順、対象名は昇順から開始
        : { day, dir: day === LABEL_KEY ? 'asc' : 'desc' },
    );

  /** value は行の指定日の値。台数 0 の日（稼働なし）は常に末尾 */
  function sortRows<T extends { unitCount: number[]; label: string }>(rows: T[], days: string[], value: (row: T, i: number) => number): T[] {
    if (!sort) return rows;
    const sign = sort.dir === 'desc' ? -1 : 1;
    if (sort.day === LABEL_KEY) {
      return [...rows].sort((a, b) => sign * a.label.localeCompare(b.label, 'ja', { numeric: true }));
    }
    const i = days.indexOf(sort.day);
    if (i < 0) return rows;
    return [...rows].sort((a, b) => {
      const aNone = a.unitCount[i] === 0;
      const bNone = b.unitCount[i] === 0;
      if (aNone || bNone) return Number(aNone) - Number(bNone);
      return sign * (value(a, i) - value(b, i));
    });
  }

  return { sort, sortRows, onToggle: enabled ? toggle : undefined };
}

interface Props {
  day: string;
  sort: DaySort | null;
  /** 未指定の場合はクリック不可 */
  onToggle?: (day: string) => void;
}

/** 対象名（機種/台）列ヘッダ。クリックで名前順の昇順/降順を切り替える */
export function LabelHeader({ label, sort, onToggle }: { label: string; sort: DaySort | null; onToggle?: (day: string) => void }) {
  if (!onToggle) return <th className="sc-sticky" style={{ minWidth: 210 }}>{label}</th>;
  const active = sort?.day === LABEL_KEY;
  return (
    <th
      className="sc-sticky"
      style={{ minWidth: 210, cursor: 'pointer', userSelect: 'none' }}
      title={`クリックで${label}名順に並べ替え（昇順/降順）`}
      onClick={() => onToggle(LABEL_KEY)}
    >
      {label}
      <span style={{ display: 'inline-block', width: '1em' }}>{active ? (sort.dir === 'desc' ? '▼' : '▲') : ''}</span>
    </th>
  );
}

/** 日付列ヘッダ */
export function DayHeader({ day, sort, onToggle }: Props) {
  const style = weekendCellStyle(day);
  if (!onToggle) return <th className="text-end fw-normal" style={style}>{mmdd(day)}</th>;
  const active = sort?.day === day;
  return (
    <th
      className="text-end fw-normal"
      style={{ ...style, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      title="クリックでこの日の値で並べ替え（昇順/降順）"
      onClick={() => onToggle(day)}
    >
      {mmdd(day)}
      <span style={{ display: 'inline-block', width: '1em' }}>{active ? (sort.dir === 'desc' ? '▼' : '▲') : ''}</span>
    </th>
  );
}

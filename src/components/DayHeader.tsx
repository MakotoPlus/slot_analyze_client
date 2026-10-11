'use client';

import { useState } from 'react';
import { mmdd, weekendCellStyle } from '@/lib/format';

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
    setSort((s) => (s?.day === day ? { day, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { day, dir: 'desc' }));

  /** value は行の指定日の値。台数 0 の日（稼働なし）は常に末尾 */
  function sortRows<T extends { unitCount: number[] }>(rows: T[], days: string[], value: (row: T, i: number) => number): T[] {
    const i = sort ? days.indexOf(sort.day) : -1;
    if (!sort || i < 0) return rows;
    const sign = sort.dir === 'desc' ? -1 : 1;
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

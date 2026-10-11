'use client';

import { mmdd, weekendCellStyle } from '@/lib/format';

export type DayOrder = 'asc' | 'desc';

interface Props {
  day: string;
  order: DayOrder;
  /** 未指定の場合はクリック不可 */
  onToggle?: () => void;
}

/** 日付列ヘッダ。クリックで昇順/降順を切り替える */
export function DayHeader({ day, order, onToggle }: Props) {
  const style = weekendCellStyle(day);
  if (!onToggle) return <th className="text-end fw-normal" style={style}>{mmdd(day)}</th>;
  return (
    <th
      className="text-end fw-normal"
      style={{ ...style, cursor: 'pointer', userSelect: 'none' }}
      title={order === 'asc' ? 'クリックで降順に切替' : 'クリックで昇順に切替'}
      onClick={onToggle}
    >
      {mmdd(day)}
    </th>
  );
}

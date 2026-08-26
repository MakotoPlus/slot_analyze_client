'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { drillHref, peak, sum } from '@/lib/aggregate';
import { mmdd, num, payoutRate, signClass, signed, weekendCellStyle } from '@/lib/format';
import type { CompareResult, Dimension } from '@/types/api';

const SPARK_W = 52, SPARK_H = 24;

/** ミニ折れ線（直近値を強調）。カードが display:none の間も描けるよう固定サイズで描画する */
function MiniSpark({ values, color }: { values: number[]; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SPARK_W * dpr;
    canvas.height = SPARK_H * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, SPARK_W, SPARK_H);

    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const range = max - min || 1;
    const pad = 3;
    const x = (i: number) => pad + (i / (values.length - 1)) * (SPARK_W - pad * 2);
    const y = (v: number) => SPARK_H - pad - ((v - min) / range) * (SPARK_H - pad * 2);

    ctx.beginPath();
    values.forEach((v, i) => (i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v))));
    ctx.lineTo(x(values.length - 1), SPARK_H);
    ctx.lineTo(x(0), SPARK_H);
    ctx.closePath();
    ctx.fillStyle = color + '1c';
    ctx.fill();

    ctx.beginPath();
    values.forEach((v, i) => (i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v))));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const lv = values[values.length - 1];
    ctx.beginPath();
    ctx.arc(x(values.length - 1), y(lv), 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [values, color]);

  return <canvas ref={ref} className="sc-spark" />;
}

interface Props {
  targetLabel: string;
  result: CompareResult;
  dimension: Dimension;
  checkable?: boolean;
  checkedKeys?: Set<string>;
  onToggleCheck?: (key: string) => void;
  onUncheckAll?: () => void;
}

/** スマホ表示専用: 横スクロール表の代わりに対象ごとのカード（タップで日別内訳を展開）で見せる */
export function CardList({ targetLabel, result, dimension, checkable, checkedKeys, onToggleCheck, onUncheckAll }: Props) {
  const { days, series } = result;
  const dateFrom = days[0];
  const dateTo = days[days.length - 1];
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="card sc-mobile-only">
      <div className="card-body d-flex align-items-center justify-content-between" style={{ padding: '14px 16px 8px' }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>日別 差枚・出玉率</span>
          <span className="text-muted ms-2" style={{ fontSize: 12 }}>{targetLabel}をタップで日別内訳</span>
        </div>
        {checkable && (
          <button type="button" className="btn btn-sm" onClick={onUncheckAll}>全解除</button>
        )}
      </div>

      <div className="sc-cardlist">
        {series.map((s) => {
          const total = sum(s.payoutResult);
          const totalGame = sum(s.gameTotal);
          const peakMax = peak(s.payoutMax);
          const r = payoutRate(total, totalGame);
          const href = drillHref(dimension, s.key, dateFrom, dateTo);
          const open = openKeys.has(s.key);

          return (
            <div key={s.key} className={`sc-card${open ? ' open' : ''}`}>
              <button type="button" className="sc-card-head" onClick={() => toggle(s.key)}>
                {checkable && (
                  <input
                    type="checkbox"
                    className="form-check-input"
                    style={{ flex: '0 0 auto' }}
                    checked={checkedKeys?.has(s.key) ?? true}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => onToggleCheck?.(s.key)}
                  />
                )}
                <span className="sc-card-swatch" style={{ background: s.color }} />
                <span className="sc-card-id">
                  <span className="name">
                    {href ? (
                      <Link href={href} onClick={(e) => e.stopPropagation()}>{s.label}</Link>
                    ) : s.label}
                  </span>
                  <span className="sub">{s.sub}</span>
                </span>
                <MiniSpark values={s.payoutResult} color={s.color} />
                <span className="sc-card-stat">
                  <div className={`total tabular ${signClass(total)}`}>{signed(total)}</div>
                  <span className={`chip ${r === null ? '' : r >= 100 ? 'good' : 'bad'}`}>
                    {r === null ? '—' : r.toFixed(1) + '%'}
                  </span>
                </span>
                <svg className="sc-chev" viewBox="0 0 20 20" fill="none">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {open && (
                <div className="sc-card-days">
                  <div className="sc-day-head">
                    <span className="d">日付</span>
                    <span className="m">最高枚数</span>
                    <span className="p">差枚</span>
                    <span className="r">出玉率</span>
                  </div>
                  {days.map((d, i) => {
                    const has = s.unitCount[i] > 0;
                    const v = s.payoutResult[i];
                    const dayRate = has ? payoutRate(v, s.gameTotal[i]) : null;
                    return (
                      <div key={d} className="sc-day-row" style={weekendCellStyle(d)}>
                        <span className="d">{mmdd(d)}</span>
                        <span className="m tabular">{has ? num(s.payoutMax[i]) : '—'}</span>
                        <span className={`p tabular ${has ? signClass(v) : ''}`}>{has ? signed(v) : '—'}</span>
                        <span className={`r tabular ${dayRate === null ? '' : dayRate >= 100 ? 'text-success' : 'text-danger'}`}>
                          {dayRate === null ? '—' : dayRate.toFixed(1) + '%'}
                        </span>
                      </div>
                    );
                  })}
                  <div className="sc-day-total">
                    <span>最高 {num(peakMax)}</span>
                    <b className={`tabular ${signClass(total)}`}>{signed(total)}</b>
                    <span>{r === null ? '—' : r.toFixed(1) + '%'}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

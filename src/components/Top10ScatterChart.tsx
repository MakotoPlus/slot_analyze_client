'use client';

import { CategoryScale, Chart as ChartJS, Legend, LinearScale, PointElement, Tooltip } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { mmdd, num, signed } from '@/lib/format';
import { PALETTE } from '@/lib/format';
import type { Row } from './Top10View';

ChartJS.register(CategoryScale, LinearScale, PointElement, Tooltip, Legend);

interface ScatterPoint {
  x: string;
  y: number;
  slotNum: string;
  rate: number | null;
  rank: number;
}

export function Top10ScatterChart({ rows, days, height = 340 }: { rows: Row[]; days: string[]; height?: number }) {
  const dayLabels = days.map(mmdd);

  // 機種ごとに一貫した色を割り当てる（店舗を1つに絞っている前提なので数が少なく色分けが機能する）
  const models = [...new Set(rows.map((r) => r.modelName))].sort((a, b) => a.localeCompare(b, 'ja'));
  const colorOf = new Map(models.map((m, i) => [m, PALETTE[i % PALETTE.length]]));

  const datasets = models.map((model) => {
    const points: ScatterPoint[] = rows
      .filter((r) => r.modelName === model)
      .map((r) => ({ x: mmdd(r.day), y: r.payout, slotNum: r.slotNum, rate: r.rate, rank: r.rank }));
    const color = colorOf.get(model)!;
    return {
      label: model,
      data: points,
      backgroundColor: color,
      borderColor: '#1a2233',
      pointRadius: points.map((p) => (p.rank === 1 ? 7 : 4)),
      pointHoverRadius: points.map((p) => (p.rank === 1 ? 9 : 6)),
      pointBorderWidth: points.map((p) => (p.rank === 1 ? 2 : 0)),
      pointStyle: 'circle' as const,
    };
  });

  return (
    <div className="card">
      <div className="card-body" style={{ padding: '14px 16px 4px' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>日別 TOP10 分布（機種別）</span>
        <span className="text-muted ms-2" style={{ fontSize: 12 }}>点1つ＝TOP10入りした1台。縁取りの大きい点＝その日の1位</span>
      </div>
      <div style={{ padding: '4px 16px 16px' }}>
        <div className="sc-chart" style={{ position: 'relative', height }}>
          <Scatter
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle' as const, font: { size: 11 } },
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const p = ctx.raw as ScatterPoint;
                      const rateText = p.rate === null ? '—' : p.rate.toFixed(1) + '%';
                      return `${ctx.dataset.label} #${p.slotNum}: ${signed(p.y)}（機械割 ${rateText}／${p.rank}位）`;
                    },
                  },
                },
              },
              scales: {
                x: {
                  type: 'category' as const,
                  labels: dayLabels,
                  grid: { display: false },
                  ticks: { font: { size: 11 } },
                },
                y: {
                  grid: { color: '#eef0f3' },
                  ticks: { font: { size: 11 }, callback: (v) => num(Number(v)) },
                },
              },
            }}
            data={{ datasets }}
          />
        </div>
      </div>
    </div>
  );
}

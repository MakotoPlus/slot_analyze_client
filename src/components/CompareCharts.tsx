'use client';

import {
  BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale,
  LineElement, PointElement, Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { mmdd } from '@/lib/format';
import type { CompareResult } from '@/types/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded' as const, font: { size: 11 } },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: {
      grid: { color: '#eef0f3' },
      ticks: { font: { size: 11 }, callback: (v: string | number) => Number(v).toLocaleString('ja-JP') },
    },
  },
};

export function CompareCharts({ result, height = 280 }: { result: CompareResult; height?: number }) {
  const labels = result.days.map(mmdd);

  return (
    <>
      <div className="card">
        <div className="card-body" style={{ padding: '14px 16px 4px' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>差枚推移（折れ線）</span>
          <span className="text-muted ms-2" style={{ fontSize: 12 }}>日単位の合計差枚数</span>
        </div>
        <div style={{ padding: '4px 16px 16px' }}>
          <div className="sc-chart" style={{ position: 'relative', height }}>
            <Line
              options={baseOptions}
              data={{
                labels,
                datasets: result.series.map((s) => ({
                  label: s.label, data: s.payoutResult,
                  borderColor: s.color, backgroundColor: s.color,
                  borderWidth: 2, tension: 0.25, pointRadius: 2, pointHoverRadius: 4,
                })),
              }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: '14px 16px 4px' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>累計ゲーム数（棒グラフ）</span>
          <span className="text-muted ms-2" style={{ fontSize: 12 }}>日単位の合計ゲーム数</span>
        </div>
        <div style={{ padding: '4px 16px 16px' }}>
          <div className="sc-chart" style={{ position: 'relative', height }}>
            <Bar
              options={baseOptions}
              data={{
                labels,
                datasets: result.series.map((s) => ({
                  label: s.label, data: s.gameTotal,
                  backgroundColor: s.color, borderWidth: 0, borderRadius: 2,
                })),
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

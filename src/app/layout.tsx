import type { Metadata } from 'next';
import '@tabler/core/dist/css/tabler.min.css';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'スロット分析 — 比較ビュー',
  description: 'スクレイピング結果の機種／店舗／台単位比較',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

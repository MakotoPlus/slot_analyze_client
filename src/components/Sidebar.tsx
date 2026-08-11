'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/lib/auth';

const NAV = [
  { href: '/compare/store', label: '店舗単位サマリ比較' },
  { href: '/compare/model', label: '機種単位サマリ比較' },
  { href: '/compare/unit', label: '台単位サマリ比較' },
];

export function Sidebar() {
  const pathname = usePathname();
  // モバイルでは初期状態を閉じる
  const [open, setOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth > 820));

  return (
    <>
      <aside
        hidden={!open}
        className="sc-aside"
        style={{
          width: 300, flex: '0 0 300px', background: '#fff',
          borderRight: '1px solid #e6e7e9', position: 'sticky', top: 0, height: '100vh',
          display: open ? 'flex' : 'none', flexDirection: 'column',
        }}
      >
        <div className="p-3 border-bottom d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
          <div>
            <div style={{ fontWeight: 600 }}>スロット分析</div>
            <div className="text-muted" style={{ fontSize: 12 }}>スクレイピング結果 比較ビュー</div>
          </div>
          <button type="button" className="btn btn-sm" title="サイドバーを閉じる" onClick={() => setOpen(false)}>◀</button>
        </div>
        <nav className="p-2 d-flex flex-column border-bottom" style={{ gap: 4 }}>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`btn ${pathname === n.href ? 'btn-primary' : ''}`}
              style={{ justifyContent: 'flex-start', fontSize: 13.5 }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        {/* 検索条件パネルは各画面側 (CompareView) が portal 先としてこの要素を使う */}
        <div id="filter-slot" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }} />

        <div className="border-top p-2 d-flex justify-content-end">
          <button type="button" className="btn btn-sm" onClick={logout}>ログアウト</button>
        </div>
      </aside>

      {!open && (
        <button
          type="button"
          className="btn btn-sm"
          title="検索条件を表示"
          onClick={() => setOpen(true)}
          style={{ position: 'fixed', top: 16, left: 12, zIndex: 10, background: '#fff' }}
        >
          ▶ 検索条件
        </button>
      )}
    </>
  );
}

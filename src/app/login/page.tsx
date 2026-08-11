'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { login } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/compare/model';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return setError('ユーザーIDとパスワードを入力してください。');
    setBusy(true);
    setError('');
    try {
      await login(username.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <div className="card-body" style={{ padding: 28 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>スロット分析</div>
          <div className="text-muted" style={{ fontSize: 12.5, marginTop: 3, marginBottom: 20 }}>
            スクレイピング結果 比較ビュー
          </div>
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">ユーザーID</label>
              <input className="form-control" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">パスワード</label>
              <input type="password" className="form-control" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div className="text-danger mb-3" style={{ fontSize: 12 }}>{error}</div>}
            <button type="submit" className="btn btn-primary w-100" disabled={busy}>
              {busy ? 'ログイン中…' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}

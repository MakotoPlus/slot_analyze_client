// DRF SimpleJWT (rest_framework_simplejwt) を前提にしたトークン管理。
// access はメモリ + sessionStorage、refresh は sessionStorage に保持する。
// XSS 耐性を上げるなら、バックエンド側で HttpOnly Cookie 発行に切り替えるのが望ましい。

const ACCESS = 'sa.access';
const REFRESH = 'sa.refresh';

import { USE_MOCK } from './mock';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export interface TokenPair { access: string; refresh: string }

export const getAccess = () => (typeof window === 'undefined' ? null : sessionStorage.getItem(ACCESS));
export const getRefresh = () => (typeof window === 'undefined' ? null : sessionStorage.getItem(REFRESH));
export const isAuthenticated = () => !!getAccess();

export function setTokens(t: Partial<TokenPair>) {
  if (t.access) sessionStorage.setItem(ACCESS, t.access);
  if (t.refresh) sessionStorage.setItem(REFRESH, t.refresh);
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(REFRESH);
}

/** POST /api/token/ — 認証してトークンペアを取得 */
export async function login(username: string, password: string): Promise<void> {
  if (USE_MOCK) {
    // 開発用: バックエンド無しで画面を確認するためのダミー認証
    if (username !== 'demo' || password !== 'demo') {
      throw new Error('ユーザーIDまたはパスワードが正しくありません。(demo / demo)');
    }
    setTokens({ access: 'mock-access', refresh: 'mock-refresh' });
    return;
  }
  const res = await fetch(new URL('api/token/', BASE.endsWith('/') ? BASE : BASE + '/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (res.status === 401) throw new Error('ユーザーIDまたはパスワードが正しくありません。');
  if (!res.ok) throw new Error(`ログインに失敗しました (${res.status})`);
  setTokens((await res.json()) as TokenPair);
}

/** POST /api/token/refresh/ — access を再発行。失敗したら false */
export async function refreshAccess(): Promise<boolean> {
  if (USE_MOCK) return true;
  const refresh = getRefresh();
  if (!refresh) return false;
  const res = await fetch(new URL('api/token/refresh/', BASE.endsWith('/') ? BASE : BASE + '/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) { clearTokens(); return false; }
  setTokens(await res.json());
  return true;
}

export function logout() {
  clearTokens();
  if (typeof window !== 'undefined') window.location.href = '/login';
}

import { clearTokens, getAccess, refreshAccess } from './auth';
import type { Paginated } from '@/types/api';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function authHeaders(): HeadersInit {
  const token = getAccess();
  return token ? { Accept: 'application/json', Authorization: `Bearer ${token}` } : { Accept: 'application/json' };
}

/** 401 のとき refresh して 1 度だけ再試行する */
async function authedFetch(url: string, retry = true): Promise<Response> {
  const res = await fetch(url, { headers: authHeaders(), credentials: 'include' });
  if (res.status === 401 && retry) {
    if (await refreshAccess()) return authedFetch(url, false);
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
  }
  return res;
}

export async function apiGet<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(path.replace(/^\//, ''), BASE.endsWith('/') ? BASE : BASE + '/');
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await authedFetch(url.toString());
  if (!res.ok) throw new ApiError(`${res.status} ${res.statusText} — ${url.pathname}`, res.status);
  return (await res.json()) as T;
}

/** DRF の PageNumberPagination / 非ページングの両方を吸収して全件取得する */
export async function apiGetAll<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T[]> {
  const first = await apiGet<Paginated<T> | T[]>(path, { ...params, page_size: 1000 });
  if (Array.isArray(first)) return first;

  const out = [...first.results];
  let next = first.next;
  let guard = 0;
  while (next && guard++ < 100) {
    const page: Paginated<T> = await (await authedFetch(next)).json();
    out.push(...page.results);
    next = page.next;
  }
  return out;
}

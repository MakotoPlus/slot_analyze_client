'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/lib/auth';

/** 未認証なら /login へ退避する。トークンは sessionStorage なのでクライアント判定。 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) setOk(true);
    else router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  if (!ok) return null;
  return <>{children}</>;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Sidebar 内の #filter-slot に検索パネルを差し込む */
export function FilterSlot({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    setHost(document.getElementById('filter-slot'));
  }, []);
  return host ? createPortal(children, host) : null;
}

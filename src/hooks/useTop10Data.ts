'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGetAll } from '@/lib/apiClient';
import { USE_MOCK, mockTop10Records } from '@/lib/mock';
import type { TopPayoutRecord } from '@/types/api';

/**
 * 指定期間・指定店舗の台×日の生レコード一覧を取得する（TOP10 抽出はクライアント側で行う）。
 * 店舗の絞り込みはサーバ側（`store_id`）で行うため、未選択（undefined）の間は取得しない。
 */
export function useTop10Records(dateFrom: string, dateTo: string, storeId: number | undefined) {
  return useQuery({
    queryKey: ['top10-records', dateFrom, dateTo, storeId],
    enabled: storeId !== undefined,
    staleTime: 60_000,
    queryFn: () =>
      USE_MOCK
        ? Promise.resolve(mockTop10Records(dateFrom, dateTo, storeId))
        : apiGetAll<TopPayoutRecord>('/scraping/top10/', { date_from: dateFrom, date_to: dateTo, store_id: storeId }),
  });
}

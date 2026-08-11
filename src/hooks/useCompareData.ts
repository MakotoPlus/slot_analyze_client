'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGetAll } from '@/lib/apiClient';
import { USE_MOCK, mockPayouts, mockSlotModels, mockStores } from '@/lib/mock';
import { aggregate, buildTargets } from '@/lib/aggregate';
import type { CompareResult, Dimension, Payout, SearchCriteria, SlotModel, Store } from '@/types/api';

export function useStores() {
  return useQuery({
    queryKey: ['store'],
    queryFn: () => (USE_MOCK ? Promise.resolve(mockStores) : apiGetAll<Store>('/scraping/store/')),
    staleTime: 5 * 60_000,
  });
}

export function useSlotModels() {
  return useQuery({
    queryKey: ['slot_model'],
    queryFn: () => (USE_MOCK ? Promise.resolve(mockSlotModels) : apiGetAll<SlotModel>('/scraping/slot_model/')),
    staleTime: 5 * 60_000,
  });
}

function usePayouts(criteria: SearchCriteria | null) {
  return useQuery({
    queryKey: ['payout', criteria?.dateFrom, criteria?.dateTo],
    enabled: !!criteria,
    staleTime: 60_000,
    queryFn: () =>
      USE_MOCK
        ? Promise.resolve(mockPayouts(criteria!.dateFrom, criteria!.dateTo))
        // バックエンドに django-filter を入れたら効く。無くても全件取得で動作する。
        : apiGetAll<Payout>('/scraping/payout/', {
            operational_day__gte: criteria!.dateFrom,
            operational_day__lte: criteria!.dateTo,
          }),
  });
}

/** 選択肢一覧と、検索実行後の集計結果をまとめて返す */
export function useCompareData(dimension: Dimension, criteria: SearchCriteria | null) {
  const stores = useStores();
  const models = useSlotModels();
  const payouts = usePayouts(criteria);

  const allPayouts = payouts.data ?? [];
  const targets = buildTargets(dimension, stores.data ?? [], models.data ?? [], allPayouts);

  let result: CompareResult = { days: [], series: [] };
  if (criteria && criteria.ids.length > 0) {
    const picked = criteria.ids
      .map((id) => targets.find((t) => t.key === id))
      .filter((t): t is NonNullable<typeof t> => !!t);
    result = aggregate(picked, allPayouts, criteria.dateFrom, criteria.dateTo);
  }

  return {
    targets,
    result,
    isLoading: stores.isLoading || models.isLoading || payouts.isFetching,
    error: (stores.error ?? models.error ?? payouts.error) as Error | null,
  };
}

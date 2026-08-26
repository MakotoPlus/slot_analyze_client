'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet, apiGetAll } from '@/lib/apiClient';
import { USE_MOCK, mockSlotModels, mockStores, mockSummary } from '@/lib/mock';
import { catalogTargets, toCompareResult, type Target } from '@/lib/aggregate';
import { dateRange } from '@/lib/format';
import type { CompareResult, Dimension, GroupBy, SearchCriteria, SlotModel, Store, SummarySeries } from '@/types/api';

const GROUP_BY: Record<Dimension, GroupBy> = { store: 'store', model: 'slot_model', unit: 'slot_num' };

export function useStores() {
  return useQuery({
    queryKey: ['store'],
    queryFn: () => (USE_MOCK ? Promise.resolve(mockStores) : apiGetAll<Store>('/scraping/store/')),
    staleTime: 5 * 60_000,
  });
}

export function useSlotModels() {
  return useQuery({
    queryKey: ['slot_model', { is_active: true }],
    queryFn: () =>
      USE_MOCK
        ? Promise.resolve(mockSlotModels)
        : apiGetAll<SlotModel>('/scraping/slot_model/', { is_active: 'true' }),
    staleTime: 5 * 60_000,
  });
}

/**
 * 店舗/機種/台 単位の日別集計を GET /scraping/summary/ から取得する。
 * 集計自体はバックエンドで行われるため、クライアントは選んだ対象(ids)で絞り込むだけでよい。
 * ids に関わらず期間内の全対象をまとめて取得することで、選択の切替を再フェッチ無しで行える。
 */
function useSummary(dimension: Dimension, criteria: SearchCriteria | null) {
  return useQuery({
    queryKey: ['summary', dimension, criteria?.dateFrom, criteria?.dateTo],
    enabled: !!criteria,
    staleTime: 60_000,
    queryFn: () =>
      USE_MOCK
        ? Promise.resolve(mockSummary(dimension, criteria!.dateFrom, criteria!.dateTo))
        : apiGet<SummarySeries[]>('/scraping/summary/', {
            group_by: GROUP_BY[dimension],
            date_from: criteria!.dateFrom,
            date_to: criteria!.dateTo,
          }),
  });
}

/** 選択肢一覧と、検索実行後の集計結果をまとめて返す */
export function useCompareData(dimension: Dimension, criteria: SearchCriteria | null) {
  const stores = useStores();
  const models = useSlotModels();
  const summary = useSummary(dimension, criteria);

  const allSeries = summary.data ?? [];
  const seriesByKey = new Map(allSeries.map((s) => [s.key, s]));

  // store/model は台帳(store/slot_model)から候補を作る（期間にデータが無くても選べる）。
  // unit は台帳が無いため、summary が返した期間内の実在ユニットをそのまま候補にする。
  const targets: Target[] =
    dimension === 'unit'
      ? allSeries.map((s) => ({ key: s.key, label: s.label, sub: s.sub, groupId: Number(s.key.split(':')[1]) }))
      : catalogTargets(dimension, stores.data ?? [], models.data ?? []);
  const targetByKey = new Map(targets.map((t) => [t.key, t]));

  let result: CompareResult = { days: [], series: [] };
  if (criteria && criteria.ids.length > 0) {
    const days = dateRange(criteria.dateFrom, criteria.dateTo);
    const picked: SummarySeries[] = criteria.ids.map((id) => {
      const existing = seriesByKey.get(id);
      if (existing) return existing;
      const t = targetByKey.get(id);
      return { key: id, label: t?.label ?? id, sub: t?.sub ?? '', daily: [] };
    });
    result = toCompareResult(days, picked);
  }

  return {
    targets,
    result,
    isLoading: stores.isLoading || models.isLoading || summary.isFetching,
    error: (stores.error ?? models.error ?? summary.error) as Error | null,
  };
}

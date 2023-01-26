import React, { useMemo } from 'react';
import { InstanceCache } from 'infra/instance/models/cache';
import { useGetInstanceCacheStatisticsQuery } from 'renderer/apis/instance/getInstanceCacheStatistics';
import { useNavigatorTree } from 'renderer/contexts/NavigatorTreeContext';
import { EnrichedInstance } from 'infra/configuration/model/configuration';
import ItemCacheDetails, { ItemCacheStatistics } from 'renderer/components/item/cache/ItemCacheDetails';

type InstanceCacheDetailsProps = {
  row: InstanceCache;
};

export default function InstanceCacheDetails({ row }: InstanceCacheDetailsProps) {
  const { selectedItem } = useNavigatorTree();

  const item = useMemo<EnrichedInstance>(() => selectedItem as EnrichedInstance, [selectedItem]);

  const statisticsQuery = useGetInstanceCacheStatisticsQuery({ instanceId: item.id, cacheName: row.name });
  const statistics = useMemo<ItemCacheStatistics | undefined>(
    () =>
      statisticsQuery.data
        ? {
            gets: { value: statisticsQuery.data.gets },
            puts: { value: statisticsQuery.data.puts },
            evictions: { value: statisticsQuery.data.evictions },
            hits: { value: statisticsQuery.data.hits },
            misses: { value: statisticsQuery.data.misses },
            removals: { value: statisticsQuery.data.removals },
            size: { value: statisticsQuery.data.size },
          }
        : undefined,
    [statisticsQuery.data]
  );

  return <ItemCacheDetails statistics={statistics} />;
}
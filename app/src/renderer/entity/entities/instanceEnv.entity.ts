import { Entity } from 'renderer/entity/entity';
import { EnvProperty } from 'renderer/apis/requests/instance/env/getInstanceEnvProperties';
import { COPY_ID } from 'renderer/entity/actions';

export const instanceEnvEntity: Entity<EnvProperty> = {
  id: 'instanceEnv',
  columns: [
    {
      id: 'name',
      type: 'Text',
      labelId: 'name',
      width: 300,
      getTooltip: (item) => item.origin,
    },
    {
      id: 'value',
      type: 'Text',
      labelId: 'value',
      width: 300,
    },
  ],
  actions: [
    {
      id: COPY_ID,
      labelId: 'copy',
      icon: 'ContentCopyOutlined',
    },
  ],
  massActions: [
    {
      id: COPY_ID,
      labelId: 'copy',
      icon: 'ContentCopyOutlined',
    },
  ],
  globalActions: [],
  defaultOrder: [
    {
      id: 'name',
      direction: 'asc',
    },
  ],
  paging: false,
  getId: (item) => `${item.name}-${item.source}`,
  filterData: (data, filter) =>
    data.filter(
      (item) =>
        item.name?.toLowerCase().includes(filter.toLowerCase()) ||
        item.value?.toLowerCase().includes(filter.toLowerCase())
    ),
};

import React, { FunctionComponent, useCallback, useMemo } from 'react';
import TableComponent from 'renderer/components/table/TableComponent';
import { Entity } from 'renderer/entity/entity';
import { instanceLiquibaseChangeSetEntity } from 'renderer/entity/entities/instanceLiquibaseChangeSetEntity';
import {
  EnrichedLiquibaseChangeSet,
  useGetInstanceLiquibaseChangesetsQuery,
} from 'renderer/apis/requests/instance/liquibase/getInstanceLiquibaseChangesets';

type LiquibaseChangesetsTableProps = {
  instanceId: string;
  context: string;
};

const LiquibaseChangesetsTable: FunctionComponent<LiquibaseChangesetsTableProps> = ({ instanceId, context }) => {
  const entity = useMemo<Entity<EnrichedLiquibaseChangeSet>>(() => instanceLiquibaseChangeSetEntity, []);
  const queryState = useGetInstanceLiquibaseChangesetsQuery({ instanceId, context });

  const actionsHandler = useCallback(async (actionId: string, row: EnrichedLiquibaseChangeSet): Promise<void> => {},
  []);

  const massActionsHandler = useCallback(
    async (actionId: string, selectedRows: EnrichedLiquibaseChangeSet[]): Promise<void> => {},
    []
  );

  const globalActionsHandler = useCallback(async (actionId: string): Promise<void> => {}, []);

  return (
    <TableComponent
      entity={entity}
      data={queryState.data}
      loading={queryState.isLoading}
      refetchHandler={queryState.refetch}
      actionsHandler={actionsHandler}
      massActionsHandler={massActionsHandler}
      globalActionsHandler={globalActionsHandler}
    />
  );
};

export default LiquibaseChangesetsTable;

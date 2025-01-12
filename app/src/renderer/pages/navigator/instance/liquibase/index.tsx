import React, { FunctionComponent, useMemo } from 'react';
import Page from 'renderer/components/layout/Page';
import { useNavigatorLayoutContext } from 'renderer/contexts/NavigatorLayoutContext';
import { Card } from '@mui/material';
import { isEmpty, map } from 'lodash';
import EmptyContent from 'renderer/components/help/EmptyContent';
import TabPanel, { TabInfo } from 'renderer/components/layout/TabPanel';
import { useGetInstanceLiquibaseQuery } from 'renderer/apis/requests/instance/liquibase/getInstanceLiquibase';
import LiquibaseChangesetsTable from 'renderer/pages/navigator/instance/liquibase/components/LiquibaseChangesetsTable';
import { InstanceRO } from '../../../../../common/generated_definitions';
import LogoLoaderCenter from '../../../../components/common/LogoLoaderCenter';

const InstanceLiquibase: FunctionComponent = () => {
  const { selectedItem } = useNavigatorLayoutContext();

  const item = useMemo<InstanceRO>(() => selectedItem as InstanceRO, [selectedItem]);

  const contextsState = useGetInstanceLiquibaseQuery({ instanceId: item.id });

  const loading = useMemo<boolean>(() => contextsState.isLoading, [contextsState]);
  const empty = useMemo<boolean>(() => !loading && isEmpty(contextsState.data), [loading, contextsState]);

  const tabs = useMemo<TabInfo[] | undefined>(
    () =>
      contextsState.data
        ? map(contextsState.data.contexts, (context, contextKey) => ({ id: contextKey, label: contextKey, lazy: true }))
        : undefined,
    [contextsState.data]
  );

  return (
    <Page sx={{ height: '100%' }}>
      {loading && <LogoLoaderCenter />}

      {empty && <EmptyContent />}

      {tabs && (
        <Card>
          <TabPanel
            tabs={tabs}
            sx={{ backgroundColor: (theme) => theme.palette.background.neutral }}
            sxTabContainer={{ backgroundColor: (theme) => theme.palette.background.paper }}
          >
            {tabs.map((tab) => (
              <LiquibaseChangesetsTable instanceId={item.id} context={tab.id} key={tab.id} />
            ))}
          </TabPanel>
        </Card>
      )}
    </Page>
  );
};

export default InstanceLiquibase;

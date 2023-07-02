import Sidebar from 'renderer/components/menu/sidebar/Sidebar';
import { SidebarConfig } from 'renderer/components/menu/sidebar/SidebarSection';
import { urls } from 'renderer/routes/urls';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath } from 'react-router-dom';
import ItemHeader from 'renderer/components/item/ItemHeader';
import { Box } from '@mui/material';
import { IconViewer } from 'renderer/components/common/IconViewer';
import { getItemTypeIcon } from 'renderer/utils/itemUtils';
import { AgentRO } from 'common/generated_definitions';
import { BarChartOutlined } from '@mui/icons-material';

type AgentSidebarProps = { item: AgentRO; width: number };

export default function AgentSidebar({ item, width }: AgentSidebarProps) {
  const navConfig = useMemo<SidebarConfig>(
    () => [
      {
        id: 'overview',
        label: <FormattedMessage id={'overview'} />,
        items: [
          {
            id: 'dashboard',
            icon: <BarChartOutlined />,
            label: <FormattedMessage id={'dashboard'} />,
            to: generatePath(urls.agentDashboard.url, { id: item.id }),
          },
          {
            id: 'applications',
            icon: <IconViewer icon={getItemTypeIcon('application')} />,
            label: <FormattedMessage id={'applications'} />,
            to: generatePath(urls.agentApplications.url, { id: item.id }),
          },
        ],
      },
    ],
    [item]
  );

  return (
    <Box sx={{ width: width, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Sidebar sidebarConfig={navConfig} header={<ItemHeader item={item} />} sx={{ flexGrow: 1 }} />
    </Box>
  );
}
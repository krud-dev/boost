import { Card, CardContent, CardHeader, Stack } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import React, { ReactNode, useMemo } from 'react';
import { InstanceHttpRequestStatistics } from 'infra/instance/models/httpRequestStatistics';
import DonutMultiple from 'renderer/components/widget/pure/DonutMultiple';
import TableDetailsChart from 'renderer/components/table/details/TableDetailsChart';
import { HTTPS_REQUESTS_TIME_ROUND } from 'renderer/entity/entities/instanceHttpRequests.entity';
import { COMPONENTS_SPACING } from 'renderer/constants/ui';

export type InstanceHttpRequestChartsData = {
  label: string;
  statistics: InstanceHttpRequestStatistics;
}[];

type InstanceHttpRequestChartsProps = {
  title: ReactNode;
  data?: InstanceHttpRequestChartsData;
};

export default function InstanceHttpRequestCharts({ title, data }: InstanceHttpRequestChartsProps) {
  const countData = useMemo<
    | {
        label: string;
        value: number;
      }[]
    | undefined
  >(() => data?.map((v) => ({ label: v.label, value: v.statistics.count })), [data]);
  const totalTimeData = useMemo<
    | {
        label: string;
        value: number;
      }[]
    | undefined
  >(() => data?.map((v) => ({ label: v.label, value: v.statistics.totalTime })), [data]);
  const maxTimeData = useMemo<
    | {
        label: string;
        value: number;
      }[]
    | undefined
  >(() => data?.map((v) => ({ label: v.label, value: v.statistics.max })), [data]);

  return (
    <Card variant={'outlined'}>
      <CardHeader title={title} />
      <CardContent sx={{ px: 0 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={COMPONENTS_SPACING}>
          <TableDetailsChart
            title={<FormattedMessage id={'count'} />}
            chart={countData && <DonutMultiple data={countData} round={HTTPS_REQUESTS_TIME_ROUND} />}
          />
          <TableDetailsChart
            title={<FormattedMessage id={'maxTime'} />}
            chart={maxTimeData && <DonutMultiple data={maxTimeData} round={HTTPS_REQUESTS_TIME_ROUND} />}
          />
          <TableDetailsChart
            title={<FormattedMessage id={'totalTime'} />}
            chart={totalTimeData && <DonutMultiple data={totalTimeData} round={HTTPS_REQUESTS_TIME_ROUND} />}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

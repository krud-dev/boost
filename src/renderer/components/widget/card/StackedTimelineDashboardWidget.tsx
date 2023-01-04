import React, { FunctionComponent, useCallback, useMemo, useRef, useState } from 'react';
import { StackedTimelineWidget } from 'infra/dashboard/model';
import { DashboardWidgetCardProps } from 'renderer/components/widget/widget';
import DashboardGenericCard from 'renderer/components/widget/card/DashboardGenericCard';
import merge from 'lodash/merge';
import { styled } from '@mui/material/styles';
import ReactApexChart from 'react-apexcharts';
import BaseOptionChart from 'renderer/components/chart/BaseOptionChart';
import { ApexOptions } from 'apexcharts';
import { chain, every, isEmpty, isNaN, isNil, takeRight } from 'lodash';
import { useIntl } from 'react-intl';
import useWidgetSubscribeToMetrics from 'renderer/components/widget/hooks/useWidgetSubscribeToMetrics';
import useWidgetMetricsHistory from 'renderer/components/widget/hooks/useWidgetMetricsHistory';

const CHART_HEIGHT = 364;
const MAX_DATA_POINTS = 50;
const MIN_SECONDS_BETWEEN_DATA_POINTS = 5;

const ChartWrapperStyle = styled('div')(({ theme }) => ({
  height: CHART_HEIGHT,
  marginTop: theme.spacing(2),
  '& .apexcharts-canvas svg': { height: CHART_HEIGHT },
  '& .apexcharts-canvas svg,.apexcharts-canvas foreignObject': {
    overflow: 'visible',
  },
  padding: theme.spacing(0, 2),
}));

type DataPoint = { values: number[]; timestamp: number };

const StackedTimelineDashboardWidget: FunctionComponent<DashboardWidgetCardProps<StackedTimelineWidget>> = ({
  widget,
  item,
}) => {
  const intl = useIntl();

  const [data, setData] = useState<{ name: string; data: number[] }[]>(
    widget.metrics.map((metric) => ({ name: metric.title, data: [] }))
  );
  const [chartLabels, setChartLabels] = useState<string[]>([]);

  const dataPoint = useRef<DataPoint>({ values: [], timestamp: 0 });
  const lastDataPointTimestamp = useRef<number>(0);

  const isLoading = useMemo<boolean>(() => isEmpty(chartLabels), [chartLabels]);

  const metrics = useMemo<{ name: string; title: string; color: string }[]>(
    () =>
      chain(widget.metrics)
        .sortBy('order')
        .map((metric) => ({ name: metric.name, title: metric.title, color: metric.color }))
        .value(),
    [widget]
  );

  const metricNames = useMemo<string[]>(() => metrics.map((metric) => metric.name), [metrics]);

  useWidgetMetricsHistory(
    item.id,
    metricNames,
    new Date(Date.now() - MAX_DATA_POINTS * MIN_SECONDS_BETWEEN_DATA_POINTS * 1000),
    new Date(),
    (metricDtos) => {
      chain(metricDtos)
        .map((metricDto) => metricDto?.values || [])
        .unzip()
        .map((values) => ({ values: values.map((v) => v.value), timestamp: values[0].timestamp.getTime() }))
        .filter(
          (historyDataPoint) =>
            historyDataPoint.values.length === metrics.length && every(historyDataPoint.values, isValidValue)
        )
        .value()
        .forEach(addDataPoint);
    }
  );
  useWidgetSubscribeToMetrics(
    item.id,
    metricNames,
    (metricDto) => {
      const index = metrics.findIndex((metric) => metric.name === metricDto.name);
      dataPoint.current.values[index] = metricDto.values[0].value;
      dataPoint.current.timestamp = metricDto.values[0].timestamp.getTime();
      if (dataPoint.current.values.length === metrics.length && every(dataPoint.current.values, isValidValue)) {
        addDataPoint(dataPoint.current);
        dataPoint.current = { values: [], timestamp: 0 };
      }
    },
    { active: !isLoading }
  );

  const addDataPoint = useCallback((dataPointToAdd: DataPoint): void => {
    if (dataPointToAdd.timestamp - lastDataPointTimestamp.current < MIN_SECONDS_BETWEEN_DATA_POINTS * 1000) {
      return;
    }
    lastDataPointTimestamp.current = dataPointToAdd.timestamp;

    setData((prev) =>
      prev.map((series, index) => ({
        ...series,
        data: takeRight([...series.data, dataPointToAdd.values[index]], MAX_DATA_POINTS),
      }))
    );
    setChartLabels((prev) =>
      takeRight([...prev, intl.formatTime(dataPointToAdd.timestamp, { timeStyle: 'medium' })], MAX_DATA_POINTS)
    );
  }, []);

  const isValidValue = useCallback((value: number) => !isNil(value) && !isNaN(value), []);

  const chartColors = useMemo<string[]>(() => metrics.map((m) => m.color), [metrics]);

  const overrideOptions = useMemo<Partial<ApexOptions>>(
    () => ({
      chart: {
        stacked: true,
      },
      legend: { position: 'top', horizontalAlign: 'right' },
      xaxis: {
        categories: chartLabels,
      },
      colors: chartColors,
    }),
    [chartLabels, chartColors]
  );

  const chartOptions: ApexOptions = merge(BaseOptionChart(), overrideOptions);

  return (
    <DashboardGenericCard title={widget.title} loading={isLoading}>
      <ChartWrapperStyle dir="ltr">
        <ReactApexChart type="area" series={data} options={chartOptions} height={'100%'} width={'100%'} />
      </ChartWrapperStyle>
    </DashboardGenericCard>
  );
};
export default StackedTimelineDashboardWidget;

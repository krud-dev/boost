import React, { FunctionComponent, useCallback, useMemo, useRef, useState } from 'react';
import { DashboardWidgetCardProps, StackedTimelineWidget } from 'renderer/components/widget/widget';
import DashboardGenericCard from 'renderer/components/widget/card/DashboardGenericCard';
import { chain, every, isEmpty, isNaN, isNil, takeRight } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import useWidgetSubscribeToMetrics from 'renderer/components/widget/hooks/useWidgetSubscribeToMetrics';
import AreaMultiple from 'renderer/components/widget/pure/AreaMultiple';
import { formatWidgetChartValue } from 'renderer/utils/formatUtils';

const MAX_DATA_POINTS = 50;

type DataPoint = { values: number[]; timestamp: number };

const StackedTimelineDashboardWidget: FunctionComponent<DashboardWidgetCardProps<StackedTimelineWidget>> = ({
  widget,
  item,
  intervalSeconds,
}) => {
  const intl = useIntl();

  const [data, setData] = useState<{ name: string; data: number[] }[]>(
    widget.metrics.map((metric) => ({ name: intl.formatMessage({ id: metric.titleId }), data: [] }))
  );
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const loading = useMemo<boolean>(() => isEmpty(chartLabels), [chartLabels]);
  const empty = useMemo<boolean>(() => !loading && isEmpty(chartLabels), [loading, chartLabels]);

  const dataPoint = useRef<DataPoint>({ values: [], timestamp: 0 });
  const lastDataPointTimestamp = useRef<number>(0);

  const metrics = useMemo(() => chain(widget.metrics).sortBy('order').value(), [widget]);
  const metricNames = useMemo<string[]>(() => metrics.map((metric) => metric.name), [metrics]);

  useWidgetSubscribeToMetrics(item.id, metricNames, (metricDto) => {
    const index = metrics.findIndex((metric) => metric.name === metricDto.name);
    const metric = metrics[index];
    dataPoint.current.values[index] = formatWidgetChartValue(metricDto.value.value, metric.valueType);
    dataPoint.current.timestamp = metricDto.value.timestamp;
    if (dataPoint.current.values.length === metrics.length && every(dataPoint.current.values, isValidValue)) {
      addDataPoint(dataPoint.current);
      dataPoint.current = { values: [], timestamp: 0 };
    }
  });

  const addDataPoint = useCallback((dataPointToAdd: DataPoint): void => {
    if (dataPointToAdd.timestamp - lastDataPointTimestamp.current < intervalSeconds * 1000) {
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

  return (
    <DashboardGenericCard title={<FormattedMessage id={widget.titleId} />} loading={loading} empty={empty}>
      <AreaMultiple series={data} labels={chartLabels} colors={chartColors} tickAmount={MAX_DATA_POINTS / 4} />
    </DashboardGenericCard>
  );
};
export default StackedTimelineDashboardWidget;

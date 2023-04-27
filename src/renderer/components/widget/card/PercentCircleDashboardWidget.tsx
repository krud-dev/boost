import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import { DashboardWidgetCardProps, PercentCircleWidget } from 'renderer/components/widget/widget';
import DashboardGenericCard from 'renderer/components/widget/card/DashboardGenericCard';
import useWidgetSubscribeToMetrics from 'renderer/components/widget/hooks/useWidgetSubscribeToMetrics';
import { chain, isEmpty } from 'lodash';
import RadialBarSingle from 'renderer/components/widget/pure/RadialBarSingle';
import { InstanceMetricRO } from '../../../../common/generated_definitions';

const PercentCircleDashboardWidget: FunctionComponent<DashboardWidgetCardProps<PercentCircleWidget>> = ({
  widget,
  item,
  variant,
  sx,
}) => {
  const [data, setData] = useState<{ percent?: number }>({ percent: undefined });

  const loading = useMemo<boolean>(() => data.percent === undefined, [data]);
  const percent = useMemo<number>(() => Math.round((data.percent ?? 0) * 10000) / 100, [data]);
  const color = useMemo<string>(() => {
    if (isEmpty(widget.colorThresholds)) {
      return widget.color;
    }
    return chain(widget.colorThresholds)
      .filter((threshold) => percent >= threshold.value)
      .maxBy((threshold) => threshold.value)
      .value().color;
  }, [percent, widget]);

  const onMetricUpdate = useCallback(
    (metricDto?: InstanceMetricRO): void => {
      if (!metricDto) {
        return;
      }
      setData((prev) => ({ ...prev, percent: metricDto.values[0].value }));
    },
    [widget, setData]
  );

  const metricNames = useMemo<string[]>(() => [widget.metricName], [widget]);

  useWidgetSubscribeToMetrics(item.id, metricNames, onMetricUpdate);

  return (
    <DashboardGenericCard title={widget.title} loading={loading} variant={variant} sx={sx}>
      <RadialBarSingle title={widget.title} color={color} percent={percent} />
    </DashboardGenericCard>
  );
};
export default PercentCircleDashboardWidget;

import React, { useMemo } from 'react';
import DetailsLabelValueVertical from 'renderer/components/table/details/DetailsLabelValueVertical';
import { FormattedMessage } from 'react-intl';
import { Box, Card, CardContent, CardHeader, Chip } from '@mui/material';
import { isNil } from 'lodash';
import { MetricActuatorResponse } from '../../../../../../common/generated_definitions';

type MetricDetailsTagsProps = {
  metricDetails: MetricActuatorResponse;
  selectedTags: { [key: string]: string };
  onToggleTag: (tag: string, value: string) => void;
};

export default function MetricDetailsTags({ metricDetails, selectedTags, onToggleTag }: MetricDetailsTagsProps) {
  const show = useMemo<boolean>(() => !!metricDetails?.availableTags?.length, [metricDetails]);

  if (!show) {
    return null;
  }

  return (
    <Card variant={'outlined'}>
      <CardHeader title={<FormattedMessage id={'tags'} />} />
      <CardContent>
        {metricDetails.availableTags.map((tagDetails) => (
          <DetailsLabelValueVertical
            label={tagDetails.tag}
            value={
              <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {tagDetails.values.map((value) => {
                  const tagValue = selectedTags[tagDetails.tag];
                  const selected = tagValue === value;
                  const disabled =
                    !selected &&
                    ((!isNil(tagValue) && tagValue !== value) ||
                      !metricDetails.availableTags?.find((tag) => tag.tag === tagDetails.tag)?.values.includes(value));
                  return (
                    <Chip
                      label={value}
                      size={'small'}
                      color={selected ? 'primary' : 'default'}
                      disabled={disabled}
                      onClick={() => onToggleTag(tagDetails.tag, value)}
                      key={value}
                    />
                  );
                })}
              </Box>
            }
            sx={{ mt: 1.5 }}
            key={tagDetails.tag}
          />
        ))}
      </CardContent>
    </Card>
  );
}

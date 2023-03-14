import React, { useCallback, useMemo } from 'react';
import { Box, Card, CardContent, Stack } from '@mui/material';
import { ThreadLog } from './ThreadProfilingRequestDetailsDialog';
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';
import { FormattedMessage } from 'react-intl';
import FormattedDateAndRelativeTime from '../../../../../components/format/FormattedDateAndRelativeTime';
import ThreadLogStackTrace from './ThreadLogStackTrace';
import ToolbarButton from '../../../../../components/common/ToolbarButton';
import { useThreadLog } from '../contexts/ThreadLogContext';
import TableDetailsLabelValue from '../../../../../components/table/details/TableDetailsLabelValue';

type ThreadLogDetailsProps = {
  threadLog: ThreadLog;
  sx?: SxProps<Theme>;
};

export default function ThreadLogDetails({ threadLog, sx }: ThreadLogDetailsProps) {
  const { toggleOpenHandler } = useThreadLog();

  const showStackTrace = useMemo<boolean>(() => threadLog.stackTrace.length > 0, [threadLog.stackTrace]);

  const closeHandler = useCallback((): void => {
    toggleOpenHandler(threadLog);
  }, [toggleOpenHandler, threadLog]);

  return (
    <Card variant={'outlined'} sx={{ ...sx }}>
      <CardContent sx={{ minWidth: 400, position: 'relative' }}>
        <ToolbarButton
          tooltipLabelId={'close'}
          icon={'CloseOutlined'}
          onClick={closeHandler}
          sx={{ position: 'absolute', top: (theme) => theme.spacing(1), right: (theme) => theme.spacing(1) }}
        />
        <Stack direction={'column'} spacing={1.5}>
          <TableDetailsLabelValue label={<FormattedMessage id={'index'} />} value={threadLog.index} />
          <TableDetailsLabelValue
            label={<FormattedMessage id={'time'} />}
            value={<FormattedDateAndRelativeTime value={threadLog.creationTime} showRelative={false} />}
          />
          <TableDetailsLabelValue label={<FormattedMessage id={'threadId'} />} value={threadLog.threadId} />
          <TableDetailsLabelValue label={<FormattedMessage id={'threadName'} />} value={threadLog.threadName} />
          <TableDetailsLabelValue label={<FormattedMessage id={'threadState'} />} value={threadLog.threadState} />
          <TableDetailsLabelValue label={<FormattedMessage id={'blockedCount'} />} value={threadLog.blockedCount} />
          <TableDetailsLabelValue label={<FormattedMessage id={'blockedTime'} />} value={threadLog.blockedTime} />
          <TableDetailsLabelValue label={<FormattedMessage id={'waitedCount'} />} value={threadLog.waitedCount} />
          <TableDetailsLabelValue label={<FormattedMessage id={'waitedTime'} />} value={threadLog.waitedTime} />
          <TableDetailsLabelValue label={<FormattedMessage id={'lockName'} />} value={threadLog.lockName} />
          <TableDetailsLabelValue label={<FormattedMessage id={'lockOwnerId'} />} value={threadLog.lockOwnerId} />
          <TableDetailsLabelValue label={<FormattedMessage id={'lockOwnerName'} />} value={threadLog.lockOwnerName} />
        </Stack>

        {showStackTrace && (
          <Box sx={{ mt: 2 }}>
            <ThreadLogStackTrace threadLog={threadLog} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
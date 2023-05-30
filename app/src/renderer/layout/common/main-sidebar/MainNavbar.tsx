import { AppBar, Box, Divider, IconButton, Stack, Toolbar, Tooltip } from '@mui/material';
import { COMPONENTS_SPACING, NAVBAR_HEIGHT } from 'renderer/constants/ui';
import { Home } from '@mui/icons-material';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { urls } from 'renderer/routes/urls';
import { IconViewer } from 'renderer/components/common/IconViewer';
import { useSettings } from 'renderer/contexts/SettingsContext';
import { isMac } from 'renderer/utils/platformUtils';
import WindowControls from './navbar/WindowControls';
import { useMaximizeWindow } from '../../../apis/requests/ui/maximizeWindow';
import SettingsMenu from './navbar/SettingsMenu';
import HelpMenu from './navbar/HelpMenu';
import { FormattedMessage } from 'react-intl';
import AppFeedbackMenu from './navbar/AppFeedbackMenu';

export const NAVBAR_TOOLTIP_DELAY = 1000;

type MainNavbarProps = {};

export default function MainNavbar({}: MainNavbarProps) {
  const { isRtl, daemonHealthy } = useSettings();
  const navigate = useNavigate();

  const homeHandler = useCallback(() => {
    navigate(urls.home.url);
  }, [navigate]);

  const backHandler = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const forwardHandler = useCallback(() => {
    navigate(1);
  }, [navigate]);

  const maximizeWindowState = useMaximizeWindow();

  const toggleMaximizeHandler = useCallback(async (): Promise<void> => {
    await maximizeWindowState.mutateAsync({});
  }, []);

  return (
    <AppBar
      position={'static'}
      onDoubleClick={toggleMaximizeHandler}
      sx={{
        minHeight: NAVBAR_HEIGHT,
        display: 'flex',
        backgroundColor: (theme) => theme.palette.background.default,
        '-webkit-user-select': 'none',
        '-webkit-app-region': 'drag',
      }}
    >
      <Toolbar disableGutters sx={{ flexGrow: 1, pl: COMPONENTS_SPACING, pr: !isMac ? '0' : COMPONENTS_SPACING }}>
        {daemonHealthy && (
          <Stack direction="row" spacing={0.5} sx={{ pl: isMac ? 8 : 0 }}>
            <Box sx={{ '-webkit-app-region': 'no-drag' }}>
              <Tooltip title={<FormattedMessage id={'home'} />} enterDelay={NAVBAR_TOOLTIP_DELAY}>
                <IconButton size={'small'} onClick={homeHandler} sx={{ color: 'text.primary' }}>
                  <Home fontSize={'medium'} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ '-webkit-app-region': 'no-drag' }}>
              <Tooltip title={<FormattedMessage id={'back'} />} enterDelay={NAVBAR_TOOLTIP_DELAY}>
                <IconButton size={'small'} onClick={backHandler} sx={{ color: 'text.primary' }}>
                  <IconViewer
                    icon={isRtl ? 'KeyboardArrowRightOutlined' : 'KeyboardArrowLeftOutlined'}
                    fontSize={'medium'}
                    sx={{ color: 'text.primary' }}
                  />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ '-webkit-app-region': 'no-drag' }}>
              <Tooltip title={<FormattedMessage id={'forward'} />} enterDelay={NAVBAR_TOOLTIP_DELAY}>
                <IconButton size={'small'} onClick={forwardHandler} sx={{ color: 'text.primary' }}>
                  <IconViewer
                    icon={isRtl ? 'KeyboardArrowLeftOutlined' : 'KeyboardArrowRightOutlined'}
                    fontSize={'medium'}
                    sx={{ color: 'text.primary' }}
                  />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={0.5}>
          <HelpMenu />
          <AppFeedbackMenu />
          <SettingsMenu />
        </Stack>

        {!isMac && <WindowControls sx={{ pl: 2, '-webkit-app-region': 'no-drag' }} />}
      </Toolbar>
      <Divider />
    </AppBar>
  );
}

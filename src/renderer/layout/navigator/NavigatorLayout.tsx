import { experimentalStyled as styled, useTheme } from '@mui/material/styles';
import NavigatorNavbar from 'renderer/layout/navigator/components/NavigatorNavbar';
import { Allotment, LayoutPriority } from 'allotment';
import NavigatorSidebar from 'renderer/layout/navigator/components/NavigatorSidebar';
import { useMemo } from 'react';
import { NAVBAR_HEIGHT, SIDEBAR_DEFAULT_WIDTH } from 'renderer/constants/ui';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Outlet } from 'react-router-dom';
import useConfigurationStoreState from 'renderer/hooks/useConfigurationStoreState';
import { NavigatorTreeProvider } from 'renderer/contexts/NavigatorTreeContext';

const RootStyle = styled('div')({
  height: '100%',
  overflow: 'hidden',
});

const MainStyle = styled('div')(({ theme }) => ({
  height: '100vh',
  overflow: 'hidden',
}));

type NavigatorLayoutProps = {};

export default function NavigatorLayout({}: NavigatorLayoutProps) {
  const theme = useTheme();

  const [sidebarWidth, setSidebarWidth] = useConfigurationStoreState<number>('sidebarWidth', SIDEBAR_DEFAULT_WIDTH);

  const defaultSizes = useMemo<number[]>(() => [sidebarWidth, window.innerWidth - sidebarWidth], []);

  return (
    <NavigatorTreeProvider>
      <RootStyle>
        <NavigatorNavbar sidebarWidth={sidebarWidth} />
        <Allotment
          defaultSizes={defaultSizes}
          proportionalLayout={false}
          onChange={(sizes) => setSidebarWidth(sizes[0])}
        >
          <Allotment.Pane minSize={200} maxSize={500} snap>
            <NavigatorSidebar width={sidebarWidth} />
          </Allotment.Pane>
          <Allotment.Pane priority={LayoutPriority.High}>
            <MainStyle
              sx={{
                paddingTop: `${NAVBAR_HEIGHT}px`,
                transition: theme.transitions.create('margin', {
                  duration: theme.transitions.duration.complex,
                }),
              }}
            >
              <PerfectScrollbar options={{ wheelPropagation: false }}>
                <Outlet />
              </PerfectScrollbar>
            </MainStyle>
          </Allotment.Pane>
        </Allotment>
      </RootStyle>
    </NavigatorTreeProvider>
  );
}

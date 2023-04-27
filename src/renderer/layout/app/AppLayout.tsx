import MainNavbar from 'renderer/layout/common/main-sidebar/MainNavbar';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

type AppLayoutProps = {};

export default function AppLayout({}: AppLayoutProps) {
  return (
    <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <MainNavbar />
      <Box sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

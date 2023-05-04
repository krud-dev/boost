import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ThemeConfig from 'renderer/theme/ThemeConfig';
import NiceModal from '@ebay/nice-modal-react';
import NotistackProvider from 'renderer/components/snackbar/NotistackProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import useQueryClient from 'renderer/apis/useQueryClient';
import { SettingsContext, SettingsProvider } from 'renderer/contexts/SettingsContext';
import Router from 'renderer/routes/routes';
import { StompProvider } from './apis/websockets/StompContext';
import ApiErrorManager from './apis/ApiErrorManager';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import NewVersionManager from './components/managers/NewVersionManager';
import AnalyticsEventsManager from './components/managers/AnalyticsEventsManager';

export default function App() {
  const queryClient = useQueryClient();

  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <StompProvider>
          <SettingsProvider>
            <SettingsContext.Consumer>
              {({ darkMode, localeInfo }) => (
                <AnalyticsProvider>
                  <IntlProvider
                    locale={localeInfo.locale}
                    messages={localeInfo.messages}
                    onError={(err) => {
                      if (err.code === 'MISSING_TRANSLATION') {
                        console.warn('Missing translation', err.message);
                        return;
                      }
                      throw err;
                    }}
                  >
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={localeInfo.dateLocalization}>
                      <ThemeConfig
                        isDarkMode={darkMode}
                        isRtl={localeInfo.direction === 'rtl'}
                        localization={localeInfo.materialUiLocalization}
                      >
                        <NotistackProvider>
                          <NiceModal.Provider>
                            <ApiErrorManager />
                            <AnalyticsEventsManager />
                            <NewVersionManager />

                            <Router />
                          </NiceModal.Provider>
                        </NotistackProvider>
                      </ThemeConfig>
                    </LocalizationProvider>
                  </IntlProvider>
                </AnalyticsProvider>
              )}
            </SettingsContext.Consumer>
          </SettingsProvider>
        </StompProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

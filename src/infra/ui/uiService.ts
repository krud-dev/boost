import { BrowserWindow, nativeTheme } from 'electron';
import { ElectronTheme } from './models/electronTheme';
import log from 'electron-log';

class UiService {
  private window: BrowserWindow | undefined;

  initialize(window: BrowserWindow) {
    log.info(`Initializing ui service for window ${window.id}`);

    this.window = window;

    nativeTheme.on('updated', () => {
      window.webContents.send('app:themeUpdated', this.getElectronTheme());
    });
  }

  getElectronTheme(): ElectronTheme {
    return {
      shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
      shouldUseHighContrastColors: nativeTheme.shouldUseHighContrastColors,
      shouldUseInvertedColorScheme: nativeTheme.shouldUseInvertedColorScheme,
    };
  }

  getThemeSource(): 'system' | 'light' | 'dark' {
    return nativeTheme.themeSource;
  }

  setThemeSource(themeSource: 'system' | 'light' | 'dark') {
    nativeTheme.themeSource = themeSource;
  }

  minimizeWindow(): void {
    this.window?.minimize();
  }

  maximizeWindow(): void {
    if (this.window?.isMaximized()) {
      this.window?.unmaximize();
    } else {
      this.window?.maximize();
    }
  }

  closeWindow(): void {
    this.window?.close();
  }
}

export const uiService = new UiService();

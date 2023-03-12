import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';
import { app } from 'electron';
import axios from 'axios';
import log from 'electron-log';
import { systemEvents } from '../events';
import { isWindows } from '../utils/platform';

type DaemonOptions = {
  protocol: 'http' | 'https';
  host: string;
  port: number | 'random';
  external: Boolean;
};

export class DaemonController {
  private readonly options: DaemonOptions;

  private readonly internalPort: number | undefined;

  readonly daemonAddress: string;

  readonly daemonWsAddress: string;

  private started: boolean = false;

  private running: boolean = false;

  private healthCheckInterval: NodeJS.Timeout | undefined;

  private readonly defaultDaemonLocation = path.join(process.resourcesPath, 'daemon', 'daemon.jar');

  private readonly daemonDatabaseLocation = path.join(app.getPath('userData'), 'daemon.sqlite');

  private readonly defaultJdkLocation = path.join(process.resourcesPath, 'jdk', 'bin', isWindows ? 'java.exe' : 'java');

  private daemonProcess?: ChildProcessWithoutNullStreams = undefined;

  constructor(options: DaemonOptions) {
    this.options = options;
    let { port } = options;
    if (port === 'random') {
      if (options.external) {
        throw new Error('Cannot use random port with external daemon');
      }
      port = Math.floor(Math.random() * 10000) + 10000; // todo: check if port is available
    }
    this.daemonAddress = `${options.protocol}://${options.host}:${port}`;
    this.daemonWsAddress = `${options.protocol === 'http' ? 'ws' : 'wss'}://${options.host}:${port}/ws`;
    this.internalPort = port;
  }

  async start() {
    return new Promise<void>((resolve) => {
      if (!this.options.external) {
        log.info(`Starting daemon on ${this.daemonAddress}...`);
        this.initDaemonProcess();
      } else {
        log.info(`Using external daemon on ${this.daemonAddress}...`);
      }

      this.startHealthCheck();
    });
  }

  async stop() {
    this.stopHealthCheck();
    if (this.daemonProcess) {
      log.info('Stopping daemon...');
      this.daemonProcess.kill();
      this.daemonProcess = undefined;
    }
  }

  private startHealthCheck() {
    if (this.healthCheckInterval) {
      throw new Error('Health check is already running');
    }
    log.info('Starting health check...');
    this.healthCheckInterval = setInterval(async () => {
      try {
        const response = await axios.get(this.daemonAddress);
        if (response.status === 200) {
          if (!this.started) {
            log.info('Daemon is ready!');
            systemEvents.emit('daemon-ready');
          }
          if (!this.running && this.started) {
            log.info('Daemon is healthy!');
            systemEvents.emit('daemon-healthy');
          }
          this.running = true;
          this.started = true;
        } else {
          throw new Error('Daemon is not running!');
        }
      } catch (err) {
        if (this.running && this.started) {
          log.info('Daemon is unhealthy!');
          systemEvents.emit('daemon-unhealthy');
        }
        this.running = false;
      }
    }, 1000);
  }

  private stopHealthCheck() {
    if (!this.healthCheckInterval) {
      throw new Error('Health check is not running');
    }
    log.info('Stopping health check...');
    clearInterval(this.healthCheckInterval);
    this.healthCheckInterval = undefined;
  }

  private initDaemonProcess() {
    if (this.daemonProcess) {
      throw new Error('Daemon is already running');
    }
    if (this.options.external) {
      throw new Error('Cannot start internal daemon process with external flag');
    }

    const env = {
      IP: this.options.host,
      SERVER_PORT: String(this.internalPort),
      SPRING_DATASOURCE_URL: `jdbc:sqlite:${this.daemonDatabaseLocation}`,
    };

    if (!app.isPackaged) {
      log.info('Running daemon from source...');
      this.daemonProcess = spawn(isWindows ? './gradlew' : './gradlew.bat', ['bootRun'], {
        cwd: path.join(__dirname, '..', '..', 'daemon'),
        env: { ...process.env, ...env },
      });
    } else {
      log.info('Running daemon from jar...');
      this.daemonProcess = spawn(this.defaultJdkLocation, ['-jar', this.defaultDaemonLocation], {
        env: { ...process.env, ...env },
      });
    }

    process.on('exit', () => {
      if (this.daemonProcess) {
        this.daemonProcess.kill();
      }
    });

    this.daemonProcess.on('error', (err) => {
      log.error(`Failed to start daemon: ${err}`);
      app.exit();
    });

    this.daemonProcess.on('close', (code) => {
      log.error(`Daemon exited with code ${code}`);
      app.exit();
    });

    this.daemonProcess.stdout.on('data', (data) => {
      log.info(`daemon: ${data}`);
    });

    this.daemonProcess.stderr.on('data', (data) => {
      log.error(`daemon: ${data}`);
    });
  }
}

let daemonController: DaemonController | undefined;

export function getDaemonController(): DaemonController | undefined {
  return daemonController;
}

export async function initDaemon(): Promise<DaemonController> {
  if (daemonController) {
    return daemonController;
  }
  if (app.isPackaged) {
    daemonController = new DaemonController({
      protocol: 'http',
      host: '127.0.0.1',
      port: 'random',
      external: false,
    });
  } else {
    daemonController = new DaemonController({
      host: '127.0.0.1',
      port: 12222,
      protocol: 'http',
      external: true,
    });
  }
  daemonController.start().catch((e) => {
    log.error('Error starting daemon', e);
    app.exit(1);
  });
  return daemonController;
}

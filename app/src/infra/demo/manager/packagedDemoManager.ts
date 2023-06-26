import { DemoManager } from './demoManager';
import path from 'path';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import log from 'electron-log';
import { isWindows } from '../../utils/platform';
import axios from 'axios';

export class PackagedDemoManager implements DemoManager {
  private readonly address: string;

  private readonly host: string = 'localhost';

  private readonly port: number;

  private readonly defaultJdkLocation = path.join(process.resourcesPath, 'jdk', 'bin', isWindows ? 'java.exe' : 'java');

  private readonly defaultDemoLocation = path.join(process.resourcesPath, 'demo');

  private readonly defaultDemoJarLocation = path.join(this.defaultDemoLocation, 'demo.jar');

  private childProcess?: ChildProcessWithoutNullStreams = undefined;

  constructor() {
    this.port = Math.floor(Math.random() * 10000) + 10000;
    this.address = `http://${this.host}:${this.port}/actuator`;
  }

  async doHealthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(this.getAddress());
      if (response.status >= 200 && response.status < 300) {
        return true;
      }

      return false;
    } catch (err) {
      if (err instanceof Error) {
        log.error(`Error while checking demo health: ${err.message}`);
        return false;
      }

      log.error(`Error while checking demo health: ${err}`);
      return false;
    }
  }

  getAddress(): string {
    return this.address;
  }

  start(): Promise<void> {
    if (this.childProcess) {
      log.warn('Packaged Demo is already started');
      return Promise.resolve();
    }

    const env = {
      SERVER_ADDRESS: this.host,
      SERVER_PORT: String(this.port),
      LOGGING_FILE_NAME: path.join(this.defaultDemoLocation, 'demo.log'),
    };

    log.info(`Running demo from jar on ${this.address}...`);
    this.childProcess = spawn(this.defaultJdkLocation, ['-jar', this.defaultDemoJarLocation], {
      env: { ...process.env, ...env },
    });
    log.info(`Demo process started with PID: ${this.childProcess.pid}`);
    this.initProcessEvents();
    let healthCheckAttempts = 0;
    const promise = new Promise<void>((resolve, reject) => {
      const healthCheck = setInterval(async () => {
        if (healthCheckAttempts > 60) {
          clearInterval(healthCheck);
          if (this.childProcess) {
            this.childProcess.kill();
            this.childProcess = undefined;
          }
          reject(new Error('Demo process did not start in time'));
          return;
        }
        try {
          const isHealthy = await this.doHealthCheck();
          if (isHealthy) {
            clearInterval(healthCheck);
            resolve();
            return;
          }
        } catch (e) {
        } finally {
          healthCheckAttempts += 1;
        }
      }, 1000);
    });

    return promise;
  }

  async stop(): Promise<void> {
    if (this.childProcess) {
      log.info('Stopping demo process...');
      this.childProcess.kill();
      this.childProcess = undefined;
    }
  }

  private initProcessEvents() {
    if (!this.childProcess) {
      return;
    }

    this.childProcess.stdout.on('data', (data) => {
      log.debug(`demo: ${data}`);
    });

    this.childProcess.stderr.on('data', (data) => {
      log.error(`demo: ${data}`);
    });

    process.on('exit', () => {
      this.childProcess?.kill();
    });
  }
}

import NodeCache from 'node-cache';
import {
  Application,
  ApplicationHealth,
  ApplicationHealthStatus,
  Instance,
  InstanceHealth
} from '../configuration/model/configuration';
import { configurationService } from '../configuration/configurationService';
import { BrowserWindow } from 'electron';
import log from 'electron-log';
import EventEmitter from 'events';
import { ApplicationCache, InstanceCache } from './models/cache';
import { systemEvents } from '../events';
import { ApplicationLogger, InstanceLogger } from './models/logger';
import { actuatorClientStore } from '../actuator/actuatorClientStore';
import { ActuatorLogLevel, isActuatorLoggerGroup } from '../actuator/model/loggers';

class InstanceService {
  private readonly instanceHealthCache = new NodeCache();

  private readonly applicationHealthCache = new NodeCache();

  private readonly endpointsCache = new NodeCache();

  private readonly events: EventEmitter = new EventEmitter();

  constructor() {
    const invalidateInstanceAndApplication = (instance: Instance) => {
      this.invalidateInstance(instance);
      this.invalidateApplication(instance.parentApplicationId);
    };

    systemEvents.on('instance-updated', invalidateInstanceAndApplication);
    systemEvents.on('instance-created', invalidateInstanceAndApplication);
    systemEvents.on('instance-deleted', invalidateInstanceAndApplication);
    systemEvents.on('instance-moved', (instance, oldApplicationId, newParentApplicationId) => {
      this.invalidateApplication(oldApplicationId);
      this.invalidateApplication(newParentApplicationId);
    });

    systemEvents.on('application-updated', (application) => this.invalidateApplication(application.id));
    systemEvents.on('application-created', (application) => this.invalidateApplication(application.id));
    systemEvents.on('application-deleted', (application) => this.invalidateApplication(application.id));
  }

  initializeListeners(window: BrowserWindow) {
    log.info(`Initializing listeners for window ${window.id}`);
    this.events.addListener('app:instanceHealthUpdated', (key: string, value: InstanceHealth) => {
      window.webContents.send('app:instanceHealthUpdated', key, value);
    });
    this.events.addListener('app:applicationHealthUpdated', (key: string, value: ApplicationHealth) => {
      window.webContents.send('app:applicationHealthUpdated', key, value);
    });
    this.events.addListener('app:instanceEndpointsUpdated', (key: string, value: string[]) => {
      window.webContents.send('app:instanceEndpointsUpdated', key, value);
    });
  }

  /**
   * Loggers
   */
  async getInstanceLoggers(instanceId: string): Promise<InstanceLogger[]> {
    const instance = configurationService.getInstanceOrThrow(instanceId);
    const client = actuatorClientStore.getActuatorClient(instance.id);
    const { loggers } = await client.loggers();
    return Object.entries(loggers).map(([name, logger]) => ({
      name,
      ...logger,
    }));
  }

  async getInstanceLogger(instanceId: string, loggerName: string): Promise<InstanceLogger> {
    const client = actuatorClientStore.getActuatorClient(instanceId);
    const logger = await client.logger(loggerName);
    if (isActuatorLoggerGroup(logger)) {
      throw new Error('Logger is a group');
    } else {
      return {
        name: loggerName,
        configuredLevel: logger.configuredLevel,
        effectiveLevel: logger.effectiveLevel,
      };
    }
  }

  async setInstanceLoggerLevel(
    instanceId: string,
    loggerName: string,
    level: ActuatorLogLevel | undefined
  ): Promise<void> {
    const client = actuatorClientStore.getActuatorClient(instanceId);
    await client.updateLogger(loggerName, level);
  }

  async getApplicationLoggers(applicationId: string): Promise<ApplicationLogger[]> {
    const instances = configurationService.getApplicationInstances(applicationId);
    const instanceLoggersPromise = instances.map(async (instance) => ({
      instanceId: instance.id,
      instanceLoggers: await this.getInstanceLoggers(instance.id).catch(() => []),
    }));

    const instancesLoggers = await Promise.all(instanceLoggersPromise);
    const result: { [key: string]: ApplicationLogger } = {};

    for (const { instanceId, instanceLoggers } of instancesLoggers) {
      for (const instanceLogger of instanceLoggers) {
        const applicationLogger: ApplicationLogger = (result[instanceLogger.name] = result[instanceLogger.name] ?? {
          name: instanceLogger.name,
          instanceLoggers: {},
        });
        applicationLogger.instanceLoggers[instanceId] = instanceLogger;
      }
    }
    return Object.values(result);
  }

  async getApplicationLogger(applicationId: string, loggerName: string): Promise<ApplicationLogger> {
    const instances = configurationService.getApplicationInstances(applicationId);
    const instancesLoggerPromises = instances.map(async (instance) => ({
      instanceId: instance.id,
      instanceLogger: await this.getInstanceLogger(instance.id, loggerName).catch(() => null),
    }));

    const instancesLogger = await Promise.all(instancesLoggerPromises);
    const result: ApplicationLogger = {
      name: loggerName,
      instanceLoggers: {},
    };

    for (const { instanceId, instanceLogger } of instancesLogger) {
      if (instanceLogger) {
        result.instanceLoggers[instanceId] = instanceLogger;
      }
    }
    return result;
  }

  async setApplicationLoggerLevel(
    applicationId: string,
    loggerName: string,
    level: ActuatorLogLevel | undefined
  ): Promise<void> {
    const instances = configurationService.getApplicationInstances(applicationId);
    const instancesLoggerPromises = instances.map(async (instance) => {
      await this.setInstanceLoggerLevel(instance.id, loggerName, level).catch(() => null);
    });
    await Promise.all(instancesLoggerPromises);
  }

  async getInstanceCaches(instanceId: string): Promise<InstanceCache[]> {
    const client = actuatorClientStore.getActuatorClient(instanceId);
    const response = await client.caches();
    const result: InstanceCache[] = [];
    for (const [cacheManagerName, { caches }] of Object.entries(response.cacheManagers)) {
      for (const [cacheName, cache] of Object.entries(caches)) {
        result.push({
          name: cacheName,
          cacheManager: cacheManagerName,
          target: cache.target,
        });
      }
    }
    return result;
  }

  async getInstanceCache(instanceId: string, cacheName: string): Promise<InstanceCache> {
    const client = actuatorClientStore.getActuatorClient(instanceId);
    const response = await client.cache(cacheName);
    return response;
  }

  async evictInstanceCaches(instanceId: string, cacheNames: string[]): Promise<void> {
    const client = actuatorClientStore.getActuatorClient(instanceId);
    await Promise.all(cacheNames.map((cacheName) => client.evictCache(cacheName)));
  }

  async evictAllInstanceCaches(instanceId: string): Promise<void> {
    const client = actuatorClientStore.getActuatorClient(instanceId);
    await client.evictAllCaches();
  }

  async getApplicationCaches(applicationId: string): Promise<ApplicationCache[]> {
    const instances = configurationService.getApplicationInstances(applicationId);
    const instanceCachesPromises = instances.map(async (instance) => ({
      instanceId: instance.id,
      instanceCaches: await this.getInstanceCaches(instance.id).catch(() => []),
    }));

    const instancesCaches = await Promise.all(instanceCachesPromises);
    const result: { [key: string]: ApplicationCache } = {};

    for (const { instanceId, instanceCaches } of instancesCaches) {
      for (const instanceCache of instanceCaches) {
        const applicationCache = (result[instanceCache.name] = result[instanceCache.name] ?? {
          name: instanceCache.name,
          cacheManagers: {},
          instanceCaches: {},
        });
        applicationCache.instanceCaches[instanceId] = instanceCache;
      }
    }
    return Object.values(result);
  }

  async getApplicationCache(applicationId: string, cacheName: string): Promise<ApplicationCache> {
    const instances = configurationService.getApplicationInstances(applicationId);
    const instancesCachePromises = instances.map(async (instance) => ({
      instanceId: instance.id,
      instanceCache: await this.getInstanceCache(instance.id, cacheName).catch(() => null),
    }));

    const instancesCaches = await Promise.all(instancesCachePromises);
    const result: ApplicationCache = {
      name: cacheName,
      instanceCaches: {},
    };

    for (const { instanceId, instanceCache } of instancesCaches) {
      if (instanceCache) {
        result.instanceCaches[instanceId] = instanceCache;
      }
    }
    return result;
  }

  async evictApplicationCaches(applicationId: string, cacheNames: string[]): Promise<void> {
    const instances = configurationService.getApplicationInstances(applicationId);
    await Promise.all(instances.map((instance) => this.evictInstanceCaches(instance.id, cacheNames).catch(() => null)));
  }

  async evictAllApplicationCaches(applicationId: string): Promise<void> {
    const instances = configurationService.getApplicationInstances(applicationId);
    await Promise.all(instances.map((instance) => this.evictAllInstanceCaches(instance.id).catch(() => null)));
  }

  getCachedInstanceHealth(instance: Instance): InstanceHealth {
    return (
      this.instanceHealthCache.get<InstanceHealth>(instance.id) ?? {
        status: 'PENDING',
        lastUpdateTime: Date.now(),
        lastStatusChangeTime: Date.now(),
      }
    );
  }

  getCachedApplicationHealth(application: Application): ApplicationHealth {
    return (
      this.applicationHealthCache.get<ApplicationHealth>(application.id) ?? {
        status: 'PENDING',
        lastUpdateTime: Date.now(),
        lastStatusChangeTime: Date.now(),
      }
    );
  }

  getCachedInstanceEndpoints(instance: Instance): string[] {
    return this.endpointsCache.get<string[]>(instance.id) ?? [];
  }

  fetchInstanceHealthById(instanceId: string): Promise<InstanceHealth> {
    const instance = configurationService.getInstanceOrThrow(instanceId);
    return this.fetchInstanceHealth(instance);
  }

  async fetchInstanceHealth(instance: Instance): Promise<InstanceHealth> {
    const client = actuatorClientStore.getActuatorClient(instance.id);
    let instanceHealth: InstanceHealth;
    const oldHealth = this.instanceHealthCache.get<InstanceHealth>(instance.id);
    try {
      const { success, validActuator, statusText } = await client.testConnection();
      if (!success) {
        instanceHealth = {
          status: 'UNREACHABLE',
          statusText,
          lastUpdateTime: Date.now(),
          lastStatusChangeTime: oldHealth?.status !== 'UNREACHABLE' ? Date.now() : oldHealth?.lastStatusChangeTime,
        };
      } else if (!validActuator) {
        instanceHealth = {
          status: 'INVALID',
          lastUpdateTime: Date.now(),
          lastStatusChangeTime: oldHealth?.status !== 'INVALID' ? Date.now() : oldHealth?.lastStatusChangeTime,
        };
      } else {
        const { status } = await client.health();
        instanceHealth = {
          status,
          lastUpdateTime: Date.now(),
          lastStatusChangeTime: oldHealth?.status !== status ? Date.now() : oldHealth?.lastStatusChangeTime,
        };
      }
    } catch (e: unknown) {
      let message;
      if (e instanceof Error) {
        message = e.message;
      } else {
        message = JSON.stringify(e);
      }
      instanceHealth = {
        status: 'UNREACHABLE',
        statusText: message,
        lastUpdateTime: Date.now(),
        lastStatusChangeTime: oldHealth?.status !== 'UNREACHABLE' ? Date.now() : oldHealth?.lastStatusChangeTime,
      };
    }
    this.instanceHealthCache.set(instance.id, instanceHealth);
    this.computeAndSaveApplicationHealth(instance.parentApplicationId);
    if (oldHealth?.status !== instanceHealth.status) {
      this.events.emit('app:instanceHealthUpdated', instance.id, instanceHealth);
    }
    return instanceHealth;
  }

  async fetchInstanceEndpoints(instance: Instance): Promise<string[]> {
    const client = actuatorClientStore.getActuatorClient(instance.id);
    try {
      const endpoints = await client.endpoints();
      const oldEndpoints = this.endpointsCache.get<string[]>(instance.id);
      this.endpointsCache.set(instance.id, endpoints);
      if (
        oldEndpoints?.length !== endpoints.length ||
        !oldEndpoints?.every((endpoint) => endpoints.includes(endpoint))
      ) {
        this.events.emit('app:instanceEndpointsUpdated', instance.id, endpoints);
      }
      return endpoints;
    } catch (e: unknown) {
      console.error(`Couldn't fetch endpoints for instance ${instance.id}`, e);
      return [];
    }
  }

  private computeAndSaveApplicationHealth(applicationId: string) {
    if (!configurationService.itemExists(applicationId)) {
      this.applicationHealthCache.del(applicationId);
      return;
    }
    const oldHealth = this.applicationHealthCache.get<ApplicationHealth>(applicationId);
    const newStatus = this.getApplicationHealthStatus(applicationId);
    const newHealth: ApplicationHealth = {
      status: newStatus,
      lastUpdateTime: Date.now(),
      lastStatusChangeTime: oldHealth?.status !== newStatus ? Date.now() : oldHealth?.lastStatusChangeTime,
    };
    this.applicationHealthCache.set(applicationId, newHealth);
    if (oldHealth?.status !== this.getApplicationHealthStatus(applicationId)) {
      this.events.emit('app:applicationHealthUpdated', applicationId);
    }
  }

  private invalidateInstance(instance: Instance): void {
    if (!configurationService.itemExists(instance.id)) {
      this.instanceHealthCache.del(instance.id);
      return;
    }
    this.fetchInstanceHealth(instance);
    this.fetchInstanceEndpoints(instance);
  }

  private invalidateApplication(applicationId: string): void {
    if (!configurationService.itemExists(applicationId)) {
      this.applicationHealthCache.del(applicationId);
      return;
    }
    this.computeAndSaveApplicationHealth(applicationId);
  }

  private getApplicationHealthStatus(applicationId: string): ApplicationHealthStatus {
    const instances = configurationService.getApplicationInstances(applicationId);
    if (instances.length === 0) {
      return 'PENDING';
    }

    if (instances.some((instance) => instance.health.status === 'PENDING' || instance.health.status === 'UNKNOWN')) {
      return 'PENDING';
    }

    if (instances.every((instance) => instance.health.status === 'UP')) {
      return 'ALL_UP';
    }

    if (
      instances.every(
        (instance) =>
          instance.health.status === 'DOWN' ||
          instance.health.status === 'UNREACHABLE' ||
          instance.health.status === 'INVALID' ||
          instance.health.status === 'OUT_OF_SERVICE'
      )
    ) {
      return 'ALL_DOWN';
    }
    return 'SOME_DOWN';
  }
}

export const instanceService = new InstanceService();

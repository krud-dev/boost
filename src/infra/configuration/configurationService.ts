import { v4 as uuidv4 } from 'uuid';
import {
  Application,
  BaseItem,
  Configuration,
  Folder,
  HierarchicalItem,
  Instance,
  InstanceHealthStatus,
  EnrichedInstance,
  isApplication,
  isFolder,
  isInstance,
} from './model/configuration';
import { configurationStore } from './configurationStore';

class ConfigurationService {
  /**
   * Generic operations
   */
  getConfiguration(): Configuration {
    return configurationStore.store;
  }

  getItem<T extends BaseItem>(id: string): BaseItem | undefined {
    return configurationStore.get('items')[id];
  }

  getItemOrThrow(id: string): BaseItem {
    const item = this.getItem(id);
    if (item == null) {
      throw new Error(`Item with id ${id} not found`);
    }
    return item;
  }

  itemExistsOrThrow(id: string): void {
    if (!configurationStore.has(`items.${id}`)) {
      throw new Error(`Item with id ${id} not found`);
    }
  }

  setColor(id: string, color?: string) {
    this.itemExistsOrThrow(id);
    if (!color) {
      configurationStore.delete(`items.${id}.color` as any);
    } else {
      configurationStore.set(`items.${id}.color`, color);
    }
  }

  /**
   * Folder operations
   */

  createFolder(folder: Omit<Folder, 'id' | 'type'>): Folder {
    const id = this.generateId();
    const newFolder: Folder = {
      ...folder,
      type: 'folder',
      id,
    };
    configurationStore.set(`items.${id}`, newFolder);
    return this.getItem(id) as Folder;
  }

  updateFolder(id: string, folder: Omit<Folder, 'id' | 'type'>): Folder {
    const target = this.getItemOrThrow(id);
    if (!isFolder(target)) {
      throw new Error(`Item with id ${id} is not a folder`);
    }
    configurationStore.set(`items.${id}`, folder);
    return this.getItem(id) as Folder;
  }

  deleteFolder(id: string): void {
    const target = this.getItemOrThrow(id);
    if (!isFolder(target)) {
      throw new Error(`Item with id ${id} is not a folder`);
    }
    const children = this.getFolderChildren(id);
    children.forEach((child) => {
      if (isFolder(child)) {
        this.deleteFolder(child.id);
      } else {
        this.deleteApplication(child.id);
      }
    });
    configurationStore.delete(`items.${id}` as any);
  }

  getFolderChildren(id: string): HierarchicalItem[] {
    const folder = this.getItemOrThrow(id);
    if (!isFolder(folder)) {
      throw new Error(`Item with id ${id} is not a folder`);
    }
    return Object.values(configurationStore.get('items')).filter(
      (item) => (isFolder(item) || isApplication(item)) && item.parentFolderId === id
    );
  }

  moveFolder(id: string, newParentFolderId: string, newOrder: number): Folder {
    const target = this.getItemOrThrow(id);
    if (!isFolder(target)) {
      throw new Error(`Item with id ${id} is not a folder`);
    }
    const newParentFolder = this.getItemOrThrow(newParentFolderId);
    if (!isFolder(newParentFolder)) {
      throw new Error(`Item with id ${newParentFolderId} is not a folder`);
    }
    configurationStore.set(`items.${id}.parentFolderId`, newParentFolderId);
    configurationStore.set(`items.${id}.order`, newOrder);
    return this.getItem(id) as Folder;
  }

  /**
   * Application operations
   */

  createApplication(application: Omit<Application, 'id' | 'type'>): Application {
    const id = this.generateId();
    const newApplication: Application = {
      ...application,
      type: 'application',
      id,
    };
    configurationStore.set(`items.${id}`, newApplication);
    return this.getItem(id) as Application;
  }

  updateApplication(id: string, application: Omit<Application, 'id' | 'type'>): Application {
    const target = this.getItemOrThrow(id);
    if (!isApplication(target)) {
      throw new Error(`Item with id ${id} is not an application`);
    }
    configurationStore.set(`items.${id}`, application);
    return this.getItem(id) as Application;
  }

  deleteApplication(id: string): void {
    const target = this.getItemOrThrow(id);
    if (!isApplication(target)) {
      throw new Error(`Item with id ${id} is not an application`);
    }
    const instances = this.getApplicationInstances(id);
    instances.forEach((instance) => this.deleteInstance(instance.id));
    configurationStore.delete(`items.${id}` as any);
  }

  moveApplication(id: string, parentFolderId: string, newOrder: number): Application {
    const target = this.getItemOrThrow(id);
    if (!isApplication(target)) {
      throw new Error(`Item with id ${id} is not an application`);
    }
    const newParentFolder = this.getItemOrThrow(parentFolderId);
    if (!isFolder(newParentFolder)) {
      throw new Error(`Item with id ${parentFolderId} is not a folder`);
    }
    configurationStore.set(`items.${id}.parentFolderId`, parentFolderId);
    configurationStore.set(`items.${id}.order`, newOrder);
    return this.getItem(id) as Application;
  }

  getApplicationInstances(id: string): EnrichedInstance[] {
    const application = this.getItemOrThrow(id);
    if (!isApplication(application)) {
      throw new Error(`Item with id ${id} is not an application`);
    }
    return Object.values(configurationStore.get('items'))
      .filter((item) => isInstance(item) && item.parentApplicationId === id)
      .map((item) => this.enrichInstance(<Instance>item));
  }

  /**
   * Instance operations
   */

  getInstances(): EnrichedInstance[] {
    return Object.values(configurationStore.get('items'))
      .filter(isInstance)
      .map((instance) => this.enrichInstance(instance));
  }

  getInstancesForDataCollection(): Instance[] {
    return this.getInstances().filter((instance) => {
      const { dataCollectionMode } = instance;
      switch (dataCollectionMode) {
        case 'inherited': {
          const application = this.getItem(instance.parentApplicationId);
          if (application == null || !isApplication(application)) {
            return false;
          }
          return application.dataCollectionMode === 'on';
        }
        case 'on': {
          return true;
        }
        default:
          return false;
      }
    });
  }

  createInstance(instance: Omit<Instance, 'id' | 'type'>): EnrichedInstance {
    const id = this.generateId();
    const newInstance: Instance = {
      ...instance,
      type: 'instance',
      id,
    };
    configurationStore.set(`items.${id}`, newInstance);
    return this.enrichInstance(this.getItem(id) as Instance);
  }

  updateInstance(id: string, instance: Omit<Instance, 'id' | 'type'>): EnrichedInstance {
    const target = this.getItemOrThrow(id);
    if (!isInstance(target)) {
      throw new Error(`Item with id ${id} is not an instance`);
    }
    configurationStore.set(`items.${id}`, instance);
    return this.enrichInstance(this.getItem(id) as Instance);
  }

  deleteInstance(id: string): void {
    const target = this.getItemOrThrow(id);
    if (!isInstance(target)) {
      throw new Error(`Item with id ${id} is not an instance`);
    }
    configurationStore.delete(`items.${id}` as any);
  }

  moveInstance(id: string, newParentApplicationId: string, newOrder: number): EnrichedInstance {
    const target = this.getItemOrThrow(id);
    if (!isInstance(target)) {
      throw new Error(`Item with id ${id} is not an instance`);
    }
    const application = this.getItemOrThrow(newParentApplicationId);
    if (!isApplication(application)) {
      throw new Error(`Item with id ${newParentApplicationId} is not an application`);
    }
    configurationStore.set(`items.${id}.parentApplicationId`, newParentApplicationId);
    configurationStore.set(`items.${id}.order`, newOrder);
    return this.enrichInstance(this.getItem(id) as Instance);
  }

  /**
   * Misc
   */

  private enrichInstance(instance: Instance): EnrichedInstance {
    const effectiveColor = instance.color ?? this.getItem(instance.parentApplicationId)?.color;
    const healthStatus: InstanceHealthStatus = 'UP';
    return {
      ...instance,
      effectiveColor,
      healthStatus,
    };
  }

  private generateId(): string {
    let id = uuidv4();
    while (configurationStore.has(`items.${id}`)) {
      id = uuidv4();
    }
    return id;
  }
}

export const configurationService = new ConfigurationService();

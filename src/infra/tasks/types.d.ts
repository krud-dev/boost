export type TaskName = 'queryInstanceMetrics' | 'queryInstanceHealth';

export type TaskDefinition = {
  alias: string;
  name: TaskName;
  description: string;
  defaultCron: string;
  function: () => Promise<void>;
};

export type EffectiveTaskDefinition = TaskDefinition & {
  cron: string;
  active: boolean;
};

export type TaskDefinitionDisplay = Omit<EffectiveTaskDefinition, 'function'> & {
  nextRun: number;
};

export type TaskServiceBridge = {
  getTasksForDisplay: () => Promise<TaskDefinitionDisplay[]>;
  getTaskForDisplay: (name: string) => Promise<TaskDefinitionDisplay | undefined>;
};
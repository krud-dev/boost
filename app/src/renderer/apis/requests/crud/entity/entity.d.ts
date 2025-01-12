export type CrudEntityType = 'CrudFramework' | 'Stub';

export type CrudEntityBase = {
  id: string;
};

type CrudEntityCrudFramework = CrudEntityBase & {
  type: 'CrudFramework';
  path: string;
};

type CrudEntityStub = CrudEntityBase & {
  type: 'Stub';
};

export type CrudEntity = CrudEntityCrudFramework | CrudEntityStub;

export type BaseRO = {
  id: string;
};

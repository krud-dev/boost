import {
  BaseMutationOptions,
  BaseUseMutationResult,
  useBaseMutation,
} from 'renderer/apis/requests/base/useBaseMutation';
import { axiosInstance } from '../../../axiosInstance';
import { AxiosResponse } from 'axios';
import { apiKeys } from '../../../apiKeys';
import { InstanceHealthRO } from '../../../../../common/generated_definitions';

type Variables = {
  instanceId: string;
};

type Data = InstanceHealthRO;

export const updateInstanceHealth = async (variables: Variables): Promise<Data> => {
  return (await axiosInstance.put<Data, AxiosResponse<Data>>(`instances/health/update/${variables.instanceId}`)).data;
};

export const useUpdateInstanceHealth = (
  options?: BaseMutationOptions<Data, Variables>
): BaseUseMutationResult<Data, Variables> =>
  useBaseMutation<Data, Variables>(updateInstanceHealth, {
    ...options,
    invalidateQueriesKeyFn: (data, variables) => apiKeys.instancesHealth(),
  });
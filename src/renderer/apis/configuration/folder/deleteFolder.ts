import { BaseMutationOptions, BaseUseMutationResult, useBaseMutation } from 'renderer/apis/base/useBaseMutation';
import { apiKeys } from 'renderer/apis/apiKeys';

type Variables = {
  id: string;
};

type Data = void;

export const deleteFolder = async (variables: Variables): Promise<Data> => {
  return await window.configuration.deleteFolder(variables.id);
};

export const useDeleteFolder = (
  options?: BaseMutationOptions<Data, Variables>
): BaseUseMutationResult<Data, Variables> =>
  useBaseMutation<Data, Variables>(deleteFolder, {
    ...options,
    invalidateQueriesKeyFn: (data, variables) => apiKeys.items(),
  });

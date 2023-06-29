import { CreateHandler, DeleteHandler, MoveHandler, RenameHandler, TreeApi } from 'react-arborist';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { TreeItem } from 'renderer/layout/navigator/components/sidebar/tree/tree';
import { FormattedMessage } from 'react-intl';
import { useNavigatorLayoutContext } from 'renderer/contexts/NavigatorLayoutContext';
import { useUpdateItem } from 'renderer/apis/requests/item/updateItem';
import { useDeleteItem } from 'renderer/apis/requests/item/deleteItem';
import { showDeleteItemConfirmationDialog } from 'renderer/utils/dialogUtils';
import { useMoveItem } from 'renderer/apis/requests/item/moveItem';
import NiceModal from '@ebay/nice-modal-react';
import CreateInstanceDialog, {
  CreateInstanceDialogProps,
} from 'renderer/components/item/dialogs/create/CreateInstanceDialog';
import { matchPath, useLocation } from 'react-router-dom';
import {
  getItemNameKey,
  getItemParentId,
  getItemType,
  getItemUrl,
  isAgent,
  isApplication,
  isFolder,
  isInstance,
  isItemDeletable,
  isItemUpdatable,
} from 'renderer/utils/itemUtils';
import { OpenMap } from 'react-arborist/src/state/open-slice';
import { InstanceRO } from 'common/generated_definitions';
import { ItemRO, ItemType } from 'renderer/definitions/daemon';
import { NodeApi } from 'react-arborist/dist/interfaces/node-api';
import { useUpdateEffect } from 'react-use';
import LogoLoader from '../../../../../components/common/LogoLoader';
import { LoadingButton } from '@mui/lab';
import useStartDemo from '../../../../../hooks/demo/useStartDemo';
import useDelayedEffect from '../../../../../hooks/useDelayedEffect';
import { useItemsContext } from 'renderer/contexts/ItemsContext';
import NavigatorTreeBase from 'renderer/layout/navigator/components/sidebar/tree/NavigatorTreeBase';
import NavigatorTreeNode from 'renderer/layout/navigator/components/sidebar/tree/nodes/NavigatorTreeNode';
import { get } from 'lodash';

const NAVIGATOR_TREE_PADDING_BOTTOM = 12;

type NavigatorTreeProps = {
  width: number;
  height: number;
  search?: string;
};

export default function NavigatorTree({ width, height, search }: NavigatorTreeProps) {
  const { addItem, getItem } = useItemsContext();
  const { data, selectedItem, action } = useNavigatorLayoutContext();
  const { pathname } = useLocation();
  const { startDemo, loading: loadingDemo } = useStartDemo();

  const treeRef = useRef<TreeApi<TreeItem> | null>(null);

  const isLoading = useMemo<boolean>(() => !data, [data]);
  const isEmpty = useMemo<boolean>(() => !!data && data.length === 0, [data]);
  const hasData = useMemo<boolean>(() => !!data && data.length > 0, [data]);

  useEffect(() => {
    if (!action) {
      return;
    }

    switch (action) {
      case 'collapseAll':
        treeRef.current?.closeAll();
        break;
      case 'expandAll':
        treeRef.current?.openAll();
        break;
      default:
        break;
    }
  }, [action]);

  useDelayedEffect(() => {
    if (selectedItem) {
      treeRef.current?.openParents(selectedItem);
    }
  }, [selectedItem?.id]);

  const initialOpenState = useMemo<OpenMap>(() => {
    const openMap: OpenMap = {};
    const checkItemOpen = (item: TreeItem): boolean => {
      if (matchPath({ path: getItemUrl(item), end: false }, pathname)) {
        return true;
      }
      if (item.children?.some(checkItemOpen)) {
        openMap[item.id] = true;
        return true;
      }
      return false;
    };

    for (const item of data ?? []) {
      if (checkItemOpen(item)) {
        break;
      }
    }

    return openMap;
  }, [data]);

  const createInstanceHandler = useCallback(async (): Promise<void> => {
    await NiceModal.show<InstanceRO[] | undefined, CreateInstanceDialogProps>(CreateInstanceDialog, {});
  }, []);

  const onCreate: CreateHandler<TreeItem> = useCallback(({ parentId, index, parentNode, type }) => {
    return null;
  }, []);

  const updateItemState = useUpdateItem({ refetchNone: true });

  const updateItem = useCallback(
    async (item: ItemRO): Promise<ItemRO | undefined> => {
      try {
        const result = await updateItemState.mutateAsync({ item });
        addItem(result);
        return result;
      } catch (e) {}
      return undefined;
    },
    [updateItemState]
  );

  const [disableDrag, setDisableDrag] = useState<boolean>(false);

  useUpdateEffect(() => {
    setDisableDrag(false);
  }, [data]);

  const moveItemState = useMoveItem({ refetchNone: true });

  const moveItem = useCallback(
    async (id: string, type: ItemType, parentId: string | undefined, sort: number): Promise<ItemRO | undefined> => {
      const item = getItem(id);
      if (!item) {
        return undefined;
      }

      const isSameParent = getItemParentId(item) === parentId;
      if (isSameParent && item.sort === sort) {
        return undefined;
      }

      const newParentId = isSameParent ? undefined : parentId;

      setDisableDrag(true);
      try {
        const result = await moveItemState.mutateAsync({ id, type, parentId: newParentId, sort });
        addItem(result);
        return result;
      } catch (e) {
        setDisableDrag(false);
      }
      return undefined;
    },
    [addItem, getItem, moveItemState]
  );

  const deleteItemState = useDeleteItem();

  const deleteItem = useCallback(
    async (item: ItemRO): Promise<void> => {
      try {
        await deleteItemState.mutateAsync({ item });
      } catch (e) {}
    },
    [deleteItemState]
  );

  const onRename: RenameHandler<TreeItem> = useCallback(
    async ({ id, name, node }): Promise<void> => {
      const item = getItem(id);
      if (!item) {
        return;
      }
      const nameKey = getItemNameKey(item);
      if (get(item, nameKey) === name) {
        return;
      }
      await updateItem({ ...item, [nameKey]: name });
    },
    [getItem, updateItem]
  );

  const onMove: MoveHandler<TreeItem> = useCallback(
    async ({ parentId, index, parentNode, dragNodes, dragIds }): Promise<void> => {
      const children = parentNode?.children?.map((c) => c.data) ?? data;
      const beforeSort = children?.[index - 1]?.sort ?? 0;
      const afterSort = children?.[index]?.sort ?? 0;

      const promises = dragNodes.map((node, nodeIndex, array) => {
        const item = node.data;

        let newSort: number;
        if (beforeSort && afterSort) {
          newSort = beforeSort + ((afterSort - beforeSort) / (array.length + 1)) * (nodeIndex + 1);
        } else if (beforeSort) {
          newSort = beforeSort + nodeIndex + 1;
        } else if (afterSort) {
          newSort = (afterSort / (array.length + 1)) * (nodeIndex + 1);
        } else {
          newSort = nodeIndex + 1;
        }

        return moveItem(item.id, getItemType(item), parentId || undefined, newSort);
      });
      await Promise.all(promises);
    },
    [data]
  );

  const onDelete: DeleteHandler<TreeItem> = useCallback(async ({ ids, nodes }): Promise<void> => {
    const items = nodes.map((node) => node.data).filter((item) => isItemDeletable(item));
    if (!items.length) {
      return;
    }

    const confirm = await showDeleteItemConfirmationDialog(items);
    if (!confirm) {
      return;
    }

    const promises = items.map((item) => deleteItem(item));
    await Promise.all(promises);
  }, []);

  const disableEditItem = useCallback((treeItem: TreeItem): boolean => {
    return !isItemUpdatable(treeItem);
  }, []);

  const disableDragItem = useCallback(
    (treeItem: TreeItem): boolean => {
      if (disableDrag) {
        return true;
      }
      if (!isItemUpdatable(treeItem)) {
        return true;
      }
      return false;
    },
    [disableDrag]
  );

  const disableDropItems = useCallback(
    (args: { parentNode: NodeApi<TreeItem>; dragNodes: NodeApi<TreeItem>[]; index: number }): boolean => {
      const { parentNode, dragNodes } = args;
      if (isInstance(parentNode.data)) {
        return true;
      }
      if (!isItemUpdatable(parentNode.data)) {
        return true;
      }
      if (dragNodes.some((node) => isInstance(node.data)) && dragNodes.some((node) => !isInstance(node.data))) {
        return true;
      }
      if (dragNodes.some((node) => isInstance(node.data) && getItemParentId(node.data) !== parentNode.data.id)) {
        return true;
      }
      if (
        dragNodes.some(
          (node) =>
            isApplication(node.data) && !!node.data.parentAgentId && getItemParentId(node.data) !== parentNode.data.id
        )
      ) {
        return true;
      }
      if (
        dragNodes.some((node) => isApplication(node.data) && getItemParentId(node.data) !== parentNode.id) &&
        !parentNode.isRoot &&
        !isFolder(parentNode.data)
      ) {
        return true;
      }
      if (dragNodes.some((node) => isAgent(node.data)) && !parentNode.isRoot && !isFolder(parentNode.data)) {
        return true;
      }
      if (dragNodes.some((node) => isFolder(node.data)) && !parentNode.isRoot && !isFolder(parentNode.data)) {
        return true;
      }
      return false;
    },
    []
  );

  return (
    <>
      {isLoading && (
        <Box
          sx={{
            height: height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LogoLoader />
        </Box>
      )}

      {isEmpty && (
        <Box
          sx={{
            height: height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="body1" gutterBottom sx={{ color: 'text.secondary' }}>
              <FormattedMessage id="addYourFirstInstance" />
            </Typography>
            <Button variant="outlined" color="primary" size={'small'} onClick={createInstanceHandler}>
              <FormattedMessage id={'createInstance'} />
            </Button>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5, mb: 0.75 }}>
              <FormattedMessage id="or" />
            </Typography>
            <LoadingButton variant="outlined" color="info" size={'small'} onClick={startDemo} loading={loadingDemo}>
              <FormattedMessage id={'startDemoInstance'} />
            </LoadingButton>
          </Box>
        </Box>
      )}

      {hasData && (
        <NavigatorTreeBase
          treeRef={treeRef}
          data={data}
          openByDefault={false}
          initialOpenState={initialOpenState}
          width={width}
          height={height}
          paddingBottom={NAVIGATOR_TREE_PADDING_BOTTOM}
          searchTerm={search}
          onCreate={onCreate}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          disableDrag={disableDragItem}
          disableDrop={disableDropItems}
          disableEdit={disableEditItem}
        >
          {NavigatorTreeNode}
        </NavigatorTreeBase>
      )}
    </>
  );
}

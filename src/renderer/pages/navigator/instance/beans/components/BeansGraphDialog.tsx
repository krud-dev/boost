import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Box, Dialog } from '@mui/material';
import NiceModal, { NiceModalHocProps, useModal } from '@ebay/nice-modal-react';
import DialogTitleEnhanced from 'renderer/components/dialog/DialogTitleEnhanced';
import { InstanceBean } from '../../../../../apis/requests/instance/beans/getInstanceBeans';
import GraphComponent from '../../../../general/graph/components/GraphComponent';
import { Edge, Node } from 'reactflow';
import { chain, uniqBy } from 'lodash';
import { getIncomingNodes, getOutgoingNodes } from '../../../../general/graph/utils/reactFlowUtils';
import { FormattedMessage } from 'react-intl';

export type BeansGraphDialogProps = {
  bean: InstanceBean;
  allBeans: InstanceBean[];
};

const BeansGraphDialog: FunctionComponent<BeansGraphDialogProps & NiceModalHocProps> = NiceModal.create(
  ({ bean, allBeans }) => {
    const modal = useModal();

    const closeHandler = useCallback((): void => {
      modal.resolve(undefined);
      modal.hide();
    }, [modal]);

    const edges = useMemo<Edge[]>(
      () =>
        chain(allBeans)
          .uniqBy((b) => b.name)
          .map((b) =>
            b.dependencies
              .filter((dependency) => !!allBeans?.find((innerBean) => innerBean.name === dependency))
              .map((dependency) => ({
                id: `${dependency}_${b.name}`,
                source: dependency,
                target: b.name,
              }))
          )
          .flatten()
          .value(),
      [allBeans]
    );
    const nodes = useMemo<Node[]>(
      () =>
        chain(allBeans)
          .uniqBy((b) => b.name)
          .map((b) => ({
            id: b.name.toString(),
            data: { label: b.shortName, componentType: b.package },
            position: { x: 0, y: 0 },
            type: 'custom',
          }))
          .value(),
      [edges]
    );
    const initialSelectedNode = useMemo<Node | undefined>(
      () => nodes.find((n) => n.id === bean.name),
      [nodes, bean.name]
    );
    const connectedNodes = useMemo<Node[]>(
      () =>
        uniqBy(
          [...getIncomingNodes(bean.name, nodes, edges), ...getOutgoingNodes(bean.name, nodes, edges)],
          (n) => n.id
        ),
      [bean, nodes, edges]
    );
    const connectedEdges = useMemo<Edge[]>(
      () =>
        edges.filter(
          (edge) =>
            !!connectedNodes.find((n) => n.id === edge.source) && !!connectedNodes.find((n) => n.id === edge.target)
        ),
      [connectedNodes, edges]
    );

    return (
      <Dialog
        open={modal.visible}
        onClose={closeHandler}
        TransitionProps={{
          onExited: () => modal.remove(),
        }}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            height: '100%',
          },
        }}
      >
        <DialogTitleEnhanced onClose={closeHandler}>
          <FormattedMessage id={'beansGraph'} />
          {' - '}
          {bean.shortName}
        </DialogTitleEnhanced>
        <Box sx={{ height: '100%', overflow: 'hidden' }}>
          <GraphComponent nodes={connectedNodes} edges={connectedEdges} initialSelectedNode={initialSelectedNode} />
        </Box>
      </Dialog>
    );
  }
);

export default BeansGraphDialog;

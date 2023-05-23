import React, { useCallback, useMemo } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { getItemType, getItemTypeIcon } from 'renderer/utils/itemUtils';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { IconViewer, MUIconType } from 'renderer/components/common/IconViewer';
import { useFormContext } from 'react-hook-form';
import ItemIconMenu from 'renderer/components/item/dialogs/forms/fields/ItemIconMenu';
import { ItemType } from '../../../../../definitions/daemon';
import { DEFAULT_ICON_VALUE } from '../../../../../hooks/useItemIcon';
import { FormattedMessage } from 'react-intl';
import { useAnalytics } from '../../../../../contexts/AnalyticsContext';

type ItemIconFormFieldProps = { type: ItemType };

export default function ItemIconFormField({ type }: ItemIconFormFieldProps) {
  const menuState = usePopupState({ variant: 'popper' });
  const { track } = useAnalytics();

  const { watch, setValue } = useFormContext<{ icon?: string }>();

  const formIcon = watch('icon');
  const typeIcon = useMemo<MUIconType>(() => getItemTypeIcon(type), [type]);
  const icon = useMemo<MUIconType>(() => {
    if (formIcon === DEFAULT_ICON_VALUE) {
      return typeIcon;
    }
    return (formIcon as MUIconType) || typeIcon;
  }, [formIcon, typeIcon]);

  const openMenuHandler = useCallback(
    (event: React.MouseEvent): void => {
      event.preventDefault();
      event.stopPropagation();

      menuState.open();
    },
    [menuState]
  );

  const iconSelectedHandler = useCallback(
    (selectedIcon: MUIconType): void => {
      setValue('icon', selectedIcon === typeIcon ? DEFAULT_ICON_VALUE : selectedIcon);
      track({ name: 'item_icon_change', properties: { item_type: type, icon: selectedIcon } });
    },
    [typeIcon]
  );

  return (
    <>
      <Tooltip title={<FormattedMessage id={'changeIcon'} />}>
        <IconButton size={'small'} onClick={openMenuHandler} ref={menuState.setAnchorEl}>
          <IconViewer icon={icon} fontSize={'small'} />
        </IconButton>
      </Tooltip>

      <ItemIconMenu typeIcon={typeIcon} selectedIcon={icon} onSelected={iconSelectedHandler} menuState={menuState} />
    </>
  );
}

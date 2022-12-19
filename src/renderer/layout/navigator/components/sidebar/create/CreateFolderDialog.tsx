import { FormattedMessage, useIntl } from 'react-intl';
import React, { FunctionComponent, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
} from '@mui/material';
import NiceModal, { NiceModalHocProps, useModal } from '@ebay/nice-modal-react';
import DialogTitleEnhanced from 'renderer/components/dialog/DialogTitleEnhanced';
import { Folder } from 'infra/configuration/model/configuration';
import { LoadingButton } from '@mui/lab';
import { useCreateFolder } from 'renderer/apis/configuration/createFolder';

export type CreateFolderDialogProps = {
  parentFolderId?: string;
  onCreated?: (item: Folder) => void;
};

type FormValues = {
  alias: string;
};

const CreateFolderDialog: FunctionComponent<
  CreateFolderDialogProps & NiceModalHocProps
> = NiceModal.create(({ parentFolderId, onCreated }) => {
  const modal = useModal();
  const intl = useIntl();

  const { control, handleSubmit } = useForm<FormValues>();

  const createFolderState = useCreateFolder();

  const submitHandler = handleSubmit(async (data): Promise<void> => {
    const folderToCreate: Omit<Folder, 'id' | 'type'> = {
      alias: data.alias,
      parentFolderId: parentFolderId,
    };
    try {
      const result = await createFolderState.mutateAsync({
        folder: folderToCreate,
      });
      if (result) {
        onCreated?.(result);

        modal.resolve(result);
        modal.hide();
      }
    } catch (e) {}
  });

  const cancelHandler = useCallback((): void => {
    modal.resolve(undefined);
    modal.hide();
  }, [modal]);

  return (
    <Dialog
      open={modal.visible}
      onClose={cancelHandler}
      TransitionProps={{
        onExited: () => modal.remove(),
      }}
      fullWidth
      maxWidth={'xs'}
    >
      <DialogTitleEnhanced onClose={cancelHandler}>
        <FormattedMessage id={'createFolder'} />
      </DialogTitleEnhanced>
      <DialogContent>
        <Box
          component="form"
          onSubmit={submitHandler}
          noValidate
          sx={{ mt: 1 }}
        >
          <Controller
            name="alias"
            rules={{
              required: intl.formatMessage({ id: 'requiredField' }),
            }}
            control={control}
            defaultValue=""
            render={({
              field: { ref, ...field },
              fieldState: { invalid, error },
            }) => {
              return (
                <TextField
                  {...field}
                  inputRef={ref}
                  margin="normal"
                  required
                  fullWidth
                  label={<FormattedMessage id="name" />}
                  type="text"
                  autoComplete="off"
                  autoFocus
                  error={invalid}
                  helperText={error?.message}
                  sx={{ mb: 0 }}
                />
              );
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="primary" onClick={cancelHandler}>
          <FormattedMessage id={'cancel'} />
        </Button>
        <LoadingButton
          variant="contained"
          color="primary"
          onClick={submitHandler}
        >
          <FormattedMessage id={'create'} />
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
});

export default CreateFolderDialog;

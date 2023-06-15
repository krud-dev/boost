import { FormattedMessage } from 'react-intl';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText } from '@mui/material';
import NiceModal, { NiceModalHocProps, useModal } from '@ebay/nice-modal-react';
import DialogTitleEnhanced from 'renderer/components/dialog/DialogTitleEnhanced';
import { useAnalytics } from 'renderer/contexts/AnalyticsContext';
import { useImportAll } from 'renderer/apis/requests/backup/importAll';
import UploadSingleFile from 'renderer/components/upload/UploadSingleFile';
import { isEmpty } from 'lodash';
import { useSnackbar } from 'notistack';
import { LoadingButton } from '@mui/lab';

export type ExportConfigurationDialogProps = {};

const ImportConfigurationDialog: FunctionComponent<ExportConfigurationDialogProps & NiceModalHocProps> =
  NiceModal.create(({}) => {
    const modal = useModal();
    const { enqueueSnackbar } = useSnackbar();
    const { track } = useAnalytics();

    const [file, setFile] = useState<File | undefined>(undefined);
    const [jsonData, setJsonData] = useState<string | undefined>(undefined);

    const importState = useImportAll();

    const submitHandler = useCallback(async (): Promise<void> => {
      if (!jsonData) {
        enqueueSnackbar(<FormattedMessage id={'selectFileToImport'} />, { variant: 'error' });
        return;
      }

      track({ name: 'import_all_submit' });

      try {
        await importState.mutateAsync({ jsonData });

        modal.resolve(true);
        modal.hide();
      } catch (e) {}
    }, [jsonData, track, importState, modal]);

    const cancelHandler = useCallback((): void => {
      modal.resolve(false);
      modal.hide();
    }, [modal]);

    const filesAcceptedHandler = useCallback(
      (files: File[]): void => {
        setJsonData(undefined);

        if (isEmpty(files)) {
          setFile(undefined);
        } else {
          setFile(files[0]);
        }
      },
      [setJsonData, setFile]
    );

    const filesRejectedHandler = useCallback((): void => {
      setJsonData(undefined);
      setFile(undefined);
    }, [setFile]);

    useEffect(() => {
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result;
          if (content) {
            setJsonData(content.toString());
          }
        };
        reader.readAsText(file);
      } else {
        setJsonData(undefined);
      }
    }, [file]);

    return (
      <>
        <Dialog
          open={modal.visible}
          onClose={cancelHandler}
          TransitionProps={{
            onExited: () => modal.remove(),
          }}
          fullWidth
          maxWidth={'xs'}
        >
          <DialogTitleEnhanced onClose={cancelHandler} disabled={importState.isLoading}>
            <FormattedMessage id={'importConfiguration'} />
          </DialogTitleEnhanced>
          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              <FormattedMessage id={'importConfigurationDescription'} />
            </DialogContentText>

            <UploadSingleFile
              accept={{
                'application/json': ['.json'],
              }}
              file={file}
              onDropAccepted={filesAcceptedHandler}
              onDropRejected={filesRejectedHandler}
            />
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" color="inherit" onClick={cancelHandler} disabled={importState.isLoading}>
              <FormattedMessage id={'cancel'} />
            </Button>
            <LoadingButton
              variant="contained"
              color={'primary'}
              onClick={submitHandler}
              loading={importState.isLoading}
            >
              <FormattedMessage id={'import'} />
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </>
    );
  });

export default ImportConfigurationDialog;

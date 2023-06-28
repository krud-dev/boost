import { FormattedMessage, useIntl } from 'react-intl';
import React, { FunctionComponent, useCallback, useEffect, useMemo } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { Alert, Box, Button, DialogActions, DialogContent, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import InputAdornment from '@mui/material/InputAdornment';
import ItemIconFormField from 'renderer/components/item/dialogs/forms/fields/ItemIconFormField';
import AuthenticationDetailsForm from '../../authentication/forms/AuthenticationDetailsForm';
import {
  AgentModifyRequestRO,
  Authentication,
  FolderModifyRequestRO,
} from '../../../../../common/generated_definitions';
import useEffectiveAuthentication from '../../authentication/hooks/useEffectiveAuthentication';
import EffectiveAuthenticationDetails from '../../authentication/effective/EffectiveAuthenticationDetails';
import { URL_REGEX } from 'renderer/constants/regex';
import { getActuatorUrls } from 'renderer/utils/itemUtils';

export type AgentDetailsFormProps = {
  defaultValues?: Partial<AgentFormValues>;
  onSubmit: (data: AgentFormValues) => Promise<void>;
  onCancel: () => void;
};

export type AgentFormValues = AgentModifyRequestRO;

const AgentDetailsForm: FunctionComponent<AgentDetailsFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
}: AgentDetailsFormProps) => {
  const intl = useIntl();

  const methods = useForm<AgentFormValues>({ defaultValues });
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    watch,
    setValue,
  } = methods;

  const submitHandler = handleSubmit(async (data): Promise<void> => {
    await onSubmit?.(data);
  });

  const cancelHandler = useCallback((): void => {
    onCancel();
  }, [onCancel]);

  const url = watch('url');

  const apiKeyDisabled = useMemo<boolean>(() => !url?.startsWith('https'), [url]);

  useEffect(() => {
    if (apiKeyDisabled) {
      setValue('apiKey', '');
    }
  }, [apiKeyDisabled]);

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={submitHandler} noValidate>
        <DialogContent>
          <Controller
            name="name"
            rules={{
              required: intl.formatMessage({ id: 'requiredField' }),
              validate: (value) => !!value?.trim() || intl.formatMessage({ id: 'requiredField' }),
            }}
            control={control}
            defaultValue=""
            render={({ field: { ref, ...field }, fieldState: { invalid, error } }) => {
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
                />
              );
            }}
          />

          <Controller
            name="url"
            rules={{
              required: intl.formatMessage({ id: 'requiredField' }),
              validate: (value) =>
                (!!value.trim() && URL_REGEX.test(value)) || intl.formatMessage({ id: 'invalidUrl' }),
            }}
            control={control}
            defaultValue=""
            render={({ field: { ref, ...field }, fieldState: { invalid, error } }) => {
              return (
                <TextField
                  {...field}
                  inputRef={ref}
                  margin="normal"
                  required
                  fullWidth
                  label={<FormattedMessage id="url" />}
                  type="url"
                  autoComplete="off"
                  error={invalid}
                  helperText={error?.message}
                />
              );
            }}
          />

          <Controller
            name="apiKey"
            rules={{
              required: apiKeyDisabled ? false : intl.formatMessage({ id: 'requiredField' }),
              validate: (value) =>
                apiKeyDisabled ? undefined : !!value?.trim() || intl.formatMessage({ id: 'requiredField' }),
            }}
            control={control}
            defaultValue=""
            render={({ field: { ref, ...field }, fieldState: { invalid, error } }) => {
              return (
                <TextField
                  {...field}
                  inputRef={ref}
                  margin="normal"
                  required={!apiKeyDisabled}
                  disabled={apiKeyDisabled}
                  fullWidth
                  label={<FormattedMessage id="apiKey" />}
                  type="text"
                  autoComplete="off"
                  error={invalid}
                  helperText={error?.message}
                />
              );
            }}
          />

          <Alert severity={'info'} variant={'outlined'} sx={{ mt: 2 }}>
            <FormattedMessage id="agentApiKeySecuredConnections" />
          </Alert>
        </DialogContent>
        <DialogActions>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" color="primary" disabled={isSubmitting} onClick={cancelHandler}>
            <FormattedMessage id={'cancel'} />
          </Button>
          <LoadingButton variant="contained" color="primary" loading={isSubmitting} type={'submit'}>
            <FormattedMessage id={'save'} />
          </LoadingButton>
        </DialogActions>
      </Box>
    </FormProvider>
  );
};

export default AgentDetailsForm;

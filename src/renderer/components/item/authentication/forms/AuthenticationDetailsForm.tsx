import { FormattedMessage, useIntl } from 'react-intl';
import React, { ComponentType, FunctionComponent, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { MenuItem, TextField } from '@mui/material';
import { Authentication$Typed } from '../../../../../common/manual_definitions';
import AuthenticationDetailsFormNone from './AuthenticationDetailsFormNone';
import AuthenticationDetailsFormInherit from './AuthenticationDetailsFormInherit';
import AuthenticationDetailsFormBasic from './AuthenticationDetailsFormBasic';
import AuthenticationDetailsFormHeader from './AuthenticationDetailsFormHeader';
import AuthenticationDetailsFormBearer from './AuthenticationDetailsFormBearer';
import AuthenticationDetailsFormQuerystring from './AuthenticationDetailsFormQuerystring';
import { useUpdateEffect } from 'react-use';
import { useAnalytics } from '../../../../contexts/AnalyticsContext';
import { ItemType } from '../../../../definitions/daemon';

export type AuthenticationDetailsFormProps = {
  itemType: ItemType;
};

const AuthenticationDetailsForm: FunctionComponent<AuthenticationDetailsFormProps> = ({
  itemType,
}: AuthenticationDetailsFormProps) => {
  const intl = useIntl();
  const { track } = useAnalytics();

  const { control, watch } = useFormContext<{ authentication: Authentication$Typed }>();

  const type = watch('authentication.type');

  const AuthenticationDetailsFormType = useMemo<ComponentType<AuthenticationDetailsFormProps>>(() => {
    switch (type) {
      case 'none':
      default:
        return AuthenticationDetailsFormNone;
      case 'inherit':
        return AuthenticationDetailsFormInherit;
      case 'basic':
        return AuthenticationDetailsFormBasic;
      case 'header':
        return AuthenticationDetailsFormHeader;
      case 'bearer-token':
        return AuthenticationDetailsFormBearer;
      case 'query-string':
        return AuthenticationDetailsFormQuerystring;
    }
  }, [type]);

  useUpdateEffect(() => {
    track({ name: 'authentication_type_change', properties: { item_type: itemType, authentication_type: type } });
  }, [type]);

  return (
    <>
      <Controller
        name="authentication.type"
        rules={{
          required: intl.formatMessage({ id: 'requiredField' }),
        }}
        control={control}
        defaultValue="inherit"
        render={({ field: { ref, ...field }, fieldState: { invalid, error } }) => {
          return (
            <TextField
              {...field}
              inputRef={ref}
              margin="normal"
              required
              fullWidth
              label={<FormattedMessage id="authenticationType" />}
              select
              error={invalid}
              helperText={error?.message}
            >
              <MenuItem value={'none'}>
                <FormattedMessage id="none" />
              </MenuItem>
              <MenuItem value={'inherit'}>
                <FormattedMessage id="inherit" />
              </MenuItem>
              <MenuItem value={'basic'}>
                <FormattedMessage id="basic" />
              </MenuItem>
              <MenuItem value={'bearer-token'}>
                <FormattedMessage id="bearer" />
              </MenuItem>
              <MenuItem value={'header'}>
                <FormattedMessage id="header" />
              </MenuItem>
              <MenuItem value={'query-string'}>
                <FormattedMessage id="querystring" />
              </MenuItem>
            </TextField>
          );
        }}
      />

      <AuthenticationDetailsFormType itemType={itemType} />
    </>
  );
};

export default AuthenticationDetailsForm;

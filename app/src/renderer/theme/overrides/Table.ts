import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';
import { COMPONENTS_SPACING, TABLE_PAGINATION_HEIGHT } from 'renderer/constants/ui';

export default function Table(theme: Theme): Components {
  return {
    MuiTable: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: theme.palette.action.selected,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: 'none',
        },
        head: {
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.background.neutral,
          paddingLeft: theme.spacing(COMPONENTS_SPACING),
          paddingRight: theme.spacing(COMPONENTS_SPACING),
        },
        stickyHeader: {
          backgroundColor: theme.palette.background.paper,
          backgroundImage: `linear-gradient(to bottom, ${theme.palette.background.neutral} 0%, ${theme.palette.background.neutral} 100%)`,
        },
        paddingCheckbox: {
          paddingLeft: theme.spacing(1),
          paddingRight: theme.spacing(1),
        },
        body: {
          paddingLeft: theme.spacing(COMPONENTS_SPACING),
          paddingRight: theme.spacing(COMPONENTS_SPACING),
        },
        sizeSmall: {
          paddingLeft: theme.spacing(COMPONENTS_SPACING),
          paddingRight: theme.spacing(COMPONENTS_SPACING),
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: `solid 1px ${theme.palette.divider}`,
        },
        toolbar: {
          height: TABLE_PAGINATION_HEIGHT - 1,
          paddingLeft: `${theme.spacing(COMPONENTS_SPACING)}!important`,
          paddingRight: `${theme.spacing(COMPONENTS_SPACING)}!important`,
        },
        select: {
          '&:focus': {
            borderRadius: theme.shape.borderRadius,
          },
        },
        selectIcon: {
          width: 20,
          height: 20,
          marginTop: 2,
        },
      },
    },
  };
}

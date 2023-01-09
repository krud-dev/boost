import React, { PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { Entity } from 'renderer/entity/entity';
import { isEmpty, orderBy } from 'lodash';
import useConfigurationStoreState from 'renderer/hooks/useConfigurationStoreState';
import { DEFAULT_ROWS_PER_PAGE } from 'renderer/constants/ui';
import { notEmpty } from 'renderer/utils/objectUtils';
import { BaseUseQueryResult } from 'renderer/apis/base/useBaseQuery';
import { useUpdateEffect } from 'react-use';

export type TableContextProps<EntityItem> = {
  entity: Entity<EntityItem>;
  rows: EntityItem[];
  visibleRows: EntityItem[];
  selectedRows: EntityItem[];
  hasSelectedRows: boolean;
  selectRowHandler: (row: EntityItem) => void;
  isRowSelected: (row: EntityItem) => boolean;
  selectAllIndeterminate: boolean;
  selectAllChecked: boolean;
  selectAllRowsHandler: (selectAll: boolean) => void;
  loading: boolean;
  empty: boolean;
  page: number;
  changePageHandler: (newPage: number) => void;
  rowsPerPage: number;
  changeRowsPerPageHandler: (newRowsPerPage: number) => void;
  filter: string;
  changeFilterHandler: (newFilter: string) => void;
  orderColumn: string | undefined;
  orderDirection: 'asc' | 'desc' | undefined;
  changeOrderHandler: (columnId: string) => void;
  dense: boolean;
  changeDenseHandler: (newDense: boolean) => void;
  hasActions: boolean;
  hasMassActions: boolean;
  actionsHandler: (actionId: string, row: EntityItem) => Promise<void>;
  massActionsHandler: (actionId: string, selectedRows: EntityItem[]) => Promise<void>;
};

const TableContext = React.createContext<TableContextProps<any>>(undefined!);

interface TableProviderProps<EntityItem> extends PropsWithChildren<any> {
  entity: Entity<EntityItem>;
  queryState: BaseUseQueryResult<EntityItem[]>;
  actionsHandler: (actionId: string, row: EntityItem) => Promise<void>;
  massActionsHandler: (actionId: string, selectedRows: EntityItem[]) => Promise<void>;
}

function TableProvider<EntityItem>({
  entity,
  queryState,
  actionsHandler,
  massActionsHandler,
  children,
}: TableProviderProps<EntityItem>) {
  const [filter, setFilter] = useState<string>('');
  const [orderColumn, setOrderColumn] = useState<string | undefined>(undefined);
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc' | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useConfigurationStoreState('tableRowsPerPage', DEFAULT_ROWS_PER_PAGE);
  const [selected, setSelected] = useState<string[]>([]);
  const [dense, setDense] = useConfigurationStoreState('tableDense', true);

  useUpdateEffect(() => {
    setSelected([]);
  }, [queryState.data]);

  const tableData = useMemo<EntityItem[]>(() => queryState.data ?? [], [queryState.data]);
  const filteredTableData = useMemo<EntityItem[]>(
    () =>
      orderBy(
        entity.filterData(tableData, filter),
        orderColumn || entity.defaultOrder.id,
        orderDirection || entity.defaultOrder.direction
      ),
    [tableData, filter, orderDirection, orderColumn]
  );
  const visibleTableData = useMemo<EntityItem[]>(
    () =>
      entity.paging ? filteredTableData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : filteredTableData,
    [entity, filteredTableData, page, rowsPerPage]
  );

  const loading = useMemo<boolean>(() => queryState.isLoading, [queryState.isLoading]);
  const empty = useMemo<boolean>(() => !filteredTableData.length && !!filter, [filteredTableData, filter]);

  const selectedRows = useMemo<EntityItem[]>(
    () => selected.map((id) => filteredTableData.find((row) => entity.getId(row) === id)).filter(notEmpty),
    [selected, entity, tableData]
  );
  const hasSelectedRows = useMemo<boolean>(() => !isEmpty(selectedRows), [selectedRows]);
  const selectAllIndeterminate = useMemo<boolean>(
    () => !isEmpty(selectedRows) && selectedRows.length < filteredTableData.length,
    [selectedRows, filteredTableData]
  );
  const selectAllChecked = useMemo<boolean>(
    () => !isEmpty(selectedRows) && selectedRows.length === filteredTableData.length,
    [selectedRows, filteredTableData]
  );

  const hasActions = useMemo<boolean>(() => !isEmpty(entity.actions), [entity]);
  const hasMassActions = useMemo<boolean>(() => !isEmpty(entity.massActions), [entity]);

  const changeFilterHandler = useCallback(
    (newFilter: string): void => {
      setFilter(newFilter);
      setPage(0);
    },
    [setFilter, setPage]
  );

  const changeOrderHandler = useCallback(
    (columnId: string): void => {
      if (orderColumn === columnId) {
        if (orderDirection === 'desc') {
          setOrderDirection('asc');
        } else {
          setOrderDirection(undefined);
          setOrderColumn(undefined);
        }
      } else {
        setOrderDirection('desc');
        setOrderColumn(columnId);
      }
    },
    [orderColumn, orderDirection, setOrderColumn, setOrderDirection]
  );

  const selectRowHandler = useCallback(
    (row: EntityItem): void => {
      const rowId = entity.getId(row);
      const selectedIndex = selected.indexOf(rowId);

      let newSelected: string[] = [];
      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, rowId);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
      }
      setSelected(newSelected);
    },
    [selected, setSelected]
  );

  const selectAllRowsHandler = useCallback(
    (selectAll: boolean): void => {
      if (selectAll) {
        setSelected(filteredTableData.map((row) => entity.getId(row)));
        return;
      }
      setSelected([]);
    },
    [setSelected, filteredTableData]
  );

  const isRowSelected = useCallback((row: EntityItem): boolean => selected.includes(entity.getId(row)), [selected]);

  const changePageHandler = useCallback(
    (newPage: number): void => {
      setPage(newPage);
    },
    [setPage]
  );

  const changeRowsPerPageHandler = useCallback(
    (newRowsPerPage: number): void => {
      setRowsPerPage(newRowsPerPage);
      setPage(0);
    },
    [setRowsPerPage, setPage]
  );

  const changeDenseHandler = useCallback(
    (newDense: boolean): void => {
      setDense(newDense);
    },
    [setDense]
  );

  return (
    <TableContext.Provider
      value={{
        entity,
        rows: filteredTableData,
        visibleRows: visibleTableData,
        selectedRows,
        hasSelectedRows,
        selectRowHandler,
        isRowSelected,
        selectAllIndeterminate,
        selectAllChecked,
        selectAllRowsHandler,
        loading,
        empty,
        page,
        changePageHandler,
        rowsPerPage,
        changeRowsPerPageHandler,
        filter,
        changeFilterHandler,
        orderColumn,
        orderDirection,
        changeOrderHandler,
        dense,
        changeDenseHandler,
        hasActions,
        hasMassActions,
        actionsHandler,
        massActionsHandler,
      }}
    >
      {children}
    </TableContext.Provider>
  );
}

function useTable<EntityItem>(): TableContextProps<EntityItem> {
  const context = useContext(TableContext);

  if (!context) throw new Error('TableContext must be used inside TableProvider');

  return context;
}

export { TableContext, TableProvider, useTable };
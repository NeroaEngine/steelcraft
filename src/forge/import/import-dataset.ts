export type ForgeImportDatasetSource = {
  type: 'xlsx' | 'csv' | 'monday-board' | 'api';
  fileName?: string;
  worksheetName?: string;
  boardId?: string;
  sourceId?: string;
};

export type ForgeImportDataset = {
  source: ForgeImportDatasetSource;
  columns: string[];
  rows: Record<string, unknown>[];
  metadata: {
    rowCount: number;
    columnCount: number;
    readAt: string;
    warnings: string[];
  };
};

export type ForgeImportReader<TInput = unknown> = {
  sourceType: ForgeImportDatasetSource['type'];
  read: (input: TInput) => Promise<ForgeImportDataset>;
};

export function createImportDataset(source: ForgeImportDatasetSource, rows: Record<string, unknown>[], warnings: string[] = []): ForgeImportDataset {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return {
    source,
    columns,
    rows,
    metadata: {
      rowCount: rows.length,
      columnCount: columns.length,
      readAt: new Date().toISOString(),
      warnings,
    },
  };
}

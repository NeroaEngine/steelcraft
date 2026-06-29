import { createImportDataset, type ForgeImportDataset, type ForgeImportReader } from '../import-dataset';

export type SpreadsheetWorksheetInput = {
  fileName: string;
  worksheetName?: string;
  rows: Record<string, unknown>[];
};

export const spreadsheetImportReader: ForgeImportReader<SpreadsheetWorksheetInput> = {
  sourceType: 'xlsx',
  async read(input: SpreadsheetWorksheetInput): Promise<ForgeImportDataset> {
    return createImportDataset(
      { type: 'xlsx', fileName: input.fileName, worksheetName: input.worksheetName },
      input.rows,
      []
    );
  },
};

import { createImportDataset, type ForgeImportDataset, type ForgeImportReader } from '../import-dataset';

export type CsvImportInput = {
  fileName: string;
  content: string;
  delimiter?: string;
};

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export const csvImportReader: ForgeImportReader<CsvImportInput> = {
  sourceType: 'csv',
  async read(input: CsvImportInput): Promise<ForgeImportDataset> {
    const delimiter = input.delimiter || ',';
    const lines = input.content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const warnings: string[] = [];

    if (lines.length === 0) {
      return createImportDataset({ type: 'csv', fileName: input.fileName }, [], ['CSV file is empty.']);
    }

    const headers = parseCsvLine(lines[0], delimiter);
    const rows = lines.slice(1).map((line, lineIndex) => {
      const cells = parseCsvLine(line, delimiter);
      if (cells.length !== headers.length) warnings.push(`Line ${lineIndex + 2} has ${cells.length} cells but expected ${headers.length}.`);
      return headers.reduce<Record<string, unknown>>((row, header, index) => {
        row[header] = cells[index] ?? '';
        return row;
      }, {});
    });

    return createImportDataset({ type: 'csv', fileName: input.fileName }, rows, warnings);
  },
};

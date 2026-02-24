import * as XLSX from 'xlsx';

export interface ParsedSheet {
    name: string;
    columns: string[];
    headerRowIndex: number;
}

export interface ParsedWorkbook {
    originalWorkbook: XLSX.WorkBook;
    sheets: ParsedSheet[];
    fileBuffer: ArrayBuffer;
}

export type MappingType = Record<string, Record<string, string>>;
// Example: { "Sheet1": { "ExcelColumnA": "SalesforceKey1" } }

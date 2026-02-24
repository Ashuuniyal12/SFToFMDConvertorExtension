import * as ExcelJS from 'exceljs';
import { MappingType, ParsedSheet } from '../types';
import { flattenObject } from './jsonFlattener';

interface GenerateExcelParams {
    fileBuffer: ArrayBuffer;
    mappings: MappingType;
    jsonData: any[];
    sheets: ParsedSheet[];
}

// Check if generating data will overwrite existing data below the headers
export const checkOverwrite = async ({ fileBuffer, mappings, sheets }: Omit<GenerateExcelParams, 'jsonData'>): Promise<boolean> => {
    try {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(fileBuffer);

        for (const sheet of sheets) {
            const sheetMapping = mappings[sheet.name] || {};
            if (Object.keys(sheetMapping).length === 0) continue;

            const ws = wb.getWorksheet(sheet.name);
            if (!ws) continue;

            const headerRowNum = sheet.headerRowIndex + 1; // 1-based index in exceljs
            const startDataRow = headerRowNum + 1;

            // Find column indices
            const headerRow = ws.getRow(headerRowNum);
            const colCounts: Record<string, number> = {};
            const colMap: Record<string, number> = {};

            headerRow.eachCell((cell, colNumber) => {
                if (cell.value) {
                    let colName = String(cell.value).trim();
                    if (colCounts[colName]) {
                        colCounts[colName]++;
                        colName = `${colName} (${colCounts[colName]})`;
                    } else {
                        colCounts[colName] = 1;
                    }
                    colMap[colName] = colNumber;
                }
            });

            // Check if there is any data in mapped columns in rows strictly > headerRowNum
            // We just scan up to actualRowCount to see if values exist
            for (let r = startDataRow; r <= ws.rowCount; r++) {
                const row = ws.getRow(r);
                for (const excelCol of Object.keys(sheetMapping)) {
                    const colNum = colMap[excelCol];
                    if (colNum) {
                        const cell = row.getCell(colNum);
                        if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
                            return true; // Found existing data
                        }
                    }
                }
            }
        }
        return false;
    } catch (e) {
        console.error("Overwrite check failed", e);
        return false; // Safely default to false if parsing check fails
    }
};

export const generateExcel = async ({ fileBuffer, mappings, jsonData, sheets }: GenerateExcelParams): Promise<void> => {
    try {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(fileBuffer);

        for (const sheet of sheets) {
            const sheetMapping = mappings[sheet.name] || {};
            if (Object.keys(sheetMapping).length === 0) continue;

            const ws = wb.getWorksheet(sheet.name);
            if (!ws) continue;

            const headerRowNum = sheet.headerRowIndex + 1;
            const startDataRow = headerRowNum + 1;

            // Map columns similarly to how parser extracted them
            const headerRow = ws.getRow(headerRowNum);
            const colCounts: Record<string, number> = {};
            const colMap: Record<string, number> = {};

            headerRow.eachCell((cell, colNumber) => {
                if (cell.value) {
                    let colName = String(cell.value).trim();
                    if (colCounts[colName]) {
                        colCounts[colName]++;
                        colName = `${colName} (${colCounts[colName]})`;
                    } else {
                        colCounts[colName] = 1;
                    }
                    colMap[colName] = colNumber;
                }
            });

            // Flatten data once per sheet mapping
            const flatData = jsonData.map(record => flattenObject(record));

            // Write data starting from startDataRow
            let currentRowNum = startDataRow;
            for (const record of flatData) {
                const row = ws.getRow(currentRowNum++);
                Object.entries(sheetMapping).forEach(([excelCol, jsonKey]) => {
                    const colNum = colMap[excelCol];
                    if (colNum) {
                        const cell = row.getCell(colNum);
                        cell.value = record[jsonKey];
                    }
                });
                row.commit();
            }
        }

        // Write file and manually trigger download since client side
        const outputBuffer = await wb.xlsx.writeBuffer();
        const dateStr = new Date().toISOString().replace(/[:.]/g, '').split('T')[0];
        const fileName = `ExcelForge_Mapping_${dateStr}.xlsx`;

        const blob = new Blob([outputBuffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error generating Excel file:', error);
        throw new Error('Failed to generate Excel file.');
    }
};

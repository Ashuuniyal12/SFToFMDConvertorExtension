import * as XLSX from 'xlsx';
import { ParsedWorkbook, ParsedSheet } from '../types';

export const parseWorkbook = (file: File): Promise<ParsedWorkbook> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const originalWorkbook = XLSX.read(data, { type: 'array' });

                const sheets: ParsedSheet[] = originalWorkbook.SheetNames.map(sheetName => {
                    const worksheet = originalWorkbook.Sheets[sheetName];

                    if (!worksheet || !worksheet['!ref']) {
                        return { name: sheetName, columns: [], headerRowIndex: 0 };
                    }

                    // Get range to find headers in the first row
                    const range = XLSX.utils.decode_range(worksheet['!ref']);
                    let columns: string[] = [];
                    let lastHeaderRowIndex = range.s.r;

                    // Scan rows to find rows with data where the next row is empty
                    for (let R = range.s.r; R <= range.e.r; ++R) {
                        let rowHasData = false;
                        const tempCols: string[] = [];

                        for (let C = range.s.c; C <= range.e.c; ++C) {
                            const cellAddress = { c: C, r: R };
                            const cellRef = XLSX.utils.encode_cell(cellAddress);
                            const cell = worksheet[cellRef];

                            if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
                                rowHasData = true;
                                tempCols.push(String(cell.v).trim());
                            } else {
                                tempCols.push('');
                            }
                        }

                        if (rowHasData) {
                            // Check if the next row is empty or if it's the last row
                            let nextRowEmpty = true;
                            if (R < range.e.r) {
                                for (let C = range.s.c; C <= range.e.c; ++C) {
                                    const nextCellAddress = { c: C, r: R + 1 };
                                    const nextCellRef = XLSX.utils.encode_cell(nextCellAddress);
                                    const nextCell = worksheet[nextCellRef];

                                    if (nextCell && nextCell.v !== undefined && nextCell.v !== null && String(nextCell.v).trim() !== '') {
                                        nextRowEmpty = false;
                                        break;
                                    }
                                }
                            }

                            if (nextRowEmpty || R === range.e.r) {
                                tempCols.filter(c => c !== '').forEach(c => columns.push(c));
                                lastHeaderRowIndex = Math.max(lastHeaderRowIndex, R);
                            }
                        }
                    }

                    // Handle duplicated columns gracefully instead of strict Set deduplication
                    const uniqueColumns: string[] = [];
                    const colCounts: Record<string, number> = {};
                    columns.forEach(col => {
                        let newColName = col;
                        if (colCounts[col]) {
                            colCounts[col]++;
                            newColName = `${col} (${colCounts[col]})`;
                        } else {
                            colCounts[col] = 1;
                        }
                        uniqueColumns.push(newColName);
                    });

                    return {
                        name: sheetName,
                        columns: uniqueColumns,
                        headerRowIndex: lastHeaderRowIndex
                    };
                });

                resolve({ originalWorkbook, sheets, fileBuffer: data.buffer });
            } catch (err) {
                reject(new Error('Failed to parse Excel file. Ensure it is a valid .xlsx format.'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read the file.'));
        };

        reader.readAsArrayBuffer(file);
    });
};

import ExcelJS from 'exceljs';
import { MappingEngine } from './mappingEngine';
import { MappingConfig, SalesforceField } from '../types';

export class ExcelGenerator {
    private workbook: ExcelJS.Workbook;

    constructor() {
        this.workbook = new ExcelJS.Workbook();
    }

    async generateFMD(
        objectName: string,
        fields: SalesforceField[],
        mappingEngine: MappingEngine,
        userConfig: MappingConfig
    ): Promise<ExcelJS.Buffer> {

        this.workbook = new ExcelJS.Workbook();
        const sheetName = `FMD_${objectName}`.substring(0, 31);
        const sheet = this.workbook.addWorksheet(sheetName);

        // -----------------------------
        // Set Column Widths (A to J)
        // -----------------------------
        sheet.columns = [
            { width: 25 }, // A
            { width: 30 }, // B
            { width: 25 }, // C
            { width: 12 }, // D
            { width: 25 }, // E
            { width: 5 },  // F (spacing)
            { width: 25 }, // G
            { width: 30 }, // H
            { width: 20 }, // I
            { width: 12 }  // J
        ];

        // =============================
        // 1️⃣ Top Metadata Section
        // =============================

        sheet.getCell('A1').value = 'Platform:';
        sheet.getCell('B1').value = 'DataFabric';

        sheet.getCell('A3').value = 'Sr.No.';
        sheet.getCell('B3').value = 'Topic / Table Name';
        sheet.getCell('C3').value = 'Per day volume (Expected volume in production)';
        sheet.getCell('D3').value = 'POC';

        sheet.getRow(3).font = { bold: true };
        sheet.getRow(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFC000' }
        };

        sheet.getCell('A4').value = 1;
        sheet.getCell('B4').value = objectName;
        sheet.getCell('D4').value = userConfig.poc || '';

        // =============================
        // 2️⃣ Section Headers
        // =============================

        const headerRow = 8;

        // Source Header (Blue)
        sheet.getCell(`A${headerRow}`).value = 'Field Name';
        sheet.getCell(`B${headerRow}`).value = 'Table/File Name/Topic';
        sheet.getCell(`C${headerRow}`).value = 'Type';
        sheet.getCell(`D${headerRow}`).value = 'Length';
        sheet.getCell(`E${headerRow}`).value = 'Avanade/PII/AFS/PII Sensitive';

        // Target Header (Purple)
        sheet.getCell(`G${headerRow}`).value = 'Field Name';
        sheet.getCell(`H${headerRow}`).value = 'Table/File Name/Topic';
        sheet.getCell(`I${headerRow}`).value = 'Type';
        sheet.getCell(`J${headerRow}`).value = 'Length';

        // Style Source Header
        ['A', 'B', 'C', 'D', 'E'].forEach(col => {
            const cell = sheet.getCell(`${col}${headerRow}`);
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF00B0F0' }
            };
        });

        // Style Target Header
        ['G', 'H', 'I', 'J'].forEach(col => {
            const cell = sheet.getCell(`${col}${headerRow}`);
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF7030A0' }
            };
        });

        // =============================
        // 3️⃣ Data Rows
        // =============================

        let currentRow = headerRow + 1;

        fields.forEach(field => {
            const mapped = mappingEngine.mapField(field, objectName, userConfig);

            // Source
            sheet.getCell(`A${currentRow}`).value = field.name;
            sheet.getCell(`B${currentRow}`).value = objectName;
            sheet.getCell(`C${currentRow}`).value = field.type;
            sheet.getCell(`D${currentRow}`).value = field.length || 0;
            sheet.getCell(`E${currentRow}`).value = '';

            // Target
            sheet.getCell(`G${currentRow}`).value = mapped.targetField;
            sheet.getCell(`H${currentRow}`).value = objectName;
            sheet.getCell(`I${currentRow}`).value = mapped.targetType;
            sheet.getCell(`J${currentRow}`).value = field.length || 0;

            currentRow++;
        });

        // =============================
        // 4️⃣ Apply Borders
        // =============================

        for (let row = headerRow; row < currentRow; row++) {
            ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'J'].forEach(col => {
                const cell = sheet.getCell(`${col}${row}`);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        }

        return await this.workbook.xlsx.writeBuffer();
    }

    downloadExcel(buffer: ExcelJS.Buffer, filename: string) {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);

        // Use chrome.downloads if available
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }, () => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                // Fallback usually not needed in extension context but good to have
            }
        });
    }
}

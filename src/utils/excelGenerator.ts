import ExcelJS from 'exceljs';
import { MappingEngine } from './mappingEngine';
import { MappingConfig, SalesforceField } from '../types';

export class ExcelGenerator {
    private workbook: ExcelJS.Workbook;

    constructor() {
        this.workbook = new ExcelJS.Workbook();
    }

    async generateFMD(objectName: string, fields: SalesforceField[], mappingEngine: MappingEngine, userConfig: MappingConfig): Promise<ExcelJS.Buffer> {
        this.workbook = new ExcelJS.Workbook();
        this.workbook.creator = 'SF FMD Generator';
        this.workbook.lastModifiedBy = 'SF FMD Generator';
        this.workbook.created = new Date();
        this.workbook.modified = new Date();

        const sheetName = `FMD_${objectName}`.substring(0, 31);
        const sheet = this.workbook.addWorksheet(sheetName);

        sheet.columns = [
            { header: 'Source Object', key: 'sourceObject', width: 20 },
            { header: 'Source Field', key: 'sourceField', width: 25 },
            { header: 'SF Type', key: 'sourceType', width: 15 },
            { header: 'Length', key: 'length', width: 10 },
            { header: 'Precision', key: 'precision', width: 10 },
            { header: 'Target Field', key: 'targetField', width: 25 },
            { header: 'Target Type', key: 'targetType', width: 15 },
            { header: 'Mode', key: 'mode', width: 12 },
            { header: 'Dataset', key: 'dataset', width: 15 },
            { header: 'Table', key: 'table', width: 20 }
        ];

        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFA100FF' }
        };

        fields.forEach(field => {
            const rowData = mappingEngine.mapField(field, objectName, userConfig);
            sheet.addRow(rowData);
        });

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

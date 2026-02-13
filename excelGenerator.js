class ExcelGenerator {
    constructor() {
        this.workbook = new ExcelJS.Workbook();
    }

    async generateFMD(objectName, fields, mappingEngine, userConfig) {
        this.workbook = new ExcelJS.Workbook();
        this.workbook.creator = 'SF FMD Generator';
        this.workbook.lastModifiedBy = 'SF FMD Generator';
        this.workbook.created = new Date();
        this.workbook.modified = new Date();

        const sheetName = `FMD_${objectName}`.substring(0, 31); // Excel limit
        const sheet = this.workbook.addWorksheet(sheetName);

        // Define Columns
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

        // Style Header
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFA100FF' } // Accenture Purple
        };

        // Add Data
        fields.forEach(field => {
            const rowData = mappingEngine.mapField(field, objectName, userConfig);
            sheet.addRow(rowData);
        });

        // Generate Buffer
        const buffer = await this.workbook.xlsx.writeBuffer();
        return buffer;
    }

    downloadExcel(buffer, filename) {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true // Prompt user to save
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                // Fallback if chrome.downloads not available (e.g. some contexts)
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }
}

window.ExcelGenerator = ExcelGenerator;

import React, { useCallback } from 'react';
import { useExcelForgeStore } from '../store/useExcelForgeStore';
import { parseWorkbook } from '../services/excelParser';
import { FileUp, FileSpreadsheet, AlertCircle } from 'lucide-react';

export const ExcelUploader: React.FC = () => {
    const { setWorkbook, setSheets, setLoading, setError, loading, error, workbook } = useExcelForgeStore();

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.xlsx')) {
            setError('Please upload a valid .xlsx file.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { originalWorkbook, sheets, fileBuffer } = await parseWorkbook(file);
            setWorkbook(originalWorkbook, fileBuffer);
            setSheets(sheets);
        } catch (err: any) {
            setError(err.message || 'Error parsing Excel file');
        } finally {
            setLoading(false);
            // Reset input value so same file can be uploaded again if needed
            event.target.value = '';
        }
    }, [setWorkbook, setSheets, setLoading, setError]);

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-xl border-border dark:border-border-dark bg-white dark:bg-surface-dark">
            <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-primary w-6 h-6" />
                <h2 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">
                    Excel Template
                </h2>
            </div>

            <div className="relative group cursor-pointer border-2 border-dashed border-border dark:border-border-dark hover:border-primary dark:hover:border-primary transition-colors rounded-lg p-6 flex flex-col items-center justify-center bg-background dark:bg-background-dark/50">
                <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <FileUp className={`w-8 h-8 ${loading ? 'animate-bounce text-primary' : 'text-text-secondary dark:text-text-dark-secondary group-hover:text-primary transition-colors'}`} />
                    <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
                        {loading ? 'Parsing Template...' : 'Drag & Drop .xlsx Template or Click to Browse'}
                    </p>
                    {workbook && !loading && (
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                            Current Template Loaded
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-500/10 rounded-md">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
};

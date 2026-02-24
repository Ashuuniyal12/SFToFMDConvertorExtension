import React, { useState } from 'react';
import { useExcelForgeStore } from '../store/useExcelForgeStore';
import { generateExcel, checkOverwrite } from '../services/excelGenerator';
import { DownloadCloud, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';

export const GeneratePanel: React.FC = () => {
    const { workbook, fileBuffer, sheets, mappings, jsonData, setError } = useExcelForgeStore();

    const [isGenerating, setIsGenerating] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [warningMessages, setWarningMessages] = useState<string[]>([]);

    // Validation logic
    const isReady = fileBuffer !== null && sheets.length > 0 && jsonData.length > 0;

    const isLargeDataset = jsonData.length > 10000;

    const handleGenerateClick = async () => {
        if (!isReady || !fileBuffer) return;

        let warnings: string[] = [];

        // Check if there are any unmapped sheets or columns that user might have missed
        let totalColumns = 0;
        let totalMapped = 0;

        sheets.forEach(sheet => {
            totalColumns += sheet.columns.length;
            totalMapped += Object.keys(mappings[sheet.name] || {}).length;
        });

        if (totalMapped < totalColumns) {
            warnings.push("Some columns in your Excel template are unmapped and will be left blank.");
        }

        if (isLargeDataset) {
            warnings.push(`You are attempting to export a large dataset (${jsonData.length.toLocaleString()} records). This may take a moment.`);
        }

        setIsGenerating(true); // Used as visual loading indicator during the check
        const willOverwrite = await checkOverwrite({ fileBuffer, mappings, sheets });
        setIsGenerating(false);

        if (willOverwrite) {
            warnings.push("Data already exists in the destination columns below the headers. Proceeding will overwrite or merge with existing data.");
        }

        if (warnings.length > 0) {
            setWarningMessages(warnings);
            setShowConfirm(true);
        } else {
            executeGeneration();
        }
    };

    const executeGeneration = async () => {
        if (!fileBuffer) return;

        setIsGenerating(true);
        setError(null);
        setShowConfirm(false);

        try {
            // Small timeout to allow UI to update (show loading state before heavy JS blocks thread)
            setTimeout(async () => {
                try {
                    await generateExcel({ fileBuffer, mappings, jsonData, sheets });
                    setIsGenerating(false);
                } catch (err: any) {
                    setError(err.message || 'Failed to generate Excel file.');
                    setIsGenerating(false);
                }
            }, 50);

        } catch (err: any) {
            setError(err.message || 'Failed to generate Excel file.');
            setIsGenerating(false);
            setShowConfirm(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-xl border-border dark:border-border-dark bg-white dark:bg-surface-dark relative">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="font-semibold flex items-center gap-2 text-text-primary dark:text-text-dark-primary">
                        <DownloadCloud className="w-5 h-5 text-primary" />
                        Generate Excel
                    </h3>
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                        Review your setup and generate the populated multi-sheet Excel file.
                    </p>
                </div>

                <button
                    onClick={handleGenerateClick}
                    disabled={!isReady || isGenerating}
                    className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all
              ${isReady && !isGenerating
                            ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/25 cursor-pointer hover:-translate-y-0.5'
                            : 'bg-primary/50 text-white cursor-not-allowed opacity-70'}
            `}
                >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5" />}
                    {isGenerating ? 'Processing...' : 'Generate & Download'}
                </button>
            </div>

            {/* Validation warnings */}
            <div className="flex flex-col gap-2 mt-2">
                {!workbook && (
                    <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
                        <AlertTriangle className="w-4 h-4" /> Template workbook is missing.
                    </div>
                )}
                {workbook && jsonData.length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
                        <AlertTriangle className="w-4 h-4" /> Fetch Salesforce data first.
                    </div>
                )}
                {isLargeDataset && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        Large dataset detected ({jsonData.length.toLocaleString()} records). Generation may take a moment.
                    </div>
                )}
            </div>

            {/* Warning Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-xl w-full max-w-md flex flex-col border border-border dark:border-border-dark animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-border dark:border-border-dark flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">Confirm Generation</h2>
                        </div>
                        <div className="p-5 flex flex-col gap-3">
                            {warningMessages.map((msg, idx) => (
                                <div key={idx} className="flex gap-2 text-sm text-text-secondary dark:text-text-dark-secondary bg-yellow-50 dark:bg-[#2D2D2D] p-3 rounded border border-yellow-200 dark:border-yellow-900/50">
                                    <span className="shrink-0 font-bold text-yellow-600 dark:text-yellow-500">•</span>
                                    <span>{msg}</span>
                                </div>
                            ))}
                            <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary mt-2">
                                Do you want to proceed with generating the file?
                            </p>
                        </div>
                        <div className="p-5 border-t border-border dark:border-border-dark flex justify-end gap-3 bg-surface dark:bg-[#1E1E1E] rounded-b-lg">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-text-primary dark:text-text-dark-primary bg-white dark:bg-[#2D2D2D] border border-border dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-[#3D3D3D] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeGeneration}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded shadow-sm hover:shadow transition-all active:scale-95"
                            >
                                Proceed & Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

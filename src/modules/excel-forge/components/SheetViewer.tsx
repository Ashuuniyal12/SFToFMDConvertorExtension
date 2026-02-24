import React from 'react';
import { useExcelForgeStore } from '../store/useExcelForgeStore';
import { LayoutList, ChevronRight, CheckCircle2 } from 'lucide-react';

interface SheetViewerProps {
    onSheetSelect: (sheetName: string) => void;
    activeSheet: string | null;
}

export const SheetViewer: React.FC<SheetViewerProps> = ({ onSheetSelect, activeSheet }) => {
    const { sheets, mappings } = useExcelForgeStore();

    if (sheets.length === 0) {
        return (
            <div className="p-4 border rounded-xl border-border dark:border-border-dark bg-white dark:bg-surface-dark h-full">
                <div className="flex items-center justify-center h-full text-sm text-text-secondary dark:text-text-dark-secondary">
                    Upload an Excel template to see sheets here.
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-4 border rounded-xl border-border dark:border-border-dark bg-white dark:bg-surface-dark h-full max-h-[500px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border dark:border-border-dark">
                <LayoutList className="text-primary w-5 h-5" />
                <h3 className="font-semibold text-text-primary dark:text-text-dark-primary">Detected Sheets</h3>
            </div>

            <div className="flex flex-col gap-2">
                {sheets.map((sheet) => {
                    const isActive = activeSheet === sheet.name;
                    const numColumns = sheet.columns.length;

                    // Check if mapped
                    const mappedColumnsCount = Object.keys(mappings[sheet.name] || {}).length;
                    const isFullyMapped = numColumns > 0 && mappedColumnsCount === numColumns;
                    const isPartiallyMapped = mappedColumnsCount > 0 && mappedColumnsCount < numColumns;

                    return (
                        <button
                            key={sheet.name}
                            onClick={() => onSheetSelect(sheet.name)}
                            className={`flex items-center justify-between p-3 rounded-lg text-left transition-colors border ${isActive
                                ? 'bg-primary/5 dark:bg-primary/20 border-primary shadow-sm'
                                : 'bg-background dark:bg-background-dark border-transparent hover:border-border dark:hover:border-border-dark'
                                }`}
                        >
                            <div className="flex flex-col gap-1 overflow-hidden">
                                <span className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-text-primary dark:text-text-dark-primary'}`}>
                                    {sheet.name}
                                </span>
                                <span className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                    {numColumns} columns
                                </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {isFullyMapped && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                {isPartiallyMapped && <span className="w-2 h-2 rounded-full bg-yellow-500" />}
                                <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-primary' : 'text-text-secondary dark:text-text-dark-secondary'}`} />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

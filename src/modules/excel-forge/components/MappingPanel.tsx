import React from 'react';
import { useExcelForgeStore } from '../store/useExcelForgeStore';
import { Columns, AlertTriangle, ArrowRight } from 'lucide-react';

interface MappingPanelProps {
    activeSheet: string | null;
}

export const MappingPanel: React.FC<MappingPanelProps> = ({ activeSheet }) => {
    const { sheets, mappings, updateMapping, flattenedKeys } = useExcelForgeStore();

    if (!activeSheet) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border rounded-xl border-border dark:border-border-dark bg-white dark:bg-surface-dark h-full">
                <Columns className="w-12 h-12 text-border dark:text-border-dark mb-4" />
                <h3 className="text-lg font-medium text-text-primary dark:text-text-dark-primary mb-2">No Sheet Selected</h3>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary text-center max-w-sm">
                    Select a sheet from the sidebar to configure column mappings.
                </p>
            </div>
        );
    }

    const sheetData = sheets.find(s => s.name === activeSheet);
    const currentMapping = mappings[activeSheet] || {};

    if (!sheetData) {
        return null; // Should not happen
    }

    if (sheetData.columns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border rounded-xl border-border dark:border-border-dark bg-white dark:bg-surface-dark h-full">
                <AlertTriangle className="w-10 h-10 text-yellow-500 mb-4" />
                <h3 className="text-lg font-medium text-text-primary dark:text-text-dark-primary mb-2">Empty Sheet</h3>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary text-center max-w-sm">
                    No column headers were found in "{activeSheet}". Ensure the first row contains header names.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full border rounded-xl border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark bg-background dark:bg-background-dark/50">
                <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-text-primary dark:text-text-dark-primary flex items-center gap-2">
                        Mapping Configuration
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {activeSheet}
                        </span>
                    </h3>
                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                        Map Excel columns to Salesforce JSON fields. Unmapped columns will be left blank.
                    </p>
                </div>

                {/* Mapping Progress Badge */}
                <div className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
                    {Object.keys(currentMapping).length} / {sheetData.columns.length} Mapped
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr>
                            <th className="pb-3 px-2 font-medium text-text-secondary dark:text-text-dark-secondary w-[45%]">
                                Excel Column
                            </th>
                            <th className="pb-3 px-2 w-[10%] text-center"></th>
                            <th className="pb-3 px-2 font-medium text-text-secondary dark:text-text-dark-secondary w-[45%]">
                                JSON Data Key
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sheetData.columns.map((col, idx) => {
                            const mappedVal = currentMapping[col] || '';
                            const isMapped = !!mappedVal;

                            return (
                                <tr key={`${col}-${idx}`} className="group hover:bg-background dark:hover:bg-background-dark transition-colors border-b border-border dark:border-border-dark last:border-0">
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium ${isMapped ? 'text-text-primary dark:text-text-dark-primary' : 'text-text-secondary dark:text-text-dark-secondary'}`}>
                                                {col}
                                            </span>
                                            {!isMapped && (
                                                <div className="group/tooltip relative">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 text-[10px] text-white bg-gray-800 rounded opacity-0 group-hover/tooltip:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                                        Unmapped column
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="py-3 px-2 flex justify-center text-border dark:text-border-dark group-hover:text-primary transition-colors">
                                        <ArrowRight className="w-4 h-4" />
                                    </td>

                                    <td className="py-3 px-2 relative">
                                        <select
                                            value={mappedVal}
                                            onChange={(e) => updateMapping(activeSheet, col, e.target.value)}
                                            className="w-full bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-md p-2 text-sm text-text-primary dark:text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-8"
                                        >
                                            <option value="">-- Ignore Column --</option>
                                            {flattenedKeys.length > 0 ? (
                                                flattenedKeys.map((key) => (
                                                    <option key={key} value={key}>{key}</option>
                                                ))
                                            ) : (
                                                <option value="" disabled>Fetch data first to see options...</option>
                                            )}
                                        </select>
                                        {/* Custom Dropdown Arrow */}
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-text-secondary dark:text-text-dark-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

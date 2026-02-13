import React from 'react';
import { SalesforceField } from '../types';

interface FieldTableProps {
    fields: SalesforceField[];
    onToggleField: (index: number, selected: boolean) => void;
    onToggleAll: (selected: boolean) => void;
    onUpdateDf: (index: number, dfData: any) => void;
}

export const FieldTable: React.FC<FieldTableProps> = ({ fields, onToggleField, onToggleAll, onUpdateDf }) => {
    const allSelected = fields.length > 0 && fields.every(f => f.selected);

    return (
        <div className="flex flex-col w-full text-[13px] border border-border dark:border-border-dark rounded-md overflow-hidden bg-white dark:bg-surface-dark">
            {/* Header */}
            <div className="grid grid-cols-[40px_1.5fr_1.5fr_1fr_0.8fr_1fr] items-center bg-surface dark:bg-[#1E1E1E] border-b border-border dark:border-border-dark font-semibold text-text-secondary dark:text-text-dark-secondary select-none sticky top-0 z-10">
                <div className="flex items-center justify-center p-3">
                    <input
                        type="checkbox"
                        className="accent-primary w-4 h-4 cursor-pointer"
                        checked={allSelected}
                        onChange={(e) => onToggleAll(e.target.checked)}
                    />
                </div>
                <div className="flex items-center uppercase text-[11px] tracking-wider p-3">API Name</div>
                <div className="flex items-center uppercase text-[11px] tracking-wider p-3">Label</div>
                <div className="flex items-center uppercase text-[11px] tracking-wider p-3">Type</div>
                <div className="flex items-center uppercase text-[11px] tracking-wider p-3">Length</div>
                <div className="flex items-center uppercase text-[11px] tracking-wider p-3">Attributes</div>
            </div>

            {/* Body */}
            <div className="flex flex-col">
                {fields.map((field, index) => (
                    <React.Fragment key={`${field.name}-${index}`}>
                        <div
                            className={`grid grid-cols-[40px_1.5fr_1.5fr_1fr_0.8fr_1fr] items-center border-b border-border dark:border-border-dark last:border-b-0 hover:bg-[#A100FF0a] transition-colors duration-100 ${field.calculated ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`}
                        >
                            <div className="flex items-center justify-center p-2">
                                <input
                                    type="checkbox"
                                    className="accent-primary w-4 h-4 cursor-pointer"
                                    checked={!!field.selected}
                                    onChange={(e) => onToggleField(index, e.target.checked)}
                                />
                            </div>
                            <div className="p-2.5 truncate text-text-primary dark:text-text-dark-primary" title={field.name}>{field.name}</div>
                            <div className="p-2.5 truncate text-text-primary dark:text-text-dark-primary" title={field.label}>{field.label}</div>
                            <div className="p-2.5 truncate text-text-primary dark:text-text-dark-primary">{field.type}</div>
                            <div className="p-2.5 truncate text-text-primary dark:text-text-dark-primary">{field.length || ''}</div>
                            <div className="p-2.5 flex items-center gap-1.5 scrollbar-hide overflow-x-auto">
                                {field.calculated ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                        FORMULA
                                    </span>
                                ) : field.custom ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                        CUSTOM
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                        SYSTEM
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* DF Mapping Row for Formula Fields */}
                        {field.calculated && field.selected && (
                            <div className="col-span-6 bg-gray-50 dark:bg-[#252525] p-3 pl-14 border-b border-border dark:border-border-dark animate-in slide-in-from-top-2 duration-200">
                                <div className="flex flex-col gap-2">
                                    <div className="text-[11px] font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                        Destinational Field (DF) Mapping
                                        {field.dfMapping?.mappedDfName && <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 ml-2">AUTO-MAPPED</span>}
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[11px] text-text-secondary dark:text-text-dark-secondary">DF Label</label>
                                            <input
                                                type="text"
                                                className={`p-1.5 text-[12px] border border-border dark:border-border-dark rounded bg-white dark:bg-[#1E1E1E] text-text-primary dark:text-text-dark-primary focus:border-primary outline-none ${field.dfMapping?.mappedDfName ? 'opacity-70 bg-gray-100 dark:bg-[#2A2A2A] cursor-not-allowed' : ''}`}
                                                value={field.dfMapping?.manualDf?.label || `DF ${field.label}`}
                                                onChange={(e) => !field.dfMapping?.mappedDfName && onUpdateDf(index, { ...field.dfMapping?.manualDf, label: e.target.value })}
                                                placeholder={`DF ${field.label}`}
                                                disabled={!!field.dfMapping?.mappedDfName}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[11px] text-text-secondary dark:text-text-dark-secondary">DF API Name</label>
                                            <input
                                                type="text"
                                                className={`p-1.5 text-[12px] border border-border dark:border-border-dark rounded bg-white dark:bg-[#1E1E1E] text-text-primary dark:text-text-dark-primary focus:border-primary outline-none font-mono ${field.dfMapping?.mappedDfName ? 'opacity-70 bg-gray-100 dark:bg-[#2A2A2A] cursor-not-allowed' : ''}`}
                                                value={field.dfMapping?.manualDf?.name || `DF_${field.name.replace(/__c$/, '')}__c`}
                                                onChange={(e) => !field.dfMapping?.mappedDfName && onUpdateDf(index, { ...field.dfMapping?.manualDf, name: e.target.value })}
                                                placeholder={`DF_${field.name}`}
                                                disabled={!!field.dfMapping?.mappedDfName}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[11px] text-text-secondary dark:text-text-dark-secondary">Type</label>
                                            <select
                                                className={`p-1.5 text-[12px] border border-border dark:border-border-dark rounded bg-white dark:bg-[#1E1E1E] text-text-primary dark:text-text-dark-primary focus:border-primary outline-none ${field.dfMapping?.mappedDfName ? 'opacity-70 bg-gray-100 dark:bg-[#2A2A2A] cursor-not-allowed' : ''}`}
                                                value={field.dfMapping?.manualDf?.type || field.type}
                                                onChange={(e) => !field.dfMapping?.mappedDfName && onUpdateDf(index, { ...field.dfMapping?.manualDf, type: e.target.value })}
                                                disabled={!!field.dfMapping?.mappedDfName}
                                            >
                                                <option value="string">String</option>
                                                <option value="double">Double</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="date">Date</option>
                                                <option value="datetime">DateTime</option>
                                                <option value="currency">Currency</option>
                                                <option value="percent">Percent</option>
                                                <option value="int">Int</option>
                                                <option value="reference">Reference</option>
                                                <option value="textarea">Text Area</option>
                                                <option value="picklist">Picklist</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex flex-col gap-1 w-1/2">
                                                <label className="text-[11px] text-text-secondary dark:text-text-dark-secondary">Length</label>
                                                <input
                                                    type="number"
                                                    className={`p-1.5 text-[12px] border border-border dark:border-border-dark rounded bg-white dark:bg-[#1E1E1E] text-text-primary dark:text-text-dark-primary focus:border-primary outline-none ${field.dfMapping?.mappedDfName ? 'opacity-70 bg-gray-100 dark:bg-[#2A2A2A] cursor-not-allowed' : ''}`}
                                                    value={field.dfMapping?.manualDf?.length || field.length || 0}
                                                    onChange={(e) => !field.dfMapping?.mappedDfName && onUpdateDf(index, { ...field.dfMapping?.manualDf, length: parseInt(e.target.value) })}
                                                    disabled={!!field.dfMapping?.mappedDfName}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 w-1/2">
                                                <label className="text-[11px] text-text-secondary dark:text-text-dark-secondary">Prec</label>
                                                <input
                                                    type="number"
                                                    className={`p-1.5 text-[12px] border border-border dark:border-border-dark rounded bg-white dark:bg-[#1E1E1E] text-text-primary dark:text-text-dark-primary focus:border-primary outline-none ${field.dfMapping?.mappedDfName ? 'opacity-70 bg-gray-100 dark:bg-[#2A2A2A] cursor-not-allowed' : ''}`}
                                                    value={field.dfMapping?.manualDf?.precision || field.precision || 0}
                                                    onChange={(e) => !field.dfMapping?.mappedDfName && onUpdateDf(index, { ...field.dfMapping?.manualDf, precision: parseInt(e.target.value) })}
                                                    disabled={!!field.dfMapping?.mappedDfName}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
                {fields.length === 0 && (
                    <div className="flex justify-center p-5 text-text-secondary dark:text-text-dark-secondary">
                        No fields found.
                    </div>
                )}
            </div>
        </div>
    );
};

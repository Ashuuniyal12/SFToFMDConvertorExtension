import React, { useState, useMemo } from 'react';
import { SalesforceField } from '../types';
import { ChevronDown, ChevronUp, ChevronsUpDown, Settings2, Check } from 'lucide-react';

interface FieldTableProps {
    fields: SalesforceField[];
    onToggleField: (name: string, selected: boolean) => void;
    onToggleAll: (selected: boolean) => void;
    onUpdateDf: (name: string, dfData: any) => void;
}

type ColumnId = 'name' | 'label' | 'type' | 'length' | 'precision' | 'scale' | 'attributes' | 'calculatedFormula' | 'referenceTo' | 'relationshipName';

const AVAILABLE_COLUMNS: { id: ColumnId; label: string; width?: string }[] = [
    { id: 'name', label: 'API Name', width: '1.5fr' },
    { id: 'label', label: 'Label', width: '1.5fr' },
    { id: 'type', label: 'Type', width: '1fr' },
    { id: 'length', label: 'Length', width: '0.6fr' },
    { id: 'precision', label: 'Precision', width: '0.6fr' },
    { id: 'scale', label: 'Scale', width: '0.6fr' },
    { id: 'attributes', label: 'Attributes', width: '1fr' },
    { id: 'calculatedFormula', label: 'Formula', width: '1.5fr' },
    { id: 'referenceTo', label: 'Reference To', width: '1fr' },
    { id: 'relationshipName', label: 'Rel. Name', width: '1fr' },
];

export const FieldTable: React.FC<FieldTableProps> = ({ fields, onToggleField, onToggleAll, onUpdateDf }) => {
    const [sortConfig, setSortConfig] = useState<{ key: ColumnId | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
    const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(new Set(['name', 'label', 'type', 'length', 'precision', 'attributes'])); // Default visible
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    const allSelected = fields.length > 0 && fields.every(f => f.selected);

    const handleSort = (key: ColumnId) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleColumn = (id: ColumnId) => {
        const newSet = new Set(visibleColumns);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setVisibleColumns(newSet);
    };

    const sortedFields = useMemo(() => {
        let sortableItems = [...fields];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof SalesforceField];
                let bValue: any = b[sortConfig.key as keyof SalesforceField];

                // Handle derived/special values
                if (sortConfig.key === 'attributes') {
                    aValue = a.calculated ? 'Formula' : a.custom ? 'Custom' : 'System';
                    bValue = b.calculated ? 'Formula' : b.custom ? 'Custom' : 'System';
                } else if (sortConfig.key === 'referenceTo') {
                    aValue = a.referenceTo ? a.referenceTo.join(', ') : '';
                    bValue = b.referenceTo ? b.referenceTo.join(', ') : '';
                }

                // Handle boolean sorting (false < true)
                if (typeof aValue === 'boolean') aValue = aValue ? 1 : 0;
                if (typeof bValue === 'boolean') bValue = bValue ? 1 : 0;

                // Handle undefined/null
                if (aValue === undefined || aValue === null) aValue = '';
                if (bValue === undefined || bValue === null) bValue = '';


                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [fields, sortConfig]);

    // Dynamic Grid Template Columns
    const getGridTemplate = () => {
        const parts = ['40px']; // Checkbox
        AVAILABLE_COLUMNS.forEach(col => {
            if (visibleColumns.has(col.id)) {
                parts.push(col.width || '1fr');
            }
        });
        return parts.join(' ');
    };

    const gridTemplate = getGridTemplate();

    const SortIcon = ({ column }: { column: ColumnId }) => {
        if (sortConfig.key !== column) return <ChevronsUpDown size={14} className="text-gray-400 opacity-0 group-hover:opacity-50" />;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-primary" />;
    };

    // Helper to render cell content based on type
    const renderCell = (field: SalesforceField, colId: ColumnId) => {
        switch (colId) {
            case 'name': return <div className="p-2.5 truncate text-text-primary dark:text-text-dark-primary font-medium" title={field.name}>{field.name}</div>;
            case 'label': return <div className="p-2.5 truncate text-text-secondary dark:text-text-dark-secondary" title={field.label}>{field.label}</div>;
            case 'type': return <div className="p-2.5 truncate text-text-primary dark:text-text-dark-primary"><span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[11px] font-mono">{field.type}</span></div>;
            case 'length': return <div className="p-2.5 truncate text-text-primary dark:text-text-dark-primary">{field.length || '-'}</div>;
            case 'precision': return <div className="p-2.5 truncate text-text-primary dark:text-text-dark-primary">{field.precision || '-'}</div>;
            case 'scale': return <div className="p-2.5 truncate text-text-primary dark:text-text-dark-primary">{field.scale || '-'}</div>;
            case 'attributes': return (
                <div className="p-2.5 flex items-center gap-1.5 scrollbar-hide overflow-x-auto">
                    {field.calculated ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">FORMULA</span>
                    ) : field.custom ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">CUSTOM</span>
                    ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">SYSTEM</span>
                    )}
                </div>
            );
            case 'calculatedFormula': return <div className="p-2.5 truncate text-text-secondary dark:text-text-dark-secondary font-mono text-[11px]" title={field.calculatedFormula}>{field.calculatedFormula || ''}</div>;
            case 'referenceTo': return <div className="p-2.5 truncate text-text-primary dark:text-text-dark-primary" title={field.referenceTo?.join(', ')}>{field.referenceTo?.join(', ') || ''}</div>;
            case 'relationshipName': return <div className="p-2.5 truncate text-text-primary dark:text-text-dark-primary" title={field.relationshipName}>{field.relationshipName || ''}</div>;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col w-full text-[13px] border border-border dark:border-border-dark rounded-md bg-white dark:bg-surface-dark relative">

            {/* Column Visibility Menu */}
            {showColumnMenu && (
                <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowColumnMenu(false)} />
                    <div className="absolute top-10 right-2 z-30 bg-white dark:bg-[#252525] border border-border dark:border-border-dark rounded-md shadow-lg p-2 min-w-[200px] max-h-[400px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                        <div className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary mb-2 px-2 pb-2 border-b border-border dark:border-border-dark">Toggle Columns</div>
                        {AVAILABLE_COLUMNS.map(col => (
                            <div
                                key={col.id}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface dark:hover:bg-[#333] rounded cursor-pointer text-text-primary dark:text-text-dark-primary"
                                onClick={() => toggleColumn(col.id)}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${visibleColumns.has(col.id) ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                                    {visibleColumns.has(col.id) && <Check size={10} className="text-white" />}
                                </div>
                                <span className="truncate">{col.label}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Header */}
            <div className="sticky top-0 z-10 w-fit min-w-full">
                <div
                    className="grid items-center bg-surface dark:bg-[#1E1E1E] border-b border-border dark:border-border-dark font-semibold text-text-secondary dark:text-text-dark-secondary select-none w-full"
                    style={{ gridTemplateColumns: gridTemplate }}
                >
                    <div className="flex items-center justify-center p-3 h-full border-r border-transparent">
                        <input
                            type="checkbox"
                            className="accent-primary w-4 h-4 cursor-pointer"
                            checked={allSelected}
                            onChange={(e) => onToggleAll(e.target.checked)}
                        />
                    </div>

                    {AVAILABLE_COLUMNS.map(col => visibleColumns.has(col.id) && (
                        <div
                            key={col.id}
                            className={`flex items-center gap-1 uppercase text-[11px] tracking-wider p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors group h-full whitespace-nowrap overflow-hidden text-ellipsis`}
                            onClick={() => handleSort(col.id)}
                            title={col.label}
                        >
                            {col.label}
                            <SortIcon column={col.id} />
                        </div>
                    ))}
                </div>
                {/* Column Settings Button (Absolute positioned in header area but aligned to right) */}
                <div className="absolute top-0 right-0 h-[45px] flex items-center pr-2 bg-gradient-to-l from-surface via-surface to-transparent dark:from-[#1E1E1E] dark:via-[#1E1E1E]">
                    <button
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#333] text-text-secondary dark:text-text-dark-secondary transition-colors"
                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                        title="Column Options"
                    >
                        <Settings2 size={16} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col w-fit min-w-full">
                {sortedFields.map((field, index) => (
                    <React.Fragment key={`${field.name}-${index}`}>
                        <div
                            className={`grid items-center border-b border-border dark:border-border-dark last:border-b-0 hover:bg-[color-mix(in_srgb,var(--color-row-hover),transparent_90%)] transition-colors duration-100 ${field.calculated ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`}
                            style={{ gridTemplateColumns: gridTemplate }}
                        >
                            <div className="flex items-center justify-center p-2">
                                <input
                                    type="checkbox"
                                    className="accent-primary w-4 h-4 cursor-pointer"
                                    checked={!!field.selected}
                                    onChange={(e) => onToggleField(field.name, e.target.checked)}
                                />
                            </div>

                            {AVAILABLE_COLUMNS.map(col => visibleColumns.has(col.id) && (
                                <React.Fragment key={col.id}>
                                    {renderCell(field, col.id)}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* DF Mapping Row for Formula Fields */}
                        {field.calculated && field.selected && (
                            <div className="col-span-full bg-gray-50 dark:bg-[#252525] p-3 pl-14 border-b border-border dark:border-border-dark animate-in slide-in-from-top-2 duration-200">
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
                                                onChange={(e) => !field.dfMapping?.mappedDfName && onUpdateDf(field.name, { ...field.dfMapping?.manualDf, label: e.target.value })}
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
                                                onChange={(e) => !field.dfMapping?.mappedDfName && onUpdateDf(field.name, { ...field.dfMapping?.manualDf, name: e.target.value })}
                                                placeholder={`DF_${field.name}`}
                                                disabled={!!field.dfMapping?.mappedDfName}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[11px] text-text-secondary dark:text-text-dark-secondary">Type</label>
                                            <select
                                                className={`p-1.5 text-[12px] border border-border dark:border-border-dark rounded bg-white dark:bg-[#1E1E1E] text-text-primary dark:text-text-dark-primary focus:border-primary outline-none ${field.dfMapping?.mappedDfName ? 'opacity-70 bg-gray-100 dark:bg-[#2A2A2A] cursor-not-allowed' : ''}`}
                                                value={field.dfMapping?.manualDf?.type || field.type}
                                                onChange={(e) => !field.dfMapping?.mappedDfName && onUpdateDf(field.name, { ...field.dfMapping?.manualDf, type: e.target.value })}
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
                                            <div className="flex flex-col gap-1 w-1/3">
                                                <label className="text-[11px] text-text-secondary dark:text-text-dark-secondary">Length</label>
                                                <input
                                                    type="number"
                                                    className={`p-1.5 text-[12px] border border-border dark:border-border-dark rounded bg-white dark:bg-[#1E1E1E] text-text-primary dark:text-text-dark-primary focus:border-primary outline-none ${field.dfMapping?.mappedDfName ? 'opacity-70 bg-gray-100 dark:bg-[#2A2A2A] cursor-not-allowed' : ''}`}
                                                    value={field.dfMapping?.manualDf?.length || field.length || 0}
                                                    onChange={(e) => !field.dfMapping?.mappedDfName && onUpdateDf(field.name, { ...field.dfMapping?.manualDf, length: parseInt(e.target.value) })}
                                                    disabled={!!field.dfMapping?.mappedDfName}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 w-1/3">
                                                <label className="text-[11px] text-text-secondary dark:text-text-dark-secondary">Prec</label>
                                                <input
                                                    type="number"
                                                    className={`p-1.5 text-[12px] border border-border dark:border-border-dark rounded bg-white dark:bg-[#1E1E1E] text-text-primary dark:text-text-dark-primary focus:border-primary outline-none ${field.dfMapping?.mappedDfName ? 'opacity-70 bg-gray-100 dark:bg-[#2A2A2A] cursor-not-allowed' : ''}`}
                                                    value={field.dfMapping?.manualDf?.precision || field.precision || 0}
                                                    onChange={(e) => !field.dfMapping?.mappedDfName && onUpdateDf(field.name, { ...field.dfMapping?.manualDf, precision: parseInt(e.target.value) })}
                                                    disabled={!!field.dfMapping?.mappedDfName}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 w-1/3">
                                                <label className="text-[11px] text-text-secondary dark:text-text-dark-secondary">Scale</label>
                                                <input
                                                    type="number"
                                                    className={`p-1.5 text-[12px] border border-border dark:border-border-dark rounded bg-white dark:bg-[#1E1E1E] text-text-primary dark:text-text-dark-primary focus:border-primary outline-none ${field.dfMapping?.mappedDfName ? 'opacity-70 bg-gray-100 dark:bg-[#2A2A2A] cursor-not-allowed' : ''}`}
                                                    value={field.dfMapping?.manualDf?.scale ?? field.scale ?? 0}
                                                    onChange={(e) => !field.dfMapping?.mappedDfName && onUpdateDf(field.name, { ...field.dfMapping?.manualDf, scale: parseInt(e.target.value) })}
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
                {sortedFields.length === 0 && (
                    <div className="flex justify-center p-5 text-text-secondary dark:text-text-dark-secondary">
                        No fields found.
                    </div>
                )}
            </div>
        </div>
    );
};

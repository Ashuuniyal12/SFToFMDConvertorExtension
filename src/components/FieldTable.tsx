import React from 'react';
import { SalesforceField } from '../types';

interface FieldTableProps {
    fields: SalesforceField[];
    onToggleField: (index: number, selected: boolean) => void;
    onToggleAll: (selected: boolean) => void;
}

export const FieldTable: React.FC<FieldTableProps> = ({ fields, onToggleField, onToggleAll }) => {
    const allSelected = fields.length > 0 && fields.every(f => f.selected);

    return (
        <div className="flex flex-col w-full text-[13px] border border-border dark:border-border-dark rounded-md overflow-hidden bg-white dark:bg-surface-dark">
            {/* Header */}
            <div className="grid grid-cols-[40px_1.5fr_1.5fr_1fr_0.8fr] items-center bg-surface dark:bg-[#1E1E1E] border-b border-border dark:border-border-dark font-semibold text-text-secondary dark:text-text-dark-secondary select-none sticky top-0 z-10">
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
            </div>

            {/* Body */}
            <div className="flex flex-col">
                {fields.map((field, index) => (
                    <div
                        key={`${field.name}-${index}`}
                        className="grid grid-cols-[40px_1.5fr_1.5fr_1fr_0.8fr] items-center border-b border-border dark:border-border-dark last:border-b-0 hover:bg-[#A100FF0a] transition-colors duration-100"
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
                    </div>
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

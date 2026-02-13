import React from 'react';
import { SalesforceField } from '../types';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    fields: SalesforceField[];
    objectName: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, fields, objectName }) => {
    if (!isOpen) return null;

    // Filter to show only selected fields (or all passed fields if they are already filtered)
    // Assuming 'fields' passed here are the ones intended for export

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border dark:border-border-dark animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-border dark:border-border-dark">
                    <h2 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">Confirm Export Fields</h2>
                    <p className="text-[13px] text-text-secondary dark:text-text-dark-secondary mt-1">
                        Review the final list of fields for <b>{objectName}</b>. Formula fields have been resolved to their DF counterparts.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    <div className="w-full text-left border-collapse">
                        <div className="grid grid-cols-[1.5fr_1.5fr_1fr_0.8fr] bg-surface dark:bg-[#252525] border-b border-border dark:border-border-dark sticky top-0 font-medium text-[12px] text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider">
                            <div className="p-3">API Name</div>
                            <div className="p-3">Label</div>
                            <div className="p-3">Type</div>
                            <div className="p-3">Source</div>
                        </div>
                        {fields.map((field, idx) => (
                            <div key={idx} className="grid grid-cols-[1.5fr_1.5fr_1fr_0.8fr] border-b border-border dark:border-border-dark last:border-b-0 text-[13px] hover:bg-surface dark:hover:bg-[#2D2D2D]">
                                <div className="p-3 truncate text-text-primary dark:text-text-dark-primary">{field.name}</div>
                                <div className="p-3 truncate text-text-primary dark:text-text-dark-primary">{field.label}</div>
                                <div className="p-3 text-text-primary dark:text-text-dark-primary">{field.type}</div>
                                <div className="p-3">
                                    {field.dfMapping?.manualDf? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                            DF MAPPED
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                            STANDARD
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-5 border-t border-border dark:border-border-dark flex justify-end gap-3 bg-surface dark:bg-[#1E1E1E] rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[13px] font-medium text-text-primary dark:text-text-dark-primary bg-white dark:bg-[#2D2D2D] border border-border dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-[#3D3D3D] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-[13px] font-medium text-white bg-primary hover:bg-primary-hover rounded shadow-sm hover:shadow transition-all active:scale-95"
                    >
                        Export Excel
                    </button>
                </div>
            </div>
        </div>
    );
};

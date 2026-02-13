import React, { useState } from 'react';
import { SalesforceField } from '../types';

interface VirtualFieldModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (field: SalesforceField) => void;
}

export const VirtualFieldModal: React.FC<VirtualFieldModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [apiName, setApiName] = useState('');
    const [label, setLabel] = useState('');
    const [type, setType] = useState('string');
    const [length, setLength] = useState('255');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!apiName || !label || !type) {
            alert("Please fill in all mandatory fields (API Name, Label, Type).");
            return;
        }

        const newField: SalesforceField = {
            name: apiName,
            label: label,
            type: type,
            length: length ? parseInt(length) : 0,
            precision: 0,
            scale: 0,
            nillable: true,
            selected: true,
            isVirtual: true
        };

        onAdd(newField);

        // Reset
        setApiName('');
        setLabel('');
        setType('string');
        setLength('255');
        onClose();
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-black/50 flex items-center justify-center z-[1000] transition-opacity">
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl w-[320px] shadow-lg border border-border dark:border-border-dark">
                <h3 className="mt-0 mb-5 text-lg font-semibold text-primary">Add Virtual Field</h3>

                <div className="mb-4">
                    <label htmlFor="vfApiName" className="block mb-1.5 text-[13px] font-medium text-text-primary dark:text-text-dark-primary">
                        API Name <span className="text-error">*</span>
                    </label>
                    <input
                        type="text"
                        id="vfApiName"
                        className="w-full p-2.5 box-border border border-border dark:border-border-dark rounded-md bg-surface dark:bg-[#2D2D2D] text-text-primary dark:text-text-dark-primary text-[13px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        placeholder="e.g. My_Custom_Field__c"
                        value={apiName}
                        onChange={(e) => setApiName(e.target.value)}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="vfLabel" className="block mb-1.5 text-[13px] font-medium text-text-primary dark:text-text-dark-primary">
                        Label <span className="text-error">*</span>
                    </label>
                    <input
                        type="text"
                        id="vfLabel"
                        className="w-full p-2.5 box-border border border-border dark:border-border-dark rounded-md bg-surface dark:bg-[#2D2D2D] text-text-primary dark:text-text-dark-primary text-[13px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        placeholder="e.g. My Custom Field"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="vfType" className="block mb-1.5 text-[13px] font-medium text-text-primary dark:text-text-dark-primary">
                        Type <span className="text-error">*</span>
                    </label>
                    <select
                        id="vfType"
                        className="w-full p-2.5 box-border border border-border dark:border-border-dark rounded-md bg-surface dark:bg-[#2D2D2D] text-text-primary dark:text-text-dark-primary text-[13px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="string">String</option>
                        <option value="double">Double</option>
                        <option value="currency">Currency</option>
                        <option value="date">Date</option>
                        <option value="datetime">DateTime</option>
                        <option value="boolean">Boolean</option>
                        <option value="id">ID</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="vfLength" className="block mb-1.5 text-[13px] font-medium text-text-primary dark:text-text-dark-primary">
                        Length
                    </label>
                    <input
                        type="number"
                        id="vfLength"
                        className="w-full p-2.5 box-border border border-border dark:border-border-dark rounded-md bg-surface dark:bg-[#2D2D2D] text-text-primary dark:text-text-dark-primary text-[13px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        placeholder="255"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        className="bg-error hover:bg-[#cc0000] text-white px-4 py-2 rounded-md text-[13px] font-medium transition-colors shadow-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="bg-success hover:bg-[#0d9668] text-white px-4 py-2 rounded-md text-[13px] font-medium transition-colors shadow-sm"
                        onClick={handleSave}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { MappingEngine } from '../utils/mappingEngine';

interface MappingRulesProps {
    mappingEngine: MappingEngine;
    isFullScreen: boolean;
}

export const MappingRules: React.FC<MappingRulesProps> = ({ mappingEngine, isFullScreen }) => {
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMappings();
    }, []);

    const loadMappings = async () => {
        setLoading(true);
        await mappingEngine.loadMappings();
        setMappings({ ...mappingEngine.mappings });
        setLoading(false);
    };

    const handleChange = (sfType: string, bqType: string) => {
        const newMappings = { ...mappings, [sfType]: bqType };
        setMappings(newMappings);
    };

    const handleSave = async () => {
        await mappingEngine.saveMappings(mappings);
        alert("Mappings Saved!");
    };

    const handleReset = async () => {
        if (confirm("Reset all mappings to default?")) {
            await mappingEngine.resetMappings();
            setMappings({ ...mappingEngine.mappings });
        }
    };

    if (loading) return <div className="p-6 text-text-secondary dark:text-text-dark-secondary">Loading mappings...</div>;

    const bqTypes = ["STRING", "NUMERIC", "BOOL", "DATE", "TIMESTAMP", "BYTES"];

    return (
        <div className={`bg-surface dark:bg-[#1E1E1E] rounded-lg shadow-[inset_0_0_0_1px_rgba(233,236,239,1)] dark:shadow-[inset_0_0_0_1px_rgba(45,45,45,1)] ${isFullScreen ? 'h-full p-4 overflow-y-auto' : 'p-6 h-[380px] overflow-y-auto m-3'}`}>
            <h3 className="mt-0 mb-5 text-lg font-semibold text-primary">Data Type Mapping</h3>

            <div className="w-full border border-border dark:border-border-dark rounded-md overflow-hidden text-[13px] mb-4">
                {/* Header */}
                <div className="grid grid-cols-2 bg-surface dark:bg-[#1E1E1E] border-b border-border dark:border-border-dark font-medium text-text-secondary dark:text-text-dark-secondary uppercase text-[11px] tracking-wider select-none sticky top-0 z-10">
                    <div className="p-3">Salesforce Type</div>
                    <div className="p-3">BigQuery Type</div>
                </div>

                {/* Body */}
                <div className="bg-white dark:bg-[#121212]">
                    {Object.keys(mappings).map(sfType => (
                        <div key={sfType} className="grid grid-cols-2 items-center border-b border-border dark:border-border-dark last:border-b-0 hover:bg-[color-mix(in_srgb,var(--color-row-hover),transparent_90%)]">
                            <div className="p-2.5 text-text-primary dark:text-text-dark-primary">{sfType}</div>
                            <div className="p-2.5">
                                <select
                                    className="w-full p-2 border border-border dark:border-border-dark rounded bg-surface dark:bg-[#2D2D2D] text-text-primary dark:text-text-dark-primary text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                                    value={mappings[sfType]}
                                    onChange={(e) => handleChange(sfType, e.target.value)}
                                >
                                    {bqTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex gap-3">
                <button
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md text-[13px] font-medium transition-transform active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                    onClick={handleSave}
                >
                    Save Rules
                </button>
                <button
                    className="bg-transparent border border-border dark:border-border-dark text-text-primary dark:text-text-dark-primary hover:bg-border dark:hover:bg-border-dark px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
                    onClick={handleReset}
                >
                    Reset to Default
                </button>
            </div>
        </div>
    );
};

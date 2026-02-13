import React from 'react';

interface SettingsProps {
    currentObject: string | null;
    includeSystemFields: boolean;
    setIncludeSystemFields: (val: boolean) => void;
    poc: string;
    setPoc: (val: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentObject, includeSystemFields, setIncludeSystemFields, poc, setPoc }) => {
    return (
        <div className="p-6 h-[380px] overflow-y-auto bg-surface dark:bg-[#1E1E1E] m-3 rounded-lg shadow-[inset_0_0_0_1px_rgba(233,236,239,1)] dark:shadow-[inset_0_0_0_1px_rgba(45,45,45,1)]">
            <h3 className="mt-0 mb-5 text-lg font-semibold text-primary">Extension Settings</h3>

            <div className="mb-6 p-4 bg-white dark:bg-[#121212] rounded-md border border-border dark:border-border-dark">
                <p className="m-0 text-[13px] text-text-primary dark:text-text-dark-primary flex items-center gap-2">
                    Current Object:
                    <span id="currentObject" className="font-mono bg-border dark:bg-border-dark px-1.5 py-0.5 rounded text-xs font-semibold text-text-secondary dark:text-text-dark-secondary">
                        {currentObject || "Detecting..."}
                    </span>
                </p>
            </div>

            <div className="mb-6">
                <label className="block text-[13px] font-medium text-text-primary dark:text-text-dark-primary mb-2">
                    POC Name
                </label>
                <input
                    type="text"
                    className="w-full p-2.5 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded text-[13px] text-text-primary dark:text-text-dark-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-shadow"
                    placeholder="Enter POC Name"
                    value={poc}
                    onChange={(e) => setPoc(e.target.value)}
                />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer p-2 hover:bg-border/50 dark:hover:bg-border-dark/50 rounded transition-colors text-[13px] font-medium text-text-primary dark:text-text-dark-primary">
                <input
                    type="checkbox"
                    className="accent-primary w-4 h-4 cursor-pointer"
                    checked={includeSystemFields}
                    onChange={(e) => setIncludeSystemFields(e.target.checked)}
                />
                Include System Fields (CreatedBy, LastModifiedBy)
            </label>
        </div>
    );
};

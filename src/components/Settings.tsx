import React from 'react';
import { useSettingsStore } from '../store/settingsStore';

interface SettingsProps {
    currentObject: string | null;
    includeSystemFields: boolean;
    setIncludeSystemFields: (val: boolean) => void;
    poc: string;
    setPoc: (val: string) => void;
    isFullScreen: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ currentObject, includeSystemFields, setIncludeSystemFields, poc, setPoc, isFullScreen }) => {
    const {
        mobileWidth, setMobileWidth,
        mobileHeight, setMobileHeight,
        themeColors, setThemeColor,
        resetSettings
    } = useSettingsStore();

    return (
        <div className={`bg-surface dark:bg-[#1E1E1E] rounded-lg shadow-[inset_0_0_0_1px_rgba(233,236,239,1)] dark:shadow-[inset_0_0_0_1px_rgba(45,45,45,1)] ${isFullScreen ? 'p-8' : 'p-6 h-full overflow-y-auto m-3'}`}>
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

            {/* Mobile View Settings */}
            {!isFullScreen && (
                <div className="mb-6">
                    <h4 className="text-[13px] font-semibold text-text-primary dark:text-text-dark-primary mb-3">Mobile View Dimensions</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] text-text-secondary dark:text-text-dark-secondary mb-1">Width (px)</label>
                            <input
                                type="number"
                                className="w-full p-2 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded text-[13px] text-text-primary dark:text-text-dark-primary"
                                value={mobileWidth}
                                onChange={(e) => setMobileWidth(parseInt(e.target.value))}
                                min={300}
                                max={1000}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] text-text-secondary dark:text-text-dark-secondary mb-1">Height (px)</label>
                            <input
                                type="number"
                                className="w-full p-2 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded text-[13px] text-text-primary dark:text-text-dark-primary"
                                value={mobileHeight}
                                onChange={(e) => setMobileHeight(parseInt(e.target.value))}
                                min={400}
                                max={1000}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Theme Customization */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[13px] font-semibold text-text-primary dark:text-text-dark-primary">Theme Colors</h4>
                    <button
                        onClick={resetSettings}
                        className="text-[11px] text-error hover:underline"
                    >
                        Reset to Defaults
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(themeColors).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded">
                            <span className="text-[11px] text-text-secondary dark:text-text-dark-secondary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-text-secondary dark:text-text-dark-secondary">{value}</span>
                                <input
                                    type="color"
                                    className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                    value={value}
                                    onChange={(e) => setThemeColor(key as any, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                    {/* Row Hover Specific */}
                    <div className="col-span-2 flex items-center justify-between p-2 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded">
                        <span className="text-[11px] text-text-secondary dark:text-text-dark-secondary capitalize">Row Hover / Selection</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-text-secondary dark:text-text-dark-secondary">{themeColors.rowHover}</span>
                            <input
                                type="color"
                                className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                value={themeColors.rowHover}
                                onChange={(e) => setThemeColor('rowHover', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
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

import React from 'react';
import { useSettingsStore } from '../store/settingsStore';

interface SettingsProps {
    currentObject: string | null;
    poc: string;
    setPoc: (val: string) => void;
    isFullScreen: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ currentObject, poc, setPoc, isFullScreen }) => {
    const {
        mobileWidth, setMobileWidth,
        mobileHeight, setMobileHeight,
        themeColors, setThemeColor,
        integrationProfileName, setIntegrationProfileName,
        integrationPermSetName, setIntegrationPermSetName,
        resetSettings
    } = useSettingsStore();

    const version = chrome?.runtime?.getManifest?.()?.version || '1.0.1';

    return (
        <div className={`bg-surface dark:bg-[#1E1E1E] rounded-lg shadow-[inset_0_0_0_1px_rgba(233,236,239,1)] dark:shadow-[inset_0_0_0_1px_rgba(45,45,45,1)] ${isFullScreen ? 'p-8' : 'p-6 h-full overflow-y-auto m-3'} font-sans flex flex-col`}>

            {/* Header Section */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="m-0 text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Settings</h3>
                <span className="text-[11px] font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-text-dark-secondary border border-border dark:border-border-dark">
                    v{version}
                </span>
            </div>

            {/* Context Card */}
            <div className="mb-6 p-4 bg-gradient-to-br from-white to-gray-50 dark:from-[#252525] dark:to-[#1a1a1a] rounded-xl border border-border dark:border-border-dark shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" /></svg>
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary dark:text-text-dark-secondary mb-0.5">Active Object</p>
                        <p className="text-sm font-bold text-text-primary dark:text-text-dark-primary font-mono">
                            {currentObject || "Detecting..."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="space-y-6 flex-grow overflow-y-auto pr-1">
                <section>
                    <h4 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        User Preferences
                    </h4>
                    <div className="p-4 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-[12px] font-medium text-text-secondary dark:text-text-dark-secondary mb-1.5">Default POC Name</label>
                            <input
                                type="text"
                                className="w-full p-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-border dark:border-border-dark rounded-lg text-[13px] text-text-primary dark:text-text-dark-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
                                placeholder="e.g. John Doe"
                                value={poc}
                                onChange={(e) => setPoc(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Integration Access Settings */}
                <section>
                    <h4 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                        Field Access
                    </h4>
                    <div className="p-4 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-[12px] font-medium text-text-secondary dark:text-text-dark-secondary mb-1.5">Profile Name</label>
                            <input
                                type="text"
                                className="w-full p-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-border dark:border-border-dark rounded-lg text-[13px] text-text-primary dark:text-text-dark-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
                                placeholder="e.g. DF API - Only Integration Profile"
                                value={integrationProfileName}
                                onChange={(e) => setIntegrationProfileName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium text-text-secondary dark:text-text-dark-secondary mb-1.5">Permission Set Name</label>
                            <input
                                type="text"
                                className="w-full p-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-border dark:border-border-dark rounded-lg text-[13px] text-text-primary dark:text-text-dark-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
                                placeholder="e.g. DF Datalake"
                                value={integrationPermSetName}
                                onChange={(e) => setIntegrationPermSetName(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Mobile Dimensions (Conditional) */}
                {!isFullScreen && (
                    <section>
                        <h4 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                            Popup Dimensions
                        </h4>
                        <div className="p-4 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded-xl shadow-sm grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-medium text-text-secondary dark:text-text-dark-secondary mb-1.5">Width (px)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full p-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-border dark:border-border-dark rounded-lg text-[13px] text-text-primary dark:text-text-dark-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                        value={mobileWidth}
                                        onChange={(e) => setMobileWidth(parseInt(e.target.value))}
                                        min={300}
                                        max={1000}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">px</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-text-secondary dark:text-text-dark-secondary mb-1.5">Height (px)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full p-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-border dark:border-border-dark rounded-lg text-[13px] text-text-primary dark:text-text-dark-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                        value={mobileHeight}
                                        onChange={(e) => setMobileHeight(parseInt(e.target.value))}
                                        min={400}
                                        max={1000}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">px</span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Theme Customization */}
                <section>
                    <div className="flex justify-between items-end mb-3">
                        <h4 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                            Theme Colors
                        </h4>
                        <button
                            onClick={resetSettings}
                            className="text-[11px] font-medium text-text-secondary hover:text-error transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                            Reset Defaults
                        </button>
                    </div>

                    <div className="p-4 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded-xl shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            {Object.entries(themeColors).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between group">
                                    <span className="text-[12px] font-medium text-text-secondary dark:text-text-dark-secondary capitalize group-hover:text-text-primary dark:group-hover:text-text-dark-primary transition-colors">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{value}</span>
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:ring-2 hover:ring-primary transition-all">
                                            <input
                                                type="color"
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                                                value={value}
                                                onChange={(e) => setThemeColor(key as any, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Developer Footer */}
            <div className="mt-6 pt-6 border-t border-border dark:border-border-dark shrink-0">
                <div className="flex flex-col items-center gap-3">
                    <p className="text-[11px] text-text-secondary dark:text-text-dark-secondary font-medium">
                        Developed by <span className="text-primary font-semibold">Ashutosh Uniyal</span>
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="https://github.com/Ashuuniyal12/SFToFMDConvertorExtension" target="_blank" rel="noopener noreferrer" className="text-text-secondary dark:text-text-dark-secondary hover:text-primary transition-colors" title="GitHub">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                        </a>
                        <a href="https://www.linkedin.com/in/ashutoshuniyal-012/" target="_blank" rel="noopener noreferrer" className="text-text-secondary dark:text-text-dark-secondary hover:text-[#0077b5] transition-colors" title="LinkedIn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                        </a>
                        <a href="https://ashutoshuniyal.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-text-secondary dark:text-text-dark-secondary hover:text-orange-500 transition-colors" title="Portfolio">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

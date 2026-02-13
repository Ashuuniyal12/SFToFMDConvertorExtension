import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { RotateCw } from 'lucide-react';
import { Tabs } from './components/Tabs';
import { FieldTable } from './components/FieldTable';
import { MappingRules } from './components/MappingRules';
import { Settings } from './components/Settings';
import { VirtualFieldModal } from './components/VirtualFieldModal';
import { SalesforceApi } from './utils/salesforceApi';
import { MappingEngine } from './utils/mappingEngine';
import { ExcelGenerator } from './utils/excelGenerator';
import { SalesforceField } from './types';
import './index.css';

function App() {
    // State
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [activeTab, setActiveTab] = useState('fields');
    const [statusMsg, setStatusMsg] = useState('Initializing...');

    const [currentObject, setCurrentObject] = useState<string | null>(null);
    const [fields, setFields] = useState<SalesforceField[]>([]);
    const [filter, setFilter] = useState('');
    const [includeSystemFields, setIncludeSystemFields] = useState(false);
    const [poc, setPoc] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showRefresh, setShowRefresh] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Instantiations
    const mappingEngine = useMemo(() => new MappingEngine(), []);
    const excelGenerator = useMemo(() => new ExcelGenerator(), []);

    // Theme Init
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (storedTheme) {
            setTheme(storedTheme);
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        // Check if we are in full screen mode (via URL param or just window size check if simpler, but URL param is safer for context)
        const params = new URLSearchParams(window.location.search);
        if (params.get('tabId')) {
            setIsFullScreen(true);
        }
    }, []);

    // -------------------------------------------------------------------------
    // Helper Functions
    // -------------------------------------------------------------------------

    const fetchFields = async (api: SalesforceApi, objectName: string) => {
        setStatusMsg("Fetching Metadata...");
        try {
            const metadata = await api.describe(objectName);
            const mappedFields = metadata.fields.map(f => ({
                ...f,
                selected: true
            }));
            setFields(mappedFields);
            setStatusMsg(`Loaded ${mappedFields.length} fields.`);
        } catch (e: any) {
            console.error(e);
            setStatusMsg(`Error: ${e.message}`);
        }
    };

    const handleToggleFieldName = (name: string, selected: boolean) => {
        setFields(prev => prev.map(f => f.name === name ? { ...f, selected } : f));
    };

    const handleToggleAll = (selected: boolean) => {
        setFields(prev => prev.map(f => ({ ...f, selected })));
    };

    // Filter Logic
    const filteredFields = fields.filter(f =>
        f.name.toLowerCase().includes(filter.toLowerCase()) ||
        f.label.toLowerCase().includes(filter.toLowerCase())
    );

    const handleAddVirtualField = (field: SalesforceField) => {
        setFields([field, ...fields]);
    };

    const handleGenerate = async () => {
        const selected = fields.filter(f => f.selected);
        if (selected.length === 0) {
            alert("Please select at least one field.");
            return;
        }

        setStatusMsg("Generating Excel...");
        try {
            const config = {
                table: currentObject ? currentObject.toLowerCase() : "output_table",
                poc: poc
            };
            const buffer = await excelGenerator.generateFMD(currentObject || "Export", selected, mappingEngine, config);
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const filename = `FMD_${currentObject || "Export"}_${dateStr}.xlsx`;
            excelGenerator.downloadExcel(buffer, filename);
            setStatusMsg("Download started.");
        } catch (e) {
            console.error(e);
            setStatusMsg("Error generating Excel.");
        }
    };

    // -------------------------------------------------------------------------
    // Main Initialization Logic
    // -------------------------------------------------------------------------

    const initializeContext = async () => {
        setStatusMsg("Detecting Context...");
        setShowRefresh(false);
        try {
            let targetTab;
            const params = new URLSearchParams(window.location.search);
            const tabIdStr = params.get('tabId');

            if (tabIdStr) {
                try {
                    targetTab = await chrome.tabs.get(parseInt(tabIdStr));
                } catch (e) {
                    console.error("Focused tab not found", e);
                }
            } else {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                targetTab = tab;
            }

            if (!targetTab || !targetTab.id) {
                setStatusMsg("No active tab.");
                return;
            }

            const tabId = targetTab.id;

            // Get EXT Session
            const sessionResp = await chrome.runtime.sendMessage({ action: "GET_SESSION_ID", url: targetTab.url });

            let api: SalesforceApi | null = null;
            if (sessionResp && sessionResp.sid) {
                api = new SalesforceApi(sessionResp.instanceUrl, sessionResp.sid);
                // setSfApi(api);
                setStatusMsg("Session Found.");
            } else {
                setStatusMsg("Not logged in or Session not found.");
            }

            // Get Object Context
            try {
                const contextResp = await chrome.tabs.sendMessage(tabId, { action: "GET_OBJECT_CONTEXT" });

                if (contextResp && contextResp.objectName) {
                    let objName = contextResp.objectName;

                    // Resolve ID to Name if necessary
                    if (api) {
                        setStatusMsg("Resolving Object Name...");
                        try {
                            objName = await api.resolveApiName(objName);
                        } catch (e) {
                            console.warn("Name resolution failed, using original", e);
                        }
                    }

                    setCurrentObject(objName);
                    setStatusMsg(`Object: ${objName}`);
                    if (api) {
                        fetchFields(api, objName);
                    }
                } else {
                    setStatusMsg("Please go to Setup > Object Manager > [Object]");
                }
            } catch (err: any) {
                console.error(err);
                setStatusMsg("Connection Failed: " + (err.message || "Refresh Page"));
                setShowRefresh(true);
            }

        } catch (e: any) {
            console.error(e);
            setStatusMsg("Error initializing: " + e.message);
        }
    };

    // Run Init on Mount
    useEffect(() => {
        initializeContext();
    }, []);

    // -------------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------------

    const handleRefreshPage = async () => {
        // If full screen, we need to use the tabId from URL
        const params = new URLSearchParams(window.location.search);
        const tabIdStr = params.get('tabId');

        let targetTabId;
        if (tabIdStr) {
            targetTabId = parseInt(tabIdStr);
        } else {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            targetTabId = tab?.id;
        }

        if (targetTabId) {
            setStatusMsg("Reloading Salesforce Page...");
            await chrome.tabs.reload(targetTabId);

            if (!isFullScreen) {
                window.close(); // Close popup only if not full screen
            } else {
                // If full screen, wait for reload then re-init
                setStatusMsg("Waiting for page load...");
                setTimeout(() => {
                    initializeContext();
                }, 4000);
            }
        }
    };

    const handleMaximize = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            const url = chrome.runtime.getURL(`index.html?tabId=${tab.id}`);
            chrome.tabs.create({ url });
        }
    };

    return (
        <div className={`flex flex-col bg-white dark:bg-[#121212] overflow-hidden ${isFullScreen ? 'w-full h-screen' : 'w-[600px] h-[550px]'}`}>
            <Header
                theme={theme}
                toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                onMaximize={handleMaximize}
                isFullScreen={isFullScreen}
            />
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'fields' && (
                <div id="fields" className={`bg-surface dark:bg-[#1E1E1E] rounded-lg shadow-[inset_0_0_0_1px_rgba(233,236,239,1)] dark:shadow-[inset_0_0_0_1px_rgba(45,45,45,1)] overflow-hidden flex flex-col ${isFullScreen ? 'flex-1 m-4 border border-border dark:border-border-dark' : 'h-[380px] m-3 p-6 overflow-y-auto'}`}>
                    <div className={isFullScreen ? 'p-4 border-b border-border dark:border-border-dark' : 'mb-4'}>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Filter fields..."
                                className="flex-1 p-2.5 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded text-[13px] text-text-primary dark:text-text-dark-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-shadow"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                            <button
                                className="bg-transparent border border-success dark:border-success text-success bg-success/10 hover:bg-success hover:text-white px-4 py-2 rounded text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                                onClick={() => setIsModalOpen(true)}
                            >
                                + Add Virtual Field
                            </button>
                        </div>
                    </div>
                    <div className={isFullScreen ? 'flex-1 overflow-y-auto p-4' : ''}>
                        <FieldTable
                            fields={filteredFields}
                            onToggleField={(idx, sel) => handleToggleFieldName(filteredFields[idx].name, sel)}
                            onToggleAll={handleToggleAll}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'mapping' && (
                <div className={`flex-1 ${isFullScreen ? 'm-4 overflow-hidden' : 'm-3 h-[380px] overflow-hidden'}`}>
                    <MappingRules mappingEngine={mappingEngine} isFullScreen={isFullScreen} />
                </div>
            )}

            {activeTab === 'settings' && (
                <div className={`h-full ${isFullScreen ? 'flex-1 overflow-y-auto flex justify-center pt-10 bg-surface dark:bg-[#1E1E1E]' : ''}`}>
                    <div className={isFullScreen ? 'w-full max-w-5xl' : 'w-full'}>
                        <Settings
                            currentObject={currentObject}
                            includeSystemFields={includeSystemFields}
                            setIncludeSystemFields={setIncludeSystemFields}
                            poc={poc}
                            setPoc={setPoc}
                            isFullScreen={isFullScreen}
                        />
                    </div>
                </div>
            )}

            <footer className="px-6 py-4 bg-white dark:bg-[#121212] border-t border-border dark:border-border-dark flex justify-between items-center mt-auto flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span id="statusMsg" className="text-xs text-text-secondary dark:text-text-dark-secondary font-medium flex items-center gap-1.5 before:content-['●'] before:text-success before:text-[8px]">
                        {statusMsg}
                    </span>
                    {showRefresh && (
                        <button
                            onClick={handleRefreshPage}
                            className="p-1 rounded-full bg-green-100 hover:bg-green-200 text-green-600 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 transition-colors"
                            title="Refresh Page"
                        >
                            <RotateCw size={14} />
                        </button>
                    )}
                </div>
                <button
                    onClick={handleGenerate}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded text-[13px] font-medium transition-transform active:scale-95 shadow-sm hover:shadow-md"
                >
                    Generate FMD
                </button>
            </footer>

            <VirtualFieldModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddVirtualField}
            />
        </div>
    );
}

export default App;

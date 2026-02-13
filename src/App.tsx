import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
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

    // Instantiations
    const mappingEngine = useMemo(() => new MappingEngine(), []);
    const excelGenerator = useMemo(() => new ExcelGenerator(), []);
    // Removed unused sfApi state if not needed for rendering, or kept if useful for future
    // const [sfApi, setSfApi] = useState<SalesforceApi | null>(null);

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

    // Main Init
    useEffect(() => {
        const init = async () => {
            setStatusMsg("Detecting Context...");
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab || !tab.id) {
                    setStatusMsg("No active tab.");
                    return;
                }

                // Get EXT Session
                const sessionResp = await chrome.runtime.sendMessage({ action: "GET_SESSION_ID", url: tab.url });

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
                    // Start of context fetching
                } catch (e) {
                    // Clean up previous manual injection
                    console.log("Context fetch logic placeholder");
                }

                // Get Object Context
                try {
                    const contextResp = await chrome.tabs.sendMessage(tab.id, { action: "GET_OBJECT_CONTEXT" });

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
                } catch (err) {
                    console.error(err);
                    setStatusMsg("Please Refresh the Salesforce Page.");
                }

            } catch (e: any) {
                console.error(e);
                setStatusMsg("Error initializing: " + e.message);
            }
        };
        init();
    }, []);

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

    return (
        <div className="flex flex-col w-[600px] h-[550px] bg-white dark:bg-[#121212] overflow-hidden">
            <Header theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'fields' && (
                <div id="fields" className="p-6 h-[380px] overflow-y-auto bg-surface dark:bg-[#1E1E1E] m-3 rounded-lg shadow-[inset_0_0_0_1px_rgba(233,236,239,1)] dark:shadow-[inset_0_0_0_1px_rgba(45,45,45,1)]">
                    <div className="flex gap-3 mb-4">
                        <input
                            type="text"
                            placeholder="Filter fields..."
                            className="flex-1 p-2.5 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded text-[13px] text-text-primary dark:text-text-dark-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-shadow"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                        <button
                            className="bg-transparent border border-border dark:border-border-dark text-success bg-success/10 hover:bg-success hover:text-white px-4 py-2 rounded text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                            onClick={() => setIsModalOpen(true)}
                        >
                            + Add Virtual Field
                        </button>
                    </div>
                    <FieldTable
                        fields={filteredFields}
                        onToggleField={(idx, sel) => handleToggleFieldName(filteredFields[idx].name, sel)}
                        onToggleAll={handleToggleAll}
                    />
                </div>
            )}

            {activeTab === 'mapping' && (
                <MappingRules mappingEngine={mappingEngine} />
            )}

            {activeTab === 'settings' && (
                <Settings
                    currentObject={currentObject}
                    includeSystemFields={includeSystemFields}
                    setIncludeSystemFields={setIncludeSystemFields}
                    poc={poc}
                    setPoc={setPoc}
                />
            )}

            <footer className="px-6 py-4 bg-white dark:bg-[#121212] border-t border-border dark:border-border-dark flex justify-between items-center mt-auto">
                <span id="statusMsg" className="text-xs text-text-secondary dark:text-text-dark-secondary font-medium flex items-center gap-1.5 before:content-['●'] before:text-success before:text-[8px]">
                    {statusMsg}
                </span>
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

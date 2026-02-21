import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { RotateCw, Loader2 } from 'lucide-react';
import { Tabs } from './components/Tabs';
import { FieldTable } from './components/FieldTable';
import { MappingRules } from './components/MappingRules';
import { Settings } from './components/Settings';
import { VirtualFieldModal } from './components/VirtualFieldModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { IntegrationAccess } from './components/IntegrationAccess';
import { ObjectSelector } from './components/ObjectSelector';
import { ErrorModal } from './components/ErrorModal';
import { SalesforceApi } from './utils/salesforceApi';
import { MappingEngine } from './utils/mappingEngine';
import { ExcelGenerator } from './utils/excelGenerator';
import { SalesforceField, SObjectDescribe } from './types';
import './index.css';
import { useSettingsStore } from './store/settingsStore';

// Lazy load RelationshipGraph to avoid header bloat and ensure fast initial load
const RelationshipGraph = lazy(() => import('./modules/relationship-graph/components/RelationshipGraph').then(module => ({ default: module.RelationshipGraph })));

function App() {
    // State
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [activeTab, setActiveTab] = useState('fields');
    const [statusMsg, setStatusMsg] = useState('Initializing...');

    const [currentObject, setCurrentObject] = useState<string | null>(null);
    const [fields, setFields] = useState<SalesforceField[]>([]);
    const [filter, setFilter] = useState('');
    const [poc, setPoc] = useState('');
    const [sfApi, setSfApi] = useState<SalesforceApi | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [showRefresh, setShowRefresh] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Integration Access state
    const [profilePerms, setProfilePerms] = useState<Record<string, { readable: boolean, editable: boolean }>>({});
    const [permSetPerms, setPermSetPerms] = useState<Record<string, { readable: boolean, editable: boolean }>>({});
    const [accessLoading, setAccessLoading] = useState(false);

    // Object Selector state
    const [allObjects, setAllObjects] = useState<SObjectDescribe[]>([]);
    const [objectsLoading, setObjectsLoading] = useState(false);

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
        // Check if we are in full screen mode
        const params = new URLSearchParams(window.location.search);
        if (params.get('tabId')) {
            setIsFullScreen(true);
        }
    }, []);

    // Apply Theme Colors & Dimensions from Store
    const { mobileWidth, mobileHeight, themeColors, integrationProfileName, integrationPermSetName } = useSettingsStore();

    useEffect(() => {
        const root = document.documentElement;

        // Apply Colors
        root.style.setProperty('--color-primary', themeColors.primary);
        // Calculate hover color if not explicitly set (or just use the store value)
        root.style.setProperty('--color-primary-hover', themeColors.primaryHover);

        root.style.setProperty('--color-surface', themeColors.surface);
        root.style.setProperty('--color-surface-dark', themeColors.surfaceDark);

        root.style.setProperty('--color-border', themeColors.border);
        root.style.setProperty('--color-border-dark', themeColors.borderDark);

        root.style.setProperty('--color-text-primary', themeColors.textPrimary);
        root.style.setProperty('--color-text-secondary', themeColors.textSecondary);

        root.style.setProperty('--color-text-dark-primary', themeColors.textDarkPrimary);
        root.style.setProperty('--color-text-dark-secondary', themeColors.textDarkSecondary);

        root.style.setProperty('--color-success', themeColors.success);
        root.style.setProperty('--color-error', themeColors.error);

    }, [themeColors]);

    // -------------------------------------------------------------------------
    // Helper Functions
    // -------------------------------------------------------------------------

    const fetchFields = async (api: SalesforceApi, objectName: string) => {
        setStatusMsg("Fetching Metadata...");
        setAccessLoading(true);
        try {
            const [metadata, dfMappings, profilePermsResult, permSetPermsResult] = await Promise.all([
                api.describe(objectName),
                api.getDFMappings(objectName),
                api.getProfileFieldPermissions(objectName, integrationProfileName),
                api.getPermSetFieldPermissions(objectName, integrationPermSetName)
            ]);

            setProfilePerms(profilePermsResult);
            setPermSetPerms(permSetPermsResult);

            // First pass: Create initial map with explicit type
            let tempFields: SalesforceField[] = metadata.fields.map(f => ({
                ...f,
                selected: true,
                dfMapping: {
                    mappedDfName: f.calculated ? dfMappings[f.name] : undefined,
                    manualDf: undefined
                }
            }));

            // console.log('tempFields',tempFields);

            // Second pass: Link DFs and Hide them
            const fieldsByName = new Map(tempFields.map(f => [f.name, f]));

            // console.log('fieldsByName',fieldsByName);

            tempFields = tempFields.map(f => {
                if (f.calculated && f.calculatedFormula != undefined && f.calculatedFormula != '' && f.dfMapping?.mappedDfName) {
                    const dfField = fieldsByName.get(f.dfMapping.mappedDfName);

                    // if df present in current object itself 
                    if (dfField) {
                        // Mark DF field as hidden
                        dfField.hidden = true;
                        // Populate details into manualDf for display
                        return {
                            ...f,
                            dfMapping: {
                                ...f.dfMapping,
                                manualDf: {
                                    label: dfField.label,
                                    name: dfField.name,
                                    type: dfField.type,
                                    length: dfField.length,
                                    precision: dfField.precision,
                                    scale: dfField.scale
                                }
                            }
                        };
                    }
                    //else df are not present in current object itself but in proxy object 
                    else {
                        return {
                            ...f,
                            dfMapping: {
                                ...f.dfMapping,
                                manualDf: {
                                    label: `DF ${f.label}`,
                                    name: f.dfMapping.mappedDfName,
                                    type: f.type,
                                    length: f.length,
                                    precision: f.precision,
                                    scale: f.scale
                                }
                            }
                        };
                    }
                } else if (f.calculated && f.calculatedFormula != undefined && f.calculatedFormula != '' && !f.dfMapping?.mappedDfName) {
                    return {
                        ...f,
                        dfMapping: {
                            ...f.dfMapping,
                            manualDf: {
                                label: `DF ${f.label}`,
                                name: `DF_${f.name.replace(/__c$/, '')}__c`,
                                type: f.type,
                                length: f.length,
                                precision: f.precision,
                                scale: f.scale
                            }
                        }
                    };
                }
                return f;
            });

            setFields(tempFields);
            setStatusMsg(`Loaded ${tempFields.filter(f => !f.hidden).length} visible fields.`);
            setAccessLoading(false);
        } catch (e: any) {
            console.error(e);
            setStatusMsg(`Error: ${e.message}`);
            setAccessLoading(false);
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
        !f.hidden &&
        (f.name.toLowerCase().includes(filter.toLowerCase()) ||
            f.label.toLowerCase().includes(filter.toLowerCase()))
    );

    const handleAddVirtualField = (field: SalesforceField) => {
        setFields([field, ...fields]);
    };

    const handleUpdateDf = (fieldName: string, dfData: any) => {
        // const fieldName = filteredFields[index].name; // Removed lookup
        setFields(prev => prev.map(f => {
            if (f.name === fieldName) {
                return {
                    ...f,
                    dfMapping: {
                        ...f.dfMapping,
                        manualDf: dfData
                    }
                };
            }
            return f;
        }));
    };

    const handleGenerateClick = () => {
        const selected = fields.filter(f => f.selected && !f.hidden);
        if (selected.length === 0) {
            alert("Please select at least one field.");
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const setFieldForFinalExport = (fields: SalesforceField[]) => {
        const selected = fields.filter(f => f.selected && !f.hidden);
        const normalFieldsAndOnlyDFdetailsforFormulaFields = selected.map(f => {
            if (f.calculated && f.calculatedFormula != undefined && f.calculatedFormula != '' && f.dfMapping?.manualDf != undefined) {
                return {
                    ...f,
                    label: f.dfMapping?.manualDf?.label || f.label,
                    name: f.dfMapping?.manualDf?.name || f.name,
                    type: f.dfMapping?.manualDf?.type || f.type,
                    length: f.dfMapping?.manualDf?.length || f.length,
                    precision: f.dfMapping?.manualDf?.precision || f.precision,
                    scale: f.dfMapping?.manualDf?.scale || f.scale,
                };
            }
            return f;
        });
        return normalFieldsAndOnlyDFdetailsforFormulaFields;
    }

    const executeGenerate = async () => {
        setIsConfirmModalOpen(false);
        const fieldsWithDFDetailsandNormalFields = setFieldForFinalExport(fields);
        // Prepare fields with DF logic
        const finalFields = fieldsWithDFDetailsandNormalFields.map(f => {
            if (f.calculated && f.calculatedFormula != undefined && f.calculatedFormula != '') {
                if (f.dfMapping?.mappedDfName) {
                    // Try to find the DF field in the full list
                    const dfField = fields.find(field => field.name === f.dfMapping?.mappedDfName);
                    if (dfField) {
                        return { ...dfField };
                    }
                } else if (f.dfMapping?.manualDf) {
                    // Use Manual DF
                    return {
                        name: f.dfMapping.manualDf.name,
                        label: f.dfMapping.manualDf.label,
                        type: f.dfMapping.manualDf.type,
                        length: f.dfMapping.manualDf.length,
                        precision: f.dfMapping.manualDf.precision,
                        scale: f.dfMapping.manualDf.scale,
                        selected: true,
                        isVirtual: true // Treat as virtual/custom for generation
                    } as SalesforceField;
                }
            }
            return f;
        });

        // console.log("the final fields are ->", finalFields);


        setStatusMsg("Generating Excel...");
        try {
            const config = {
                table: currentObject ? currentObject.toLowerCase() : "output_table",
                poc: poc
            };
            const buffer = await excelGenerator.generateFMD(currentObject || "Export", finalFields, mappingEngine, config);
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

            if (!targetTab || !targetTab.id || !targetTab.url) {
                setStatusMsg("No active tab.");
                return;
            }

            const urlStr = targetTab.url;
            const isSalesforcePage = urlStr.includes('salesforce.com') ||
                urlStr.includes('force.com') ||
                urlStr.includes('salesforce-setup.com');

            if (!isSalesforcePage) {
                const msg = "Not a Salesforce Domain.";
                setStatusMsg(msg);
                setErrorMsg("This extension can only be used on Salesforce pages. Please navigate to your Salesforce Org and try again.");
                return;
            }

            const tabId = targetTab.id;

            // Get EXT Session
            const sessionResp = await chrome.runtime.sendMessage({ action: "GET_SESSION_ID", url: urlStr });

            let api: SalesforceApi | null = null;
            if (sessionResp && sessionResp.sid) {
                api = new SalesforceApi(sessionResp.instanceUrl, sessionResp.sid);
                setSfApi(api);
                setStatusMsg("Session Found.");
            } else {
                const msg = "Not logged in or Session not found.";
                setStatusMsg(msg);
                setErrorMsg(msg + " Please ensure you are logged into Salesforce and try again.");
                return; // Stop initialization to let user see error
            }

            // Get Object Context
            try {
                // Fetch all objects first
                if (api) {
                    setObjectsLoading(true);
                    try {
                        const globalDescribe = await api.describeGlobal();
                        if (globalDescribe && globalDescribe.sobjects) {
                            const sortedObjects = globalDescribe.sobjects
                                .map((obj: any) => ({
                                    name: obj.name,
                                    label: obj.label,
                                    custom: obj.custom
                                }))
                                .sort((a: SObjectDescribe, b: SObjectDescribe) => a.label.localeCompare(b.label));
                            setAllObjects(sortedObjects);
                        }
                    } catch (e) {
                        console.warn("Failed to fetch global objects", e);
                    } finally {
                        setObjectsLoading(false);
                    }
                }

                let contextResp: any = null;
                try {
                    contextResp = await chrome.tabs.sendMessage(tabId, { action: "GET_OBJECT_CONTEXT" });
                } catch (e) {
                    // This is expected if opened on a non-Salesforce page where the content script isn't injected.
                    console.log("No content script context attached to this tab.", e);
                }

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
                    setStatusMsg("Ready. Please select an Object.");
                }
            } catch (err: any) {
                console.error(err);
                const msg = "Connection Failed: " + (err.message || "Refresh Page");
                setStatusMsg(msg);
                setShowRefresh(true);
                setErrorMsg(msg);
            }

        } catch (e: any) {
            console.error(e);
            const msg = "Error initializing: " + e.message;
            setStatusMsg(msg);
            setErrorMsg(msg);
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

    const handleObjectChange = (newObj: string) => {
        if (!newObj) return;

        setCurrentObject(newObj);
        if (sfApi) {
            fetchFields(sfApi, newObj);
        }
    };

    return (
        <div
            className={`flex flex-col bg-white dark:bg-[#121212] overflow-hidden ${isFullScreen ? 'w-full h-screen' : 'shadow-xl rounded-lg'}`}
            style={!isFullScreen ? { width: `${mobileWidth}px`, height: `${mobileHeight}px` } : {}}
        >
            <Header
                theme={theme}
                toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                onMaximize={handleMaximize}
                isFullScreen={isFullScreen}
            />
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'fields' && (
                <div id="fields" className={`bg-surface dark:bg-[#1E1E1E] rounded-lg shadow-[inset_0_0_0_1px_rgba(233,236,239,1)] dark:shadow-[inset_0_0_0_1px_rgba(45,45,45,1)] overflow-hidden flex flex-col ${isFullScreen ? 'flex-1 m-4 border border-border dark:border-border-dark' : 'h-[380px] m-3 p-6 overflow-y-auto'}`}>
                    <div className='p-4 border-b border-border dark:border-border-dark mb-4'>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Filter fields..."
                                className="flex-1 p-2.5 bg-white dark:bg-[#121212] border border-border dark:border-border-dark rounded text-[13px] text-text-primary dark:text-text-dark-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-shadow"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />

                            <ObjectSelector
                                objects={allObjects}
                                currentObject={currentObject}
                                loading={objectsLoading}
                                onSelect={handleObjectChange}
                            />

                            <button
                                className="bg-transparent border border-success dark:border-success text-success bg-success/10 hover:bg-success hover:text-white px-4 py-2 rounded text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                                onClick={() => setIsModalOpen(true)}
                            >
                                + Add Virtual Field
                            </button>
                        </div>
                    </div>
                    <div className={isFullScreen ? 'flex-1 overflow-y-auto px-4' : ''}>
                        <FieldTable
                            fields={filteredFields}
                            onToggleField={(name, sel) => handleToggleFieldName(name, sel)}
                            onToggleAll={handleToggleAll}
                            onUpdateDf={handleUpdateDf}
                        />
                    </div>
                </div>
            )}

            {/* Relationships Tab */}
            {activeTab === 'relationships' && (
                <div className={`flex-1 ${isFullScreen ? 'm-4 border border-border dark:border-border-dark rounded-lg overflow-hidden' : 'h-[380px] m-3 rounded-lg overflow-hidden'}`}>
                    <Suspense fallback={
                        <div className="flex h-full items-center justify-center text-text-secondary gap-2">
                            <Loader2 className="animate-spin" size={20} /> Loading Graph Module...
                        </div>
                    }>
                        <RelationshipGraph api={sfApi} currentObject={currentObject} />
                    </Suspense>
                </div>
            )}

            {/* Integration Access Tab */}
            {activeTab === 'access' && (
                <div className={`flex-1 min-h-0 flex flex-col ${isFullScreen ? 'm-0 overflow-hidden' : ''}`}>
                    <IntegrationAccess
                        fields={fields}
                        objectName={currentObject || 'Unknown'}
                        profilePerms={profilePerms}
                        permSetPerms={permSetPerms}
                        profileName={integrationProfileName}
                        permSetName={integrationPermSetName}
                        isFullScreen={isFullScreen}
                        loading={accessLoading}
                    />
                </div>
            )}

            {/* ... Mapping and Settings Tabs ... */}
            {activeTab === 'mapping' && (
                <div className={`flex-1 ${isFullScreen ? 'm-4 overflow-hidden' : 'm-3 h-[380px] overflow-hidden'}`}>
                    <MappingRules mappingEngine={mappingEngine} isFullScreen={isFullScreen} />
                </div>
            )}

            {/* ... */}
            {activeTab === 'settings' && (
                <div className={`h-full ${isFullScreen ? 'flex-1 overflow-y-auto flex justify-center pt-10 bg-surface dark:bg-[#1E1E1E]' : ''}`}>
                    <div className={isFullScreen ? 'w-full max-w-5xl' : 'w-full'}>
                        <Settings
                            currentObject={currentObject}
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
                {activeTab === 'fields' && (
                    <button
                        onClick={handleGenerateClick}
                        className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded text-[13px] font-medium transition-transform active:scale-95 shadow-sm hover:shadow-md"
                    >
                        Generate FMD
                    </button>
                )}
            </footer>

            <VirtualFieldModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddVirtualField}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={executeGenerate}
                fields={setFieldForFinalExport(fields)}
                objectName={currentObject || 'Unknown'}
            />

            <ErrorModal
                isOpen={!!errorMsg}
                onClose={() => setErrorMsg(null)}
                errorMessage={errorMsg || ''}
                onRefresh={showRefresh ? handleRefreshPage : undefined}
            />
        </div>
    );
}

export default App;

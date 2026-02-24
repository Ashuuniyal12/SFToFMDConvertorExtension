import React, { useState } from 'react';
import { useExcelForgeStore } from '../store/useExcelForgeStore';
import { extractAllFlattenedKeys } from '../services/jsonFlattener';
import { Database, Play, Loader2, AlertTriangle, FileJson } from 'lucide-react';
import { SalesforceApi } from '../../../utils/salesforceApi';

interface DataSourcePanelProps {
    sfApi: SalesforceApi | null;
}

export const DataSourcePanel: React.FC<DataSourcePanelProps> = ({ sfApi }) => {
    const { setJsonData, setError, error, jsonData } = useExcelForgeStore();
    const [soql, setSoql] = useState<string>('');
    const [fetching, setFetching] = useState(false);

    const handleRunQuery = async () => {
        if (!sfApi) {
            setError('Salesforce API not initialized. Please ensure session is active.');
            return;
        }

        if (!soql.trim()) {
            setError('Please enter a valid SOQL query.');
            return;
        }

        setFetching(true);
        setError(null);
        setJsonData([], []); // Clear previous

        try {
            const response = await sfApi.query(soql);

            if (!response.records || response.records.length === 0) {
                setJsonData([], []);
                setError('Query returned 0 records.');
                return;
            }

            const keys = extractAllFlattenedKeys(response.records);
            setJsonData(response.records, keys);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch data from Salesforce.');
        } finally {
            setFetching(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-3 p-4 border rounded-xl border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Database className="text-primary w-5 h-5" />
                    <h3 className="font-semibold text-text-primary dark:text-text-dark-primary">Data Source (SOQL)</h3>
                </div>
                {jsonData.length > 0 && (
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                        {jsonData.length} Records Loaded
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
                <textarea
                    value={soql}
                    onChange={(e) => setSoql(e.target.value)}
                    placeholder="SELECT Id, Name, Account.Name FROM Contact LIMIT 100"
                    className="w-full shrink-0 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-lg p-3 text-sm text-text-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary h-[80px] resize-none"
                />

                <div className="flex justify-start shrink-0">
                    <button
                        onClick={handleRunQuery}
                        disabled={fetching}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {fetching ? 'Fetching Data...' : 'Run Query'}
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-500/10 rounded-md shrink-0">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span className="break-words">{error}</span>
                    </div>
                )}

                {/* Preview Panel */}
                {jsonData.length > 0 && (
                    <div className="mt-1 border border-border dark:border-border-dark rounded-lg flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-background dark:bg-background-dark border-b border-border dark:border-border-dark shrink-0">
                            <FileJson className="w-4 h-4 text-text-secondary dark:text-text-dark-secondary" />
                            <span className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider">
                                Raw JSON Preview (First 3 Records)
                            </span>
                        </div>
                        <div className="p-3 bg-white dark:bg-surface-dark flex-1 overflow-y-auto min-h-0">
                            <pre className="text-xs text-text-primary dark:text-text-dark-primary whitespace-pre-wrap">
                                {JSON.stringify(jsonData.slice(0, 3), null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

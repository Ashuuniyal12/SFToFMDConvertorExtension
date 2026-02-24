import React, { useState } from 'react';
import { ExcelUploader } from './components/ExcelUploader';
import { SheetViewer } from './components/SheetViewer';
import { DataSourcePanel } from './components/DataSourcePanel';
import { MappingPanel } from './components/MappingPanel';
import { GeneratePanel } from './components/GeneratePanel';
import { SalesforceApi } from '../../utils/salesforceApi';

interface ExcelForgeProps {
    sfApi: SalesforceApi | null;
}

const ExcelForge: React.FC<ExcelForgeProps> = ({ sfApi }) => {
    const [activeSheet, setActiveSheet] = useState<string | null>(null);

    return (
        <div className="flex flex-col h-full bg-background dark:bg-background-dark p-4 gap-4 overflow-hidden w-full max-w-[1600px] mx-auto">

            {/* Header section (Upload & Info) */}
            <div className="flex flex-col gap-1 shrink-0">
                <h1 className="text-xl font-bold text-text-primary dark:text-text-dark-primary flex items-center gap-2">
                    ExcelForge Engine
                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary uppercase font-bold tracking-wider">
                        Beta
                    </span>
                </h1>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary max-w-2xl">
                    Map multi-sheet Excel templates with live Salesforce data. Upload your template, fetch records via SOQL, map the columns, and export perfectly formatted reports.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 flex-1 min-h-0 overflow-hidden">

                {/* Left Column */}
                <div className="flex flex-col gap-4 overflow-hidden">
                    <div className="shrink-0">
                        <ExcelUploader />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <SheetViewer
                            activeSheet={activeSheet}
                            onSheetSelect={setActiveSheet}
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
                    {/* Top: Mapping Panel taking most of the space */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <MappingPanel activeSheet={activeSheet} />
                    </div>

                    {/* Bottom: Data Source & Generate side by side to save vertical space */}
                    <div className="h-[260px] shrink-0 flex gap-4">
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <DataSourcePanel sfApi={sfApi} />
                        </div>
                        <div className="w-[300px] shrink-0 flex flex-col min-h-0">
                            <GeneratePanel />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ExcelForge;

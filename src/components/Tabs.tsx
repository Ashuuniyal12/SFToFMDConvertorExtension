import React from 'react';

interface TabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'fields', label: 'Fields' },
        { id: 'mapping', label: 'Mapping Rules' },
        { id: 'settings', label: 'Settings' }
    ];

    return (
        <div className="flex px-6 gap-6 border-b border-border dark:border-border-dark bg-white dark:bg-surface-dark">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`
            px-1 py-3 bg-transparent border-none text-sm font-medium cursor-pointer relative transition-colors duration-200
            ${activeTab === tab.id
                            ? 'text-primary font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-primary after:rounded-t'
                            : 'text-text-secondary dark:text-text-dark-secondary hover:text-primary dark:hover:text-primary'}
          `}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

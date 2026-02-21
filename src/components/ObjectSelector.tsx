import React, { useState, useRef, useEffect } from 'react';
import { SObjectDescribe } from '../types';
import { ChevronDown, Search, Box, Loader2 } from 'lucide-react';

interface ObjectSelectorProps {
    objects: SObjectDescribe[];
    currentObject: string | null;
    loading: boolean;
    onSelect: (objectName: string) => void;
}

export const ObjectSelector: React.FC<ObjectSelectorProps> = ({ objects, currentObject, loading, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedObject = objects.find(obj => obj.name === currentObject);

    // Filter objects based on search query
    const filteredObjects = objects.filter(obj =>
        obj.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (name: string) => {
        onSelect(name);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="relative w-[30%] min-w-[250px]" ref={dropdownRef}>
            <div
                className={`
                    flex items-center justify-between p-2.5 bg-white dark:bg-[#121212] 
                    border border-border dark:border-border-dark rounded cursor-pointer 
                    text-[13px] text-text-primary dark:text-text-dark-primary 
                    hover:border-primary/50 transition-colors
                    ${(loading || objects.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}
                    ${isOpen ? 'border-primary ring-2 ring-primary/10' : ''}
                `}
                onClick={() => {
                    if (!loading && objects.length > 0) {
                        setIsOpen(!isOpen);
                    }
                }}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Box size={16} className="text-primary shrink-0" />
                    {loading ? (
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Loading Objects...</span>
                        </div>
                    ) : selectedObject ? (
                        <div className="flex flex-col truncate">
                            <span className="font-semibold truncate leading-tight">{selectedObject.label}</span>
                            <span className="text-[10px] text-text-secondary dark:text-text-dark-secondary truncate font-mono">
                                {selectedObject.name}
                            </span>
                        </div>
                    ) : (
                        <span className="text-text-secondary">Select an Object...</span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1E1E1E] border border-border dark:border-border-dark rounded-md shadow-lg overflow-hidden flex flex-col max-h-[350px]">
                    <div className="p-2 border-b border-border dark:border-border-dark shrink-0">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input
                                type="text"
                                className="w-full pl-8 pr-2 py-1.5 bg-gray-50 dark:bg-[#121212] border border-border dark:border-border-dark rounded text-[12px] text-text-primary dark:text-text-dark-primary focus:outline-none focus:border-primary transition-colors"
                                placeholder="Search by label or API name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden flex-1 p-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {filteredObjects.length > 0 ? (
                            filteredObjects.map(obj => (
                                <div
                                    key={obj.name}
                                    className={`
                                        flex flex-col p-2 mx-1 my-0.5 rounded cursor-pointer transition-colors
                                        ${currentObject === obj.name
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-gray-100 dark:hover:bg-[#2A2A2A] text-text-primary dark:text-text-dark-primary'
                                        }
                                    `}
                                    onClick={() => handleSelect(obj.name)}
                                >
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="font-medium text-[13px] truncate">{obj.label}</span>
                                        {obj.custom && (
                                            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                                CUSTOM
                                            </span>
                                        )}
                                        {!obj.custom && (
                                            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                STANDARD
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-[11px] font-mono truncate mt-0.5 ${currentObject === obj.name ? 'text-primary' : 'text-text-secondary dark:text-text-dark-secondary'}`}>
                                        {obj.name}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-[12px] text-text-secondary">
                                No objects found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

import React from 'react';
import { Moon, Sun, Maximize } from 'lucide-react';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onMaximize: () => void;
    isFullScreen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onMaximize, isFullScreen }) => {
    return (
        <header className="flex justify-between items-center px-6 py-4 bg-white dark:bg-surface-dark border-b border-border dark:border-border-dark flex-shrink-0 box-border h-[60px]">
            <div className="flex items-center gap-3">
                <img src="assets/icon48.png" alt="Logo" className="w-8 h-8" />
                <div className="flex flex-col justify-center">
                    <h1 className="text-[16px] font-bold m-0 text-primary dark:text-[var(--color-primary)] tracking-tight leading-none">SchemaForge Studio</h1>
                    <span className="text-[10px] font-medium text-text-secondary dark:text-text-dark-secondary tracking-wide">Salesforce Metadata Automation</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {!isFullScreen && (
                    <div
                        className="cursor-pointer p-2 rounded-full transition-all duration-200 bg-surface dark:bg-[#2D2D2D] hover:bg-border dark:hover:bg-[#3D3D3D] w-8 h-8 flex items-center justify-center text-text-primary dark:text-text-dark-primary"
                        onClick={onMaximize}
                        title="Full Screen"
                    >
                        <Maximize size={18} />
                    </div>
                )}
                <div
                    className="cursor-pointer p-2 rounded-full transition-all duration-200 bg-surface dark:bg-[#2D2D2D] hover:bg-border dark:hover:bg-[#3D3D3D] w-8 h-8 flex items-center justify-center text-text-primary dark:text-text-dark-primary"
                    onClick={toggleTheme}
                    title="Toggle Dark Mode"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </div>
            </div>
        </header>
    );
};

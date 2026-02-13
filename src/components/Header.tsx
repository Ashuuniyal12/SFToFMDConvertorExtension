import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
    return (
        <header className="flex justify-between items-center px-6 py-4 bg-white dark:bg-surface-dark border-b border-border dark:border-border-dark flex-shrink-0 box-border h-[60px]">
            <div className="flex items-center">
                <h1 className="text-lg font-bold m-0 text-primary uppercase tracking-tight">SF FMD Generator</h1>
            </div>
            <div
                className="cursor-pointer p-2 rounded-full transition-all duration-200 bg-surface dark:bg-[#2D2D2D] hover:bg-border dark:hover:bg-[#3D3D3D] w-8 h-8 flex items-center justify-center text-text-primary dark:text-text-dark-primary"
                onClick={toggleTheme}
                title="Toggle Dark Mode"
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
        </header>
    );
};

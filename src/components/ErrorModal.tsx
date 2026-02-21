import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    errorMessage: string;
    onRefresh?: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, errorMessage, onRefresh }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-border dark:border-border-dark animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-border dark:border-border-dark flex items-center gap-3 text-error dark:text-red-400">
                    <AlertCircle size={20} />
                    <h3 className="font-semibold text-[14px]">Authentication / Connection Error</h3>
                </div>

                <div className="p-6">
                    <p className="text-[13px] text-text-secondary dark:text-text-dark-secondary leading-relaxed">
                        {errorMessage}
                    </p>
                </div>

                <div className="p-4 border-t border-border dark:border-border-dark flex justify-end gap-3 bg-gray-50 dark:bg-[#121212]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded text-[13px] font-medium text-text-primary dark:text-text-dark-primary hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-colors"
                    >
                        Dismiss
                    </button>
                    {onRefresh && (
                        <button
                            onClick={() => {
                                onClose();
                                onRefresh();
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded text-[13px] font-medium bg-primary text-white hover:bg-primary-hover transition-colors"
                        >
                            <RotateCw size={14} />
                            Refresh Page
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

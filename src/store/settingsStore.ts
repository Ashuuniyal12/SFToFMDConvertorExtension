
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeColors {
    primary: string;
    primaryHover: string;
    surface: string;
    surfaceDark: string;
    textPrimary: string;
    textSecondary: string;
    textDarkPrimary: string;
    textDarkSecondary: string;
    border: string;
    borderDark: string;
    success: string;
    error: string;
}

const defaultThemeColors: ThemeColors = {
    primary: '#0176d3',
    primaryHover: '#1b33b3',
    surface: '#F8F9FA',
    surfaceDark: '#1E1E1E',
    textPrimary: '#212529',
    textSecondary: '#6C757D',
    textDarkPrimary: '#E9ECEF',
    textDarkSecondary: '#A0A0A0',
    border: '#E9ECEF',
    borderDark: '#2D2D2D',
    success: '#10B981',
    error: '#dc3545',
};

interface SettingsState {
    mobileWidth: number;
    mobileHeight: number;
    themeColors: ThemeColors;
    integrationProfileName: string;
    integrationPermSetName: string;
    setMobileWidth: (width: number) => void;
    setMobileHeight: (height: number) => void;
    setThemeColor: (key: keyof ThemeColors, value: string) => void;
    setIntegrationProfileName: (name: string) => void;
    setIntegrationPermSetName: (name: string) => void;
    resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            mobileWidth: 600,
            mobileHeight: 550,
            themeColors: { ...defaultThemeColors },
            integrationProfileName: 'DF API - Only Integration Profile',
            integrationPermSetName: 'DF Datalake',
            setMobileWidth: (width) => set({ mobileWidth: width }),
            setMobileHeight: (height) => set({ mobileHeight: height }),
            setThemeColor: (key, value) =>
                set((state) => ({
                    themeColors: {
                        ...state.themeColors,
                        [key]: value,
                    },
                })),
            setIntegrationProfileName: (name) => set({ integrationProfileName: name }),
            setIntegrationPermSetName: (name) => set({ integrationPermSetName: name }),
            resetSettings: () =>
                set({
                    mobileWidth: 600,
                    mobileHeight: 550,
                    themeColors: { ...defaultThemeColors },
                    integrationProfileName: 'DF API - Only Integration Profile',
                    integrationPermSetName: 'DF Datalake',
                }),
        }),
        {
            name: 'app-settings',
        }
    )
);

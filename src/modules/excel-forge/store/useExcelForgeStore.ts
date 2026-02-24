import { create } from 'zustand';
import * as XLSX from 'xlsx';
import { ParsedSheet, MappingType } from '../types';

interface ExcelForgeState {
    workbook: XLSX.WorkBook | null;
    fileBuffer: ArrayBuffer | null;
    sheets: ParsedSheet[];

    jsonData: any[];
    flattenedKeys: string[];

    mappings: MappingType; // Record<string, Record<string, string>>

    loading: boolean;
    error: string | null;

    setWorkbook: (wb: XLSX.WorkBook, buffer: ArrayBuffer) => void;
    setSheets: (sheets: ParsedSheet[]) => void;
    setJsonData: (data: any[], keys: string[]) => void;
    updateMapping: (sheet: string, column: string, value: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useExcelForgeStore = create<ExcelForgeState>((set) => ({
    workbook: null,
    fileBuffer: null,
    sheets: [],

    jsonData: [],
    flattenedKeys: [],

    mappings: {},

    loading: false,
    error: null,

    setWorkbook: (wb, buffer) => set({ workbook: wb, fileBuffer: buffer }),

    setSheets: (sheets) => set((state) => {
        // Initialize mappings for new sheets if they don't exist
        const newMappings = { ...state.mappings };
        sheets.forEach(sheet => {
            if (!newMappings[sheet.name]) {
                newMappings[sheet.name] = {};
            }
        });
        return { sheets, mappings: newMappings };
    }),

    setJsonData: (data, keys) => set({
        jsonData: data,
        flattenedKeys: keys
    }),

    updateMapping: (sheet, column, value) => set((state) => ({
        mappings: {
            ...state.mappings,
            [sheet]: {
                ...(state.mappings[sheet] || {}),
                [column]: value
            }
        }
    })),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    reset: () => set({
        workbook: null,
        fileBuffer: null,
        sheets: [],
        jsonData: [],
        flattenedKeys: [],
        mappings: {},
        loading: false,
        error: null
    })
}));

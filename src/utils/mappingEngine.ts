import { FMDRow, MappingConfig, SalesforceField } from '../types';

const DEFAULT_MAPPINGS: Record<string, string> = {
    "string": "STRING",
    "textarea": "STRING",
    "email": "STRING",
    "url": "STRING",
    "phone": "STRING",
    "picklist": "STRING",
    "multipicklist": "STRING",
    "combobox": "STRING",
    "reference": "STRING", // IDs
    "id": "STRING",
    "boolean": "BOOL",
    "date": "DATE",
    "datetime": "TIMESTAMP",
    "currency": "NUMERIC",
    "double": "NUMERIC",
    "int": "NUMERIC", // BigQuery INTEGER is int64, NUMERIC is safe too
    "percent": "NUMERIC",
    "base64": "STRING", // or BYTES
    "address": "STRING",
    "location": "STRING"
};

export class MappingEngine {
    public mappings: Record<string, string>;

    constructor() {
        this.mappings = JSON.parse(JSON.stringify(DEFAULT_MAPPINGS));
    }

    async loadMappings() {
        const stored = await chrome.storage.local.get("typeMappings");
        if (stored.typeMappings) {
            this.mappings = { ...this.mappings, ...stored.typeMappings };
        }
    }

    async saveMappings(newMappings: Record<string, string>) {
        this.mappings = newMappings;
        await chrome.storage.local.set({ typeMappings: newMappings });
    }

    async resetMappings() {
        this.mappings = JSON.parse(JSON.stringify(DEFAULT_MAPPINGS));
        await chrome.storage.local.set({ typeMappings: this.mappings });
    }

    getBigQueryType(sfType: string): string {
        const lowerType = sfType.toLowerCase();
        return this.mappings[lowerType] || "STRING";
    }

    mapField(field: SalesforceField, objectName: string, userConfig: MappingConfig = {}): FMDRow {
        const targetType = this.getBigQueryType(field.type);
        const mode = field.nillable ? "NULLABLE" : "REQUIRED";

        return {
            sourceObject: objectName,
            sourceField: field.name,
            sourceType: field.type,
            length: field.length,
            precision: field.precision,
            scale: field.scale,
            targetField: field.name,
            targetType: targetType,
            mode: mode,
            dataset: userConfig.dataset || "Raw_Data",
            table: userConfig.table || objectName.toLowerCase()
        };
    }
}

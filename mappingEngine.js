const DEFAULT_MAPPINGS = {
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
    "base64": "STRING", // or BYTES, but STRING is safer for CSV/FMD
    "address": "STRING", // Compound field, usually broken down but if treated as one
    "location": "STRING"
};

class MappingEngine {
    constructor() {
        this.mappings = JSON.parse(JSON.stringify(DEFAULT_MAPPINGS));
        this.loadMappings();
    }

    async loadMappings() {
        const stored = await chrome.storage.local.get("typeMappings");
        if (stored.typeMappings) {
            this.mappings = { ...this.mappings, ...stored.typeMappings };
        }
    }

    async saveMappings(newMappings) {
        this.mappings = newMappings;
        await chrome.storage.local.set({ typeMappings: newMappings });
    }

    async resetMappings() {
        this.mappings = JSON.parse(JSON.stringify(DEFAULT_MAPPINGS));
        await chrome.storage.local.set({ typeMappings: this.mappings });
        return this.mappings;
    }

    getBigQueryType(sfType) {
        // Handle case insensitivity and defaults
        const lowerType = sfType.toLowerCase();
        return this.mappings[lowerType] || "STRING"; // Default to STRING if unknown
    }

    // Convert SF Field Definition to FMD Row
    mapField(field, objectName, userConfig = {}) {
        // userConfig might contain overrides or dataset info

        const targetType = this.getBigQueryType(field.type);
        const mode = field.nillable ? "NULLABLE" : "REQUIRED";

        return {
            sourceObject: objectName,
            sourceField: field.name,
            sourceType: field.type,
            length: field.length,
            precision: field.precision,
            scale: field.scale,
            targetField: field.name, // Can be overridden if we add logic for renaming
            targetType: targetType,
            mode: mode,
            dataset: userConfig.dataset || "Raw_Data",
            table: userConfig.table || objectName.toLowerCase()
        };
    }
}

// Make globally available
window.MappingEngine = MappingEngine;

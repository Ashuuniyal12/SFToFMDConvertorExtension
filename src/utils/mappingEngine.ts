import { FMDRow, MappingConfig, SalesforceField } from '../types';

const DEFAULT_MAPPINGS: Record<string, string> = {
    // 📝 Text Data Types
    "string": "STRING",
    "textarea": "STRING",
    "email": "STRING",
    "url": "STRING",
    "phone": "STRING",
    "picklist": "STRING",
    "multipicklist": "STRING",
    "combobox": "STRING",
    "reference": "STRING", // IDs
    "id": "STRING", // Added
    "encryptedstring": "STRING", // Encrypted Text

    // 🔢 Number Data Types
    "currency": "FLOAT",
    "double": "FLOAT",
    "int": "FLOAT",
    "percent": "FLOAT",

    // 📅 Date & Time Data Types
    "date": "TIMESTAMP",
    "datetime": "TIMESTAMP",
    "time": "TIMESTAMP",

    // 🔘 Picklist Types (already covered above)
    // 🔗 Relationship Data Types (covered by reference)

    // 🧮 Advanced / Special Types
    "boolean": "BOOLEAN", // User requested BOOLEAN
    "base64": "STRING", // or BYTES
    "address": "STRING",
    "location": "STRING",

    // ➕ Missing Salesforce Field Types (Added)
    "anytype": "STRING", // Fallback
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

    getBigQueryType(field: SalesforceField): string {
        // Check for specific field names / system fields
        const fieldNameLower = field.name.toLowerCase();

        // ➕ Missing Salesforce Field Types (Added by name)
        if (fieldNameLower === 'id' ||
            fieldNameLower === 'recordtypeid' ||
            fieldNameLower === 'ownerid' ||
            fieldNameLower === 'createdbyid' ||
            fieldNameLower === 'lastmodifiedbyid' ||
            field.externalId) {
            return "STRING";
        }

        if (fieldNameLower === 'createddate' ||
            fieldNameLower === 'lastmodifieddate' ||
            fieldNameLower === 'systemmodstamp') {
            return "TIMESTAMP";
        }

        if (fieldNameLower === 'isdeleted') {
            return "BOOLEAN";
        }

        const lowerType = field.type.toLowerCase();

        // 📝 Text Data Types
        if (["string", "textarea", "email", "url", "phone", "picklist", "multipicklist", "combobox", "encryptedstring", "anytype"].includes(lowerType)) {
            return "STRING";
        }

        // 🔢 Number Data Types
        if (["double", "int", "currency", "percent"].includes(lowerType)) {
            return "FLOAT";
        }

        // 📅 Date & Time Data Types
        if (["date", "datetime", "time"].includes(lowerType)) {
            return "TIMESTAMP";
        }

        // 🔗 Relationship Data Types
        if (lowerType === 'reference') {
            return "STRING";
        }

        // 🧮 Advanced / Special Types
        if (lowerType === 'boolean') {
            return "BOOLEAN";
        }

        if (["address", "location"].includes(lowerType)) {
            return "STRING";
        }

        // Fallback to dictionary lookup or default STRING
        return this.mappings[lowerType] || "STRING";
    }

    getFormattedSourceType(field: SalesforceField): string {
        const lowerType = field.type.toLowerCase();

        // Handle numeric types with precision/scale
        // Handle numeric types with precision/scale
        if (['double', 'currency', 'percent', 'int'].includes(lowerType)) {
            const p = field.precision !== undefined ? field.precision : 18;
            const s = field.scale !== undefined ? field.scale : 0;
            // User wants (IntegerPart, Scale) where IntegerPart = Precision - Scale
            // Ensure p >= s
            const integerPart = (p >= s) ? (p - s) : p;
            return `${field.type}(${integerPart},${s})`;
        }

        // Handle lookup relationships
        if (lowerType === 'reference' && field.referenceTo && field.referenceTo.length > 0) {
            return `Lookup(${field.referenceTo.join(', ')})`;
        }

        // Handle master-detail (if discernable, usually also 'reference' but might have specific cascade delete props, assuming reference for now or check isCascadingDelete if available in metadata)
        // For now, simple reference check is good.

        // Handle Roll-Up Summary
        // Heuristic: calculated=true, but no formula (usually implies it's a summary field stored in backend)
        // Or if type is specific to rollup (SObjectField doesn't always say "rollup")
        // If calculated is true and it's a number/currency with no formula, it's likely a Roll-Up or similar system calc.
        // However, standard formulas also have calculated=true.
        // If we strictly want to distinguish "Roll-Up Summary", we might need more metadata.
        // For now, if user says "Roll-Up Summary" -> STRING, they might just mean the mapping.
        // But for source type display:
        if (field.calculated && !field.calculatedFormula && field.type !== 'boolean' && field.type !== 'combobox') {
            // System fields like CreatedDate are calculated but don't have formula.
            // Exclude system fields from being called "Roll-Up"
            const systemFields = ['createddate', 'lastmodifieddate', 'systemmodstamp'];
            if (!systemFields.includes(field.name.toLowerCase())) {
                return `Roll-Up Summary (${field.type})`;
            }
        }

        return field.type;
    }

    mapField(field: SalesforceField, objectName: string, userConfig: MappingConfig = {}): FMDRow {
        const targetType = this.getBigQueryType(field);
        const mode = field.nillable ? "NULLABLE" : "REQUIRED";
        const sourceType = this.getFormattedSourceType(field);

        return {
            sourceObject: objectName,
            sourceField: field.name,
            sourceType: sourceType,
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

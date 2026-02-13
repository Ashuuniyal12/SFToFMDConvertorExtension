export interface SalesforceField {
    name: string;
    label: string;
    type: string;
    length?: number;
    precision?: number;
    scale?: number;
    nillable?: boolean;
    calculated?: boolean;
    custom?: boolean;
    // UI state
    selected?: boolean;
    isVirtual?: boolean;
}

export interface SalesforceDescribeResult {
    fields: SalesforceField[];
    [key: string]: any;
}

export interface MappingConfig {
    dataset?: string;
    table?: string;
    poc?: string;
}

export interface FMDRow {
    sourceObject: string;
    sourceField: string;
    sourceType: string;
    length?: number;
    precision?: number;
    scale?: number;
    targetField: string;
    targetType: string;
    mode: string;
    dataset: string;
    table: string;
}

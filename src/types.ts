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
    unique?: boolean;
    externalId?: boolean;
    caseSensitive?: boolean;
    filterable?: boolean;
    sortable?: boolean;
    groupable?: boolean;
    updateable?: boolean;
    createable?: boolean;
    htmlFormatted?: boolean;
    referenceTo?: string[];
    relationshipName?: string;
    inlineHelpText?: string;
    defaultValue?: any;
    picklistValues?: any[];
    calculatedFormula?: string;

    dfMapping?: {
        mappedDfName?: string;
        manualDf?: {
            label: string;
            name: string;
            type: string;
            length?: number;
            precision?: number;
            scale?: number;
        };
    };
    // UI state
    selected?: boolean;
    isVirtual?: boolean;
    hidden?: boolean;
}

export interface SalesforceDescribeResult {
    fields: SalesforceField[];
    [key: string]: any;
}

export interface SObjectDescribe {
    name: string;
    label: string;
    custom: boolean;
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

import { Node } from '@xyflow/react';

export interface EntityNodeData extends Record<string, unknown> {
    label: string;
    objectName: string;
    isCustom: boolean;
    fieldCount: number;
    referenceCount: number;
    depth: number;
    expanded: boolean;
}

export type EntityNode = Node<EntityNodeData, 'entity'>;

export interface RelationshipService {
    describeObject(objectName: string): Promise<any>;
}

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

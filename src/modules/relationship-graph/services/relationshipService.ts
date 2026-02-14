import { SalesforceApi } from '../../../utils/salesforceApi';
import { EntityNode } from '../graphTypes';
import { type Edge, MarkerType } from '@xyflow/react';

export class RelationshipService {
    private api: SalesforceApi;
    private cache: Map<string, any>;

    constructor(api: SalesforceApi) {
        this.api = api;
        this.cache = new Map();
    }

    async describeObject(objectName: string): Promise<any> {
        if (this.cache.has(objectName)) {
            return this.cache.get(objectName);
        }
        try {
            const result = await this.api.describe(objectName);
            this.cache.set(objectName, result);
            return result;
        } catch (error) {
            console.error(`Failed to describe object ${objectName}`, error);
            throw error;
        }
    }

    async buildGraphForObject(objectName: string, depth: number): Promise<{ nodes: EntityNode[], edges: Edge[] }> {
        const nodes: Map<string, EntityNode> = new Map();
        const edges: Edge[] = [];

        interface QueueItem {
            name: string;
            level: number;
            parentNodeId: string | null;
            sourceAngle: number;
            indexInParent: number;
            totalSiblings: number;
        }

        const queue: QueueItem[] = [{
            name: objectName,
            level: 0,
            parentNodeId: null,
            sourceAngle: 0,
            indexInParent: 0,
            totalSiblings: 1
        }];

        const processed = new Set<string>();

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (processed.has(current.name)) continue;
            processed.add(current.name);

            try {
                const describe = await this.describeObject(current.name);

                let position = { x: 0, y: 0 };
                if (current.level === 0) {
                    position = { x: 0, y: 0 };
                } else {
                    const parentNode = nodes.get(current.parentNodeId!)!;
                    if (parentNode) {
                        const radius = 350;
                        let angle = 0;
                        if (current.level === 1) {
                            const angleStep = (2 * Math.PI) / (current.totalSiblings || 1);
                            angle = current.indexInParent * angleStep;
                        } else {
                            const angleStep = (Math.PI / 2) / (current.totalSiblings || 1);
                            const baseAngle = Math.atan2(parentNode.position.y, parentNode.position.x);
                            angle = baseAngle - (Math.PI / 4) + (current.indexInParent * angleStep);
                        }
                        position = {
                            x: parentNode.position.x + Math.cos(angle) * radius,
                            y: parentNode.position.y + Math.sin(angle) * radius
                        };
                    }
                }

                const node: EntityNode = {
                    id: current.name,
                    type: 'entity',
                    position,
                    data: {
                        label: describe.label,
                        objectName: describe.name,
                        isCustom: describe.custom,
                        fieldCount: describe.fields.length,
                        referenceCount: 0,
                        depth: current.level,
                        expanded: current.level < depth
                    }
                };
                nodes.set(current.name, node);

                if (current.level < depth) {
                    const referenceFields = describe.fields.filter((f: any) => f.type === 'reference');
                    node.data.referenceCount = referenceFields.length;

                    const potentialChildren: { refObj: string, field: any }[] = [];
                    referenceFields.forEach((field: any) => {
                        field.referenceTo.forEach((refObj: string) => {
                            if (refObj !== current.name && !processed.has(refObj)) {
                                potentialChildren.push({ refObj, field });
                            }
                        });
                    });

                    potentialChildren.forEach((child, idx) => {
                        const { refObj, field } = child;
                        const edgeId = `${current.name}-${field.name}-${refObj}`;
                        if (!edges.find(e => e.id === edgeId)) {
                            const isMasterDetail = field.cascadeDelete;
                            const edgeLabel = `${field.label} (${isMasterDetail ? 'Master-Detail' : 'Lookup'})`;
                            edges.push({
                                id: edgeId,
                                source: current.name,
                                target: refObj,
                                label: edgeLabel,
                                type: 'smoothstep',
                                markerEnd: { type: MarkerType.ArrowClosed },
                                style: {
                                    stroke: isMasterDetail ? '#000' : '#888',
                                    strokeDasharray: isMasterDetail ? '0' : '5,5',
                                    strokeWidth: isMasterDetail ? 2 : 1
                                }
                            });
                        }

                        const inQueue = queue.find(q => q.name === refObj);
                        if (!nodes.has(refObj) && !inQueue) {
                            queue.push({
                                name: refObj,
                                level: current.level + 1,
                                parentNodeId: current.name,
                                sourceAngle: 0,
                                indexInParent: idx,
                                totalSiblings: potentialChildren.length
                            });
                        }
                    });
                } else {
                    const referenceFields = describe.fields.filter((f: any) => f.type === 'reference');
                    node.data.referenceCount = referenceFields.length;
                }

            } catch (e) {
                console.error(`Failed to process ${current.name}`, e);
            }
        }

        return { nodes: Array.from(nodes.values()), edges };
    }

    async expandNode(nodeId: string, currentNodes: EntityNode[], currentEdges: Edge[]): Promise<{ newNodes: EntityNode[], newEdges: Edge[] }> {
        const describe = await this.describeObject(nodeId);
        const parentNode = currentNodes.find(n => n.id === nodeId);
        if (!parentNode) return { newNodes: [], newEdges: [] };

        const newNodes: EntityNode[] = [];
        const newEdges: Edge[] = [];
        const referenceFields = describe.fields.filter((f: any) => f.type === 'reference');

        const radius = 350;
        let siblings = 0;
        referenceFields.forEach((f: any) => siblings += f.referenceTo.length);
        const angleStep = (2 * Math.PI) / (siblings || 1);
        let currentSibling = 0;

        for (const field of referenceFields) {
            for (const refObj of field.referenceTo) {
                if (currentNodes.find(n => n.id === refObj) || newNodes.find(n => n.id === refObj)) {
                    const edgeId = `${nodeId}-${field.name}-${refObj}`;
                    if (!currentEdges.find(e => e.id === edgeId) && !newEdges.find(e => e.id === edgeId)) {
                        const isMasterDetail = field.cascadeDelete;
                        const edgeLabel = `${field.label} (${isMasterDetail ? 'Master-Detail' : 'Lookup'})`;
                        newEdges.push({
                            id: edgeId,
                            source: nodeId,
                            target: refObj,
                            label: edgeLabel,
                            type: 'smoothstep',
                            markerEnd: { type: MarkerType.ArrowClosed },
                            style: {
                                stroke: isMasterDetail ? '#000' : '#888',
                                strokeDasharray: isMasterDetail ? '0' : '5,5',
                                strokeWidth: isMasterDetail ? 2 : 1
                            }
                        });
                    }
                    continue;
                }

                const angle = currentSibling * angleStep;
                const x = parentNode.position.x + Math.cos(angle) * radius;
                const y = parentNode.position.y + Math.sin(angle) * radius;
                currentSibling++;

                let label = refObj;
                let isCustom = refObj.endsWith('__c');

                newNodes.push({
                    id: refObj,
                    type: 'entity',
                    position: { x, y },
                    data: {
                        label: label,
                        objectName: refObj,
                        isCustom: isCustom,
                        fieldCount: 0,
                        referenceCount: 0,
                        depth: parentNode.data.depth + 1,
                        expanded: false
                    }
                });

                const edgeId = `${nodeId}-${field.name}-${refObj}`;
                const isMasterDetail = field.cascadeDelete;
                const edgeLabel = `${field.label} (${isMasterDetail ? 'Master-Detail' : 'Lookup'})`;

                newEdges.push({
                    id: edgeId,
                    source: nodeId,
                    target: refObj,
                    label: edgeLabel,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: {
                        stroke: isMasterDetail ? '#000' : '#888',
                        strokeDasharray: isMasterDetail ? '0' : '5,5',
                        strokeWidth: isMasterDetail ? 2 : 1
                    }
                });
            }
        }

        return { newNodes, newEdges };
    }

    collapseNode(nodeId: string, currentNodes: EntityNode[], currentEdges: Edge[]): { nodes: EntityNode[], edges: Edge[] } {
        const nodesToRemove = new Set<string>();
        const edgesToRemove = new Set<string>();

        const outgoingEdges = currentEdges.filter(e => e.source === nodeId);

        const markForRemoval = (targetId: string) => {
            const incoming = currentEdges.filter(e => e.target === targetId && !edgesToRemove.has(e.id));
            if (incoming.length <= 1) {
                nodesToRemove.add(targetId);
                const childEdges = currentEdges.filter(e => e.source === targetId);
                childEdges.forEach(e => {
                    edgesToRemove.add(e.id);
                    markForRemoval(e.target);
                });
            }
        };

        outgoingEdges.forEach(e => {
            edgesToRemove.add(e.id);
            markForRemoval(e.target);
        });

        const newNodes = currentNodes.filter(n => !nodesToRemove.has(n.id));
        const newEdges = currentEdges.filter(e => !edgesToRemove.has(e.id));

        const updatedNodes = newNodes.map(n => {
            if (n.id === nodeId) {
                return { ...n, data: { ...n.data, expanded: false } };
            }
            return n;
        });

        return { nodes: updatedNodes, edges: newEdges };
    }
}

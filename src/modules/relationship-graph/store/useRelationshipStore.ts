import { create } from 'zustand';
import {
    type Edge,
    type NodeChange,
    type EdgeChange,
    type OnNodesChange,
    type OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges
} from '@xyflow/react';
import { SalesforceApi } from '../../../utils/salesforceApi';
import { RelationshipService } from '../services/relationshipService';
import { EntityNode } from '../graphTypes';

interface RelationshipState {
    nodes: EntityNode[];
    edges: Edge[];
    loading: boolean;
    error: string | null;
    depth: number;
    currentObject: string | null;
    visitedObjects: Set<string>;
    service: RelationshipService | null;

    // Actions
    setService: (api: SalesforceApi) => void;
    setDepth: (depth: number) => void;
    fetchGraph: (objectName: string) => Promise<void>;
    expandNode: (nodeId: string) => Promise<void>;
    toggleNode: (nodeId: string) => Promise<void>;
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    reset: () => void;
}

export const useRelationshipStore = create<RelationshipState>((set, get) => ({
    nodes: [],
    edges: [],
    loading: false,
    error: null,
    depth: 1,
    currentObject: null,
    visitedObjects: new Set(),
    service: null,

    setService: (api: SalesforceApi) => {
        set({ service: new RelationshipService(api) });
    },

    setDepth: (depth: number) => {
        set({ depth });
    },

    fetchGraph: async (objectName: string) => {
        const { service, depth } = get();
        if (!service) return;

        set({ loading: true, error: null, currentObject: objectName, visitedObjects: new Set([objectName]) });

        try {
            const { nodes, edges } = await service.buildGraphForObject(objectName, depth);
            set({ nodes, edges, loading: false });
        } catch (e: any) {
            set({ error: e.message, loading: false });
        }
    },

    expandNode: async (nodeId: string) => {
        const { service, nodes, edges, visitedObjects } = get();
        if (!service) return; // Allow re-expansion if it was collapsed, so remove visited check here or handle it inside

        set({ loading: true });
        try {
            const { newNodes, newEdges } = await service.expandNode(nodeId, nodes, edges);

            const newVisited = new Set(visitedObjects);
            newVisited.add(nodeId);

            // Mark parent as expanded
            const updatedNodes = nodes.map(n =>
                n.id === nodeId ? { ...n, data: { ...n.data, expanded: true } } : n
            );

            set({
                nodes: [...updatedNodes, ...newNodes],
                edges: [...edges, ...newEdges],
                visitedObjects: newVisited,
                loading: false
            });
        } catch (e: any) {
            set({ error: e.message, loading: false });
        }
    },

    toggleNode: async (nodeId: string) => {
        const { nodes, expandNode, service, edges } = get();
        const node = nodes.find(n => n.id === nodeId);
        if (!node || !service) return;

        if (node.data.expanded) {
            // Collapse
            const { nodes: newNodes, edges: newEdges } = service.collapseNode(nodeId, nodes, edges);
            set({ nodes: newNodes, edges: newEdges });
        } else {
            // Expand
            await expandNode(nodeId);
        }
    },

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as EntityNode[],
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    reset: () => {
        set({ nodes: [], edges: [], visitedObjects: new Set(), error: null, currentObject: null });
    }
}));

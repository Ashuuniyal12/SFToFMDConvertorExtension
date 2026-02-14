import { useEffect, useCallback } from 'react';
import { ReactFlow, Controls, Background, MiniMap, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SalesforceApi } from '../../../utils/salesforceApi';
import { useRelationshipStore } from '../store/useRelationshipStore';
import EntityNode from './EntityNode';
import { ControlPanel } from './ControlPanel';

const nodeTypes = {
    entity: EntityNode,
};

interface RelationshipGraphProps {
    api: SalesforceApi | null;
    currentObject: string | null;
}

export const RelationshipGraph = ({ api, currentObject }: RelationshipGraphProps) => {
    const {
        nodes, edges, loading, error,
        setService, fetchGraph, expandNode, toggleNode,
        onNodesChange, onEdgesChange
    } = useRelationshipStore();

    // Initialize Service on mount or when API changes
    useEffect(() => {
        if (api) {
            setService(api);
        }
    }, [api, setService]);

    // Initial Fetch
    useEffect(() => {
        if (currentObject && api) {
            fetchGraph(currentObject);
        }
    }, [currentObject, api, fetchGraph]);

    const onConnect = useCallback(
        (params: Connection) => onEdgesChange([{ type: 'add', item: { ...params, id: `e${params.source}-${params.target}` } }]),
        [onEdgesChange],
    );

    const onNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
        if (node.id && !node.data.expanded) {
            expandNode(node.id);
        }
    }, [expandNode]);

    const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: any) => {
        if (node.id) {
            toggleNode(node.id);
        }
    }, [toggleNode]);

    if (!api) {
        return <div className="p-10 text-center text-gray-500">Please login to Salesforce first.</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%' }} className="relative bg-gray-50 dark:bg-[#121212]">
            <ControlPanel />

            {loading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/80 dark:bg-black/50 px-4 py-2 rounded-full shadow-lg backdrop-blur text-sm font-medium animate-pulse flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                    Loading Graph...
                </div>
            )}

            {error && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg shadow-lg text-sm border border-red-200 dark:border-red-800">
                    Error: {error}
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-gray-50 dark:bg-[#121212]"
                minZoom={0.1}
                maxZoom={2}
            >
                <Background color="#ccc" gap={20} />
                <Controls showInteractive={false} className="!bottom-10 !left-4" />
                <MiniMap
                    nodeStrokeColor="#888"
                    nodeColor="#eee"
                    maskColor="rgba(0,0,0,0.1)"
                    className="!bottom-4 !right-4"
                />
            </ReactFlow>
        </div>
    );
};

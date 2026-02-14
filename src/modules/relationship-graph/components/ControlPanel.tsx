import { useRelationshipStore } from '../store/useRelationshipStore';
import { Layers, RotateCcw, Focus } from 'lucide-react';

export const ControlPanel = () => {
    const { depth, setDepth, currentObject, fetchGraph } = useRelationshipStore();

    const handleDepthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDepth = parseInt(e.target.value);
        setDepth(newDepth);
        if (currentObject) {
            fetchGraph(currentObject);
        }
    };

    return (
        <div className="absolute top-4 right-4 z-10 bg-white dark:bg-[#1E1E1E] p-2 rounded-lg shadow-md border border-gray-200 dark:border-[#333] flex flex-col gap-2">

            <div className="flex items-center gap-2 p-1 border-b border-gray-100 dark:border-[#333] pb-2 mb-1">
                <Layers size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Depth</span>
                <select
                    value={depth}
                    onChange={handleDepthChange}
                    className="text-xs border-none bg-transparent font-bold text-primary focus:outline-none cursor-pointer"
                >
                    <option value={1}>1 Level</option>
                    <option value={2}>2 Levels</option>
                    <option value={3}>3 Levels</option>
                </select>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => currentObject && fetchGraph(currentObject)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-600 dark:text-gray-300 transition-colors"
                    title="Reset Layout"
                >
                    <RotateCcw size={14} />
                </button>
                <button
                    onClick={() => { /* ReactFlow fitView is accessible via hook in parent, maybe store exposed? */ }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-600 dark:text-gray-300 transition-colors"
                    title="Center View"
                >
                    <Focus size={14} />
                </button>
            </div>
        </div>
    );
};

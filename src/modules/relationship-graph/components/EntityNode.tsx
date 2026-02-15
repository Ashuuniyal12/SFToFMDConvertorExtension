import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { EntityNode as EntityNodeType } from '../graphTypes';
import { Database, Link, List } from 'lucide-react';

const EntityNode = ({ data, selected }: NodeProps<EntityNodeType>) => {
    return (
        <div className={`
            group relative bg-white dark:bg-[#1E1E1E]
            border border-gray-200 dark:border-[#333]
            rounded-lg shadow-sm w-[250px]
            transition-all duration-300
            hover:shadow-[0_0_15px_color-mix(in_srgb,var(--color-primary),transparent_60%)]
            hover:border-[var(--color-primary)]
            ${selected ? 'ring-2 ring-[var(--color-primary)] shadow-[0_0_15px_color-mix(in_srgb,var(--color-primary),transparent_60%)]' : ''}
        `}>
            {/* Header */}
            <div className="p-3 border-b border-gray-100 dark:border-[#333] flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`
                        w-8 h-8 rounded-md flex items-center justify-center shrink-0
                        ${data.isCustom ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}
                    `}>
                        <Database size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100" title={data.label}>
                            {data.label}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={data.objectName}>
                            {data.objectName}
                        </span>
                    </div>
                </div>
                {/* Object Type Badge */}
                <span className={`
                    text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider
                    ${data.isCustom ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}
                `}>
                    {data.isCustom ? 'CUST' : 'STD'}
                </span>
            </div>

            {/* Stats */}
            <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <List size={14} className="text-gray-400" />
                    <span>{data.fieldCount > 0 ? `${data.fieldCount} Fields` : '...'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Link size={14} className="text-gray-400" />
                    <span>{data.referenceCount > 0 ? `${data.referenceCount} Refs` : '...'}</span>
                </div>
            </div>

            {/* Expand Action (Visual Only here, logic on node click in parent) */}
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Could add a specific expand button here if node click isn't enough */}
            </div>

            {/* Handles */}
            <Handle type="target" position={Position.Left} className="!bg-gray-300 dark:!bg-gray-600 !w-3 !h-3 !-left-1.5" />
            <Handle type="source" position={Position.Right} className="!bg-purple-500 !w-3 !h-3 !-right-1.5" />
        </div>
    );
};

export default memo(EntityNode);

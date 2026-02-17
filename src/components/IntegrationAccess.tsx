import React, { useState, useMemo } from 'react';
import { SalesforceField } from '../types';
import { ChevronDown, ChevronUp, ChevronsUpDown, Copy, Check, X, Code } from 'lucide-react';

interface FieldPermission {
    readable: boolean;
    editable: boolean;
}

interface IntegrationAccessProps {
    fields: SalesforceField[];
    objectName: string;
    profilePerms: Record<string, FieldPermission>;
    permSetPerms: Record<string, FieldPermission>;
    profileName: string;
    permSetName: string;
    isFullScreen: boolean;
    loading: boolean;
}

type SortKey = 'name' | 'label' | 'fieldType' | 'required' | 'profileRead' | 'profileEdit' | 'permSetRead' | 'permSetEdit';

const getFieldCategory = (field: SalesforceField): string => {
    if (field.calculated && field.calculatedFormula) return 'FORMULA';
    if (field.calculated && !field.calculatedFormula && field.type !== 'boolean' && field.type !== 'combobox') {
        const systemFields = ['createddate', 'lastmodifieddate', 'systemmodstamp'];
        if (!systemFields.includes(field.name.toLowerCase())) return 'ROLLUP';
    }
    if (field.custom) return 'CUSTOM';
    return 'SYSTEM';
};

const getCategoryStyle = (category: string): string => {
    switch (category) {
        case 'FORMULA': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
        case 'ROLLUP': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
        case 'CUSTOM': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
        case 'SYSTEM': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        default: return '';
    }
};

export const IntegrationAccess: React.FC<IntegrationAccessProps> = ({
    fields, objectName, profilePerms, permSetPerms, profileName, permSetName, isFullScreen, loading
}) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
    const [filter, setFilter] = useState('');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
    const [showXmlModal, setShowXmlModal] = useState(false);
    const [xmlCopied, setXmlCopied] = useState(false);
    const [xmlTab, setXmlTab] = useState<'profile' | 'permset'>('profile');

    // Build map of hidden DF fields keyed by their name
    const hiddenFieldMap = useMemo(() => {
        const map: Record<string, SalesforceField> = {};
        fields.filter(f => f.hidden).forEach(f => { map[f.name] = f; });
        return map;
    }, [fields]);

    // Main list: non-hidden fields only (hidden ones render as sub-rows)
    const mainFields = useMemo(() => fields.filter(f => !f.hidden), [fields]);

    const getEffectivePerms = (field: SalesforceField, perms: Record<string, FieldPermission>) => {
        const isRequired = !field.nillable;
        const perm = perms[field.name];
        if (isRequired) {
            return { readable: true, editable: true };
        }
        return {
            readable: perm?.readable ?? false,
            editable: perm?.editable ?? false
        };
    };

    const generateFieldXml = (field: SalesforceField): string => {
        return `<fieldPermissions>\n\t<editable>false</editable>\n\t<field>${objectName}.${field.name}</field>\n\t<readable>true</readable>\n</fieldPermissions>`;
    };

    const copyFieldXml = (field: SalesforceField) => {
        const xml = generateFieldXml(field);
        navigator.clipboard.writeText(xml).then(() => {
            setCopiedField(field.name);
            setTimeout(() => setCopiedField(null), 1500);
        });
    };

    // For bulk XML: if a formula field has a DF counterpart, use DF only
    const resolveXmlFields = (): SalesforceField[] => {
        const selected = sortedFields.filter(f => selectedFields.has(f.name));
        return selected.map(f => {
            const dfName = f.dfMapping?.mappedDfName;
            if (dfName && hiddenFieldMap[dfName]) return hiddenFieldMap[dfName];
            return f;
        });
    };

    const generateBulkXml = (tab: 'profile' | 'permset'): string => {
        const xmlFields = resolveXmlFields();
        if (xmlFields.length === 0) return '';
        const label = tab === 'profile' ? `Profile: ${profileName}` : `Permission Set: ${permSetName}`;
        return `<!-- ${label} -->\n` + xmlFields.map(f => generateFieldXml(f)).join('\n');
    };

    const copyBulkXml = () => {
        const xml = generateBulkXml(xmlTab);
        navigator.clipboard.writeText(xml).then(() => {
            setXmlCopied(true);
            setTimeout(() => setXmlCopied(false), 2000);
        });
    };

    const copyAllXml = () => {
        const both = generateBulkXml('profile') + '\n\n' + generateBulkXml('permset');
        navigator.clipboard.writeText(both).then(() => {
            setXmlCopied(true);
            setTimeout(() => setXmlCopied(false), 2000);
        });
    };

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Comma-separated filter: match any token
    const filteredFields = useMemo(() => {
        const tokens = filter
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 0);

        if (tokens.length === 0) return mainFields;

        return mainFields.filter(f =>
            tokens.some(token =>
                f.name.toLowerCase().includes(token) ||
                f.label.toLowerCase().includes(token)
            )
        );
    }, [filter, mainFields]);

    const sortedFields = useMemo(() => {
        return [...filteredFields].sort((a, b) => {
            if (!sortConfig.key) return 0;
            let aVal: any, bVal: any;
            switch (sortConfig.key) {
                case 'name': aVal = a.name; bVal = b.name; break;
                case 'label': aVal = a.label; bVal = b.label; break;
                case 'fieldType': aVal = getFieldCategory(a); bVal = getFieldCategory(b); break;
                case 'required': aVal = !a.nillable ? 1 : 0; bVal = !b.nillable ? 1 : 0; break;
                case 'profileRead': aVal = getEffectivePerms(a, profilePerms).readable ? 1 : 0; bVal = getEffectivePerms(b, profilePerms).readable ? 1 : 0; break;
                case 'profileEdit': aVal = getEffectivePerms(a, profilePerms).editable ? 1 : 0; bVal = getEffectivePerms(b, profilePerms).editable ? 1 : 0; break;
                case 'permSetRead': aVal = getEffectivePerms(a, permSetPerms).readable ? 1 : 0; bVal = getEffectivePerms(b, permSetPerms).readable ? 1 : 0; break;
                case 'permSetEdit': aVal = getEffectivePerms(a, permSetPerms).editable ? 1 : 0; bVal = getEffectivePerms(b, permSetPerms).editable ? 1 : 0; break;
                default: return 0;
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredFields, sortConfig, profilePerms, permSetPerms]);

    const toggleField = (name: string) => {
        setSelectedFields(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedFields.size === sortedFields.length) {
            setSelectedFields(new Set());
        } else {
            setSelectedFields(new Set(sortedFields.map(f => f.name)));
        }
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column) return <ChevronsUpDown size={12} className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] opacity-0 group-hover:opacity-50" />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={12} className="text-[var(--color-primary)]" />
            : <ChevronDown size={12} className="text-[var(--color-primary)]" />;
    };

    const PermBadge = ({ value }: { value: boolean }) => (
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${value
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}>
            {value ? '✓' : '✗'}
        </span>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] gap-2">
                <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                Loading Field Permissions...
            </div>
        );
    }

    return (
        <>
            <div className={`bg-[var(--color-surface)] dark:bg-[#1E1E1E] rounded-lg shadow-[inset_0_0_0_1px_var(--color-border)] dark:shadow-[inset_0_0_0_1px_var(--color-border-dark)] overflow-hidden flex flex-col ${isFullScreen ? 'flex-1 m-4 border border-[var(--color-border)] dark:border-[var(--color-border-dark)]' : 'flex-1 m-3 min-h-0'}`}>

                {/* Header Bar */}
                <div className="p-4 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <h3 className="m-0 text-base font-semibold text-[var(--color-primary)]">Integration Access</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[color-mix(in_srgb,var(--color-primary),transparent_85%)] text-[var(--color-primary)] border border-[color-mix(in_srgb,var(--color-primary),transparent_70%)] font-bold">
                                {objectName}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            <span className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-800">
                                Profile: {profileName}
                            </span>
                            <span className="px-2 py-1 rounded bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-medium border border-teal-200 dark:border-teal-800">
                                PermSet: {permSetName}
                            </span>
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="Filter fields (comma-separated, e.g. Name, Email, Phone)..."
                        className="w-full p-2.5 bg-white dark:bg-[#121212] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded text-[13px] text-[var(--color-text-primary)] dark:text-[var(--color-text-dark-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary),transparent_85%)] transition-shadow"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                {/* Table - scrollable */}
                <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full text-[12px] border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[var(--color-surface)] dark:bg-[#1E1E1E] border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                                <th className="p-2 text-center w-8">
                                    <input
                                        type="checkbox"
                                        checked={sortedFields.length > 0 && selectedFields.size === sortedFields.length}
                                        onChange={toggleAll}
                                        className="accent-[var(--color-primary)] w-3.5 h-3.5 cursor-pointer"
                                    />
                                </th>
                                <th className="p-2.5 text-left font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] uppercase text-[10px] tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2A2A2A] group" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">API Name <SortIcon column="name" /></div>
                                </th>
                                <th className="p-2.5 text-left font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] uppercase text-[10px] tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2A2A2A] group" onClick={() => handleSort('label')}>
                                    <div className="flex items-center gap-1">Label <SortIcon column="label" /></div>
                                </th>
                                <th className="p-2.5 text-left font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] uppercase text-[10px] tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2A2A2A] group" onClick={() => handleSort('fieldType')}>
                                    <div className="flex items-center gap-1">Type <SortIcon column="fieldType" /></div>
                                </th>
                                <th className="p-2.5 text-center font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] uppercase text-[10px] tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2A2A2A] group" onClick={() => handleSort('required')}>
                                    <div className="flex items-center justify-center gap-1">Req <SortIcon column="required" /></div>
                                </th>
                                <th colSpan={2} className="p-1.5 text-center font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px] tracking-wider bg-indigo-50/50 dark:bg-indigo-900/10 border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                                    Profile
                                </th>
                                <th colSpan={2} className="p-1.5 text-center font-bold text-teal-600 dark:text-teal-400 uppercase text-[9px] tracking-wider bg-teal-50/50 dark:bg-teal-900/10 border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                                    PermSet
                                </th>
                                <th className="p-2.5 text-center font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] uppercase text-[10px] tracking-wider border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                                    XML
                                </th>
                            </tr>
                            <tr className="bg-[var(--color-surface)] dark:bg-[#1E1E1E] border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                                <th></th>
                                <th colSpan={4}></th>
                                <th className="p-1 text-center text-[9px] font-medium text-indigo-500 dark:text-indigo-400 uppercase border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-indigo-50/30 dark:bg-indigo-900/5 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/20 group" onClick={() => handleSort('profileRead')}>
                                    <div className="flex items-center justify-center gap-0.5">Read <SortIcon column="profileRead" /></div>
                                </th>
                                <th className="p-1 text-center text-[9px] font-medium text-indigo-500 dark:text-indigo-400 uppercase bg-indigo-50/30 dark:bg-indigo-900/5 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/20 group" onClick={() => handleSort('profileEdit')}>
                                    <div className="flex items-center justify-center gap-0.5">Edit <SortIcon column="profileEdit" /></div>
                                </th>
                                <th className="p-1 text-center text-[9px] font-medium text-teal-500 dark:text-teal-400 uppercase border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-teal-50/30 dark:bg-teal-900/5 cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/20 group" onClick={() => handleSort('permSetRead')}>
                                    <div className="flex items-center justify-center gap-0.5">Read <SortIcon column="permSetRead" /></div>
                                </th>
                                <th className="p-1 text-center text-[9px] font-medium text-teal-500 dark:text-teal-400 uppercase bg-teal-50/30 dark:bg-teal-900/5 cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/20 group" onClick={() => handleSort('permSetEdit')}>
                                    <div className="flex items-center justify-center gap-0.5">Edit <SortIcon column="permSetEdit" /></div>
                                </th>
                                <th className="border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedFields.map((field, idx) => {
                                const category = getFieldCategory(field);
                                const isRequired = !field.nillable;
                                const profileEff = getEffectivePerms(field, profilePerms);
                                const permSetEff = getEffectivePerms(field, permSetPerms);

                                // Find hidden DF sub-field for formula fields
                                const dfName = field.dfMapping?.mappedDfName;
                                const dfField = dfName ? hiddenFieldMap[dfName] : null;

                                return (
                                    <React.Fragment key={`${field.name}-${idx}`}>
                                        <tr
                                            className={`border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] last:border-b-0 hover:bg-[color-mix(in_srgb,var(--color-primary),transparent_92%)] transition-colors duration-100 ${isRequired ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}
                                        >
                                            <td className="p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFields.has(field.name)}
                                                    onChange={() => toggleField(field.name)}
                                                    className="accent-[var(--color-primary)] w-3.5 h-3.5 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-2.5 font-medium text-[var(--color-text-primary)] dark:text-[var(--color-text-dark-primary)] font-mono text-[11px] truncate max-w-[180px]" title={field.name}>
                                                {field.name}
                                            </td>
                                            <td className="p-2.5 text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] truncate max-w-[150px]" title={field.label}>
                                                {field.label}
                                            </td>
                                            <td className="p-2.5">
                                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border ${getCategoryStyle(category)}`}>
                                                    {category}
                                                </span>
                                            </td>
                                            <td className="p-2.5 text-center">
                                                {isRequired ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                        REQ
                                                    </span>
                                                ) : (
                                                    <span className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] text-[10px]">—</span>
                                                )}
                                            </td>
                                            <td className="p-2.5 text-center border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                                                <PermBadge value={profileEff.readable} />
                                            </td>
                                            <td className="p-2.5 text-center">
                                                <PermBadge value={profileEff.editable} />
                                            </td>
                                            <td className="p-2.5 text-center border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                                                <PermBadge value={permSetEff.readable} />
                                            </td>
                                            <td className="p-2.5 text-center">
                                                <PermBadge value={permSetEff.editable} />
                                            </td>
                                            <td className="p-2.5 text-center border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                                                <button
                                                    onClick={() => copyFieldXml(field)}
                                                    className="p-1.5 rounded hover:bg-[color-mix(in_srgb,var(--color-primary),transparent_85%)] text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] transition-colors"
                                                    title={generateFieldXml(field)}
                                                >
                                                    {copiedField === field.name
                                                        ? <Check size={14} className="text-green-500" />
                                                        : <Copy size={14} />
                                                    }
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Hidden DF sub-row for formula fields */}
                                        {dfField && (() => {
                                            const dfProfileEff = getEffectivePerms(dfField, profilePerms);
                                            const dfPermSetEff = getEffectivePerms(dfField, permSetPerms);
                                            const dfRequired = !dfField.nillable;
                                            return (
                                                <tr className="border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-purple-50/40 dark:bg-purple-900/5">
                                                    <td className="p-2 text-center">
                                                        {/* No checkbox for DF sub-row — included via parent */}
                                                    </td>
                                                    <td className="p-2.5 font-mono text-[11px] truncate max-w-[180px]" title={dfField.name}>
                                                        <span className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] flex items-center gap-1">
                                                            <span className="text-purple-400 dark:text-purple-500">└─</span>
                                                            {dfField.name}
                                                        </span>
                                                    </td>
                                                    <td className="p-2.5 text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] truncate max-w-[150px] text-[11px]" title={dfField.label}>
                                                        {dfField.label}
                                                    </td>
                                                    <td className="p-2.5">
                                                        <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-700">
                                                            DF
                                                        </span>
                                                    </td>
                                                    <td className="p-2.5 text-center">
                                                        {dfRequired ? (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">REQ</span>
                                                        ) : (
                                                            <span className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] text-[10px]">—</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2.5 text-center border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                                                        <PermBadge value={dfProfileEff.readable} />
                                                    </td>
                                                    <td className="p-2.5 text-center">
                                                        <PermBadge value={dfProfileEff.editable} />
                                                    </td>
                                                    <td className="p-2.5 text-center border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                                                        <PermBadge value={dfPermSetEff.readable} />
                                                    </td>
                                                    <td className="p-2.5 text-center">
                                                        <PermBadge value={dfPermSetEff.editable} />
                                                    </td>
                                                    <td className="p-2.5 text-center border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                                                        <button
                                                            onClick={() => copyFieldXml(dfField)}
                                                            className="p-1.5 rounded hover:bg-[color-mix(in_srgb,var(--color-primary),transparent_85%)] text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] transition-colors"
                                                            title={generateFieldXml(dfField)}
                                                        >
                                                            {copiedField === dfField.name
                                                                ? <Check size={14} className="text-green-500" />
                                                                : <Copy size={14} />
                                                            }
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })()}
                                    </React.Fragment>
                                );
                            })}
                            {sortedFields.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="p-6 text-center text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)]">
                                        No fields found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex justify-between items-center shrink-0 text-[11px] text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)]">
                    <div className="flex items-center gap-3">
                        <span>{sortedFields.length} fields</span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            {sortedFields.filter(f => !f.nillable).length} required
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {Object.keys(profilePerms).length} profile perms
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                            {Object.keys(permSetPerms).length} permset perms
                        </span>
                    </div>
                    <button
                        onClick={() => setShowXmlModal(true)}
                        disabled={selectedFields.size === 0}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${selectedFields.size > 0
                            ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm cursor-pointer'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <Code size={13} />
                        Generate XML ({selectedFields.size})
                    </button>
                </div>
            </div>

            {/* Bulk XML Modal */}
            {showXmlModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowXmlModal(false)}>
                    <div
                        className="bg-[var(--color-surface)] dark:bg-[#1E1E1E] rounded-xl shadow-2xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] w-[90%] max-w-[700px] max-h-[80vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-4 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Code size={18} className="text-[var(--color-primary)]" />
                                <h3 className="text-sm font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-dark-primary)]">
                                    Generated XML — {selectedFields.size} Fields
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={copyBulkXml}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-md text-[11px] font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
                                >
                                    {xmlCopied ? <Check size={13} /> : <Copy size={13} />}
                                    {xmlCopied ? 'Copied!' : 'Copy Tab'}
                                </button>
                                <button
                                    onClick={copyAllXml}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-md text-[11px] font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
                                >
                                    {xmlCopied ? <Check size={13} /> : <Copy size={13} />}
                                    Copy Both
                                </button>
                                <button
                                    onClick={() => setShowXmlModal(false)}
                                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#333] text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                        {/* Tabs */}
                        <div className="flex border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] shrink-0">
                            <button
                                onClick={() => setXmlTab('profile')}
                                className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${xmlTab === 'profile'
                                    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary),transparent_95%)]'
                                    : 'text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'
                                    }`}
                            >
                                Profile
                            </button>
                            <button
                                onClick={() => setXmlTab('permset')}
                                className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${xmlTab === 'permset'
                                    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary),transparent_95%)]'
                                    : 'text-[var(--color-text-secondary)] dark:text-[var(--color-text-dark-secondary)] hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'
                                    }`}
                            >
                                Permission Set
                            </button>
                        </div>
                        {/* Modal Body */}
                        <div className="flex-1 overflow-auto p-4 min-h-0">
                            <pre className="text-[11px] font-mono leading-relaxed text-[var(--color-text-primary)] dark:text-[var(--color-text-dark-primary)] bg-gray-50 dark:bg-[#121212] rounded-lg p-4 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] whitespace-pre-wrap break-all">
                                {generateBulkXml(xmlTab)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

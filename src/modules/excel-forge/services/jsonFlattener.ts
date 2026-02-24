/**
 * Recursively flattens nested objects.
 * Flattens array indexing as well, or limits to objects. 
 * SOQL usually returns arrays of objects. We typically want to flatten relation fields like:
 * Account: { Name: 'Acme', Owner: { Name: 'John' } } -> Account.Name, Account.Owner.Name
 * 
 * Max depth is specified to prevent callstack size exceeded on huge recursive outputs.
 */

export const flattenObject = (obj: any, maxDepth: number = 5): Record<string, any> => {
    const result: Record<string, any> = {};

    const processNode = (node: any, currentPrefix: string, currentDepth: number) => {
        if (currentDepth > maxDepth) return;

        // Handle null or undefined
        if (node === null || node === undefined) {
            result[currentPrefix] = node;
            return;
        }

        if (typeof node === 'object' && !Array.isArray(node)) {
            // It's an object, iterate keys
            for (const key of Object.keys(node)) {
                // Exclude Salesforce attributes payload if present
                if (key === 'attributes') continue;

                const newPrefix = currentPrefix ? `${currentPrefix}.${key}` : key;

                // Check if nested is also object
                if (typeof node[key] === 'object' && node[key] !== null && !Array.isArray(node[key])) {
                    processNode(node[key], newPrefix, currentDepth + 1);
                } else {
                    // Array or primitive
                    // For simplicity in Excel Mapping, we only extract primitives. Nested arrays (child relations) 
                    // are too complex to map to a single column typically. We stringify arrays or ignore.
                    if (Array.isArray(node[key])) {
                        result[newPrefix] = JSON.stringify(node[key]);
                    } else {
                        result[newPrefix] = node[key];
                    }
                }
            }
        } else {
            // Root was primitive or array (shouldn't happen with root SOQL record, but just in case)
            result[currentPrefix] = node;
        }
    };

    processNode(obj, '', 1);
    return result;
};

/**
 * Given an array of objects (SOQL records), returns a list of all unique flattened keys.
 */
export const extractAllFlattenedKeys = (data: any[]): string[] => {
    const keysSet = new Set<string>();

    data.forEach(record => {
        const flat = flattenObject(record);
        Object.keys(flat).forEach(key => keysSet.add(key));
    });

    return Array.from(keysSet).sort();
};

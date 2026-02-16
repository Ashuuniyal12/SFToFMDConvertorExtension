
// @ts-nocheck
// Mock chrome global
global.chrome = {
    storage: {
        local: {
            get: async () => ({}),
            set: async () => { },
        }
    }
} as any;

// Use relative path from scripts folder to src
import { MappingEngine } from '../src/utils/mappingEngine';
import { SalesforceField } from '../src/types';

const engine = new MappingEngine();

const testCases = [
    // Text Data Types
    { type: 'string', expected: 'STRING', name: 'Text' },
    { type: 'textarea', expected: 'STRING', name: 'Text Area' },
    { type: 'email', expected: 'STRING', name: 'Email' },
    { type: 'url', expected: 'STRING', name: 'URL' },
    { type: 'phone', expected: 'STRING', name: 'Phone' },
    { type: 'picklist', expected: 'STRING', name: 'Picklist' },
    { type: 'multipicklist', expected: 'STRING', name: 'Multi-Select Picklist' },
    { type: 'reference', expected: 'STRING', name: 'Lookup' },

    // Number Data Types - User requested FLOAT for all
    { type: 'double', expected: 'FLOAT', name: 'Double' },
    { type: 'int', expected: 'FLOAT', name: 'Integer' },
    { type: 'currency', expected: 'FLOAT', name: 'Currency' },
    { type: 'percent', expected: 'FLOAT', name: 'Percent' },

    // Date & Time Data Types - User requested TIMESTAMP for all
    { type: 'date', expected: 'TIMESTAMP', name: 'Date' },
    { type: 'datetime', expected: 'TIMESTAMP', name: 'Date/Time' },
    { type: 'time', expected: 'TIMESTAMP', name: 'Time' },

    // Boolean
    { type: 'boolean', expected: 'BOOLEAN', name: 'Checkbox' },

    // Missing
    { type: 'id', expected: 'STRING', name: 'Id' },
    { type: 'base64', expected: 'STRING', name: 'Base64' },
    { type: 'address', expected: 'STRING', name: 'Address' },
    { type: 'location', expected: 'STRING', name: 'Location' },
];

async function runTests() {
    console.log("Running Mapping Tests...");
    let passed = 0;
    let failed = 0;

    for (const test of testCases) {
        const field: SalesforceField = {
            name: 'TestField',
            label: 'Test Field',
            type: test.type
        } as any;

        const result = engine.mapField(field, 'TestObject');
        const actual = result.targetType;

        if (actual === test.expected) {
            console.log(`[PASS] ${test.name} (${test.type}) -> ${actual}`);
            passed++;
        } else {
            console.log(`[FAIL] ${test.name} (${test.type}) -> Expected ${test.expected}, Got ${actual}`);
            failed++;
        }
    }

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
}

runTests();

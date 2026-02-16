
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
    {
        name: 'Currency with Precision',
        field: {
            name: 'Amount',
            type: 'currency',
            precision: 18,
            scale: 2
        } as SalesforceField,
        expectedSourceType: 'currency(16,2)' // 18 - 2 = 16
    },
    {
        name: 'Double with High Scale',
        field: {
            name: 'Rate',
            type: 'double',
            precision: 18,
            scale: 15
        } as SalesforceField,
        expectedSourceType: 'double(3,15)' // 18 - 15 = 3 (User scenario)
    },
    {
        name: 'Percent with Default Scale',
        field: {
            name: 'Probability',
            type: 'percent',
            precision: 5
            // scale undefined -> 0
        } as SalesforceField,
        expectedSourceType: 'percent(5,0)' // 5 - 0 = 5
    },
    {
        name: 'Integer with Default Precision',
        field: {
            name: 'Count',
            type: 'int',
            // precision undefined -> 18
            scale: 0
        } as SalesforceField,
        expectedSourceType: 'int(18,0)' // 18 - 0 = 18
    },
    {
        name: 'Text Field (No Precision)',
        field: {
            name: 'Name',
            type: 'string',
            length: 255
        } as SalesforceField,
        expectedSourceType: 'string'
    }
];

async function runTests() {
    console.log("Running Numeric Precision Tests...");
    let passed = 0;
    let failed = 0;

    for (const test of testCases) {
        const result = engine.mapField(test.field, 'TestObject');
        const actual = result.sourceType;

        if (actual === test.expectedSourceType) {
            console.log(`[PASS] ${test.name}: ${actual}`);
            passed++;
        } else {
            console.log(`[FAIL] ${test.name}: Expected '${test.expectedSourceType}', Got '${actual}'`);
            failed++;
        }
    }

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
}

runTests();

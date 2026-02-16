
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
        name: 'Lookup Field',
        field: {
            name: 'AccountId',
            label: 'Account ID',
            type: 'reference',
            referenceTo: ['Account']
        } as SalesforceField,
        expectedSourceType: 'Lookup(Account)'
    },
    {
        name: 'Polymorphic Lookup',
        field: {
            name: 'WhoId',
            label: 'Who ID',
            type: 'reference',
            referenceTo: ['Contact', 'Lead']
        } as SalesforceField,
        expectedSourceType: 'Lookup(Contact, Lead)'
    },
    {
        name: 'Roll-Up Summary (Heuristic)',
        field: {
            name: 'TotalOpportunityAmount',
            label: 'Total Opportunity Amount',
            type: 'currency',
            calculated: true,
            calculatedFormula: null // Empty formula implies roll-up or system calc
        } as SalesforceField,
        expectedSourceType: 'Roll-Up Summary (currency)'
    },
    {
        name: 'Formula Field (Not Roll-Up)',
        field: {
            name: 'DiscountedAmount',
            label: 'Discounted Amount',
            type: 'currency',
            calculated: true,
            calculatedFormula: 'Amount * 0.9'
        } as SalesforceField,
        expectedSourceType: 'currency' // Should remain original type
    },
    {
        name: 'System Field (CreatedDate)',
        field: {
            name: 'CreatedDate',
            label: 'Created Date',
            type: 'datetime',
            calculated: true,
            calculatedFormula: null
        } as SalesforceField,
        expectedSourceType: 'datetime' // Should NOT be Roll-Up
    },
    {
        name: 'Standard Field',
        field: {
            name: 'Name',
            label: 'Name',
            type: 'string'
        } as SalesforceField,
        expectedSourceType: 'string'
    }
];

async function runTests() {
    console.log("Running Source Type Logic Tests...");
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

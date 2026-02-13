import { SalesforceDescribeResult } from '../types';

export class SalesforceApi {
    private domain: string;
    private sessionId: string;
    private apiVersion: string;

    constructor(domain: string, sessionId: string) {
        this.domain = domain;
        this.sessionId = sessionId;
        this.apiVersion = "v59.0";
    }

    async describe(objectName: string): Promise<SalesforceDescribeResult> {
        const url = `${this.domain}/services/data/${this.apiVersion}/sobjects/${objectName}/describe`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.sessionId}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Salesforce API Error: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }
    async query(soql: string): Promise<any> {
        const url = `${this.domain}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(soql)}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.sessionId}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Salesforce Query Error: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    async resolveApiName(idOrName: string): Promise<string> {
        // Check if it looks like a Custom Object ID (starts with 01I) or just a general ID pattern
        if (idOrName.startsWith('01I') || /^[a-zA-Z0-9]{15,18}$/.test(idOrName)) {
            try {
                // Try querying EntityDefinition
                // DurableId is often the ID for CustomObjects in Setup
                // Let's try DurableId match first.
                const q = `SELECT QualifiedApiName FROM EntityDefinition WHERE DurableId = '${idOrName}'`;
                const result = await this.query(q);

                if (result.records && result.records.length > 0) {
                    return result.records[0].QualifiedApiName;
                }
            } catch (e) {
                console.warn("Failed to resolve via EntityDefinition, trying CustomObject...", e);
            }
        }
        return idOrName;
    }
}

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
}

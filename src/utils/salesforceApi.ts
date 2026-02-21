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

    async describeGlobal(): Promise<any> {
        const url = `${this.domain}/services/data/${this.apiVersion}/sobjects`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.sessionId}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Salesforce Global Describe Error: ${response.status} - ${errorText}`);
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

    async getProfileFieldPermissions(objectName: string, profileName: string): Promise<Record<string, { readable: boolean, editable: boolean }>> {
        try {
            const q = `SELECT Field, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE Parent.Profile.Name = '${profileName}' AND SobjectType = '${objectName}'`;
            const result = await this.query(q);
            const perms: Record<string, { readable: boolean, editable: boolean }> = {};
            if (result.records) {
                result.records.forEach((rec: any) => {
                    // Field comes back as "ObjectName.FieldName"
                    const fieldName = rec.Field?.split('.')?.pop() || rec.Field;
                    perms[fieldName] = {
                        readable: !!rec.PermissionsRead,
                        editable: !!rec.PermissionsEdit
                    };
                });
            }
            return perms;
        } catch (e) {
            console.warn("Failed to fetch profile field permissions", e);
            return {};
        }
    }

    async getPermSetFieldPermissions(objectName: string, permSetLabel: string): Promise<Record<string, { readable: boolean, editable: boolean }>> {
        try {
            const q = `SELECT Field, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE Parent.Label = '${permSetLabel}' AND Parent.IsOwnedByProfile = false AND SobjectType = '${objectName}'`;
            const result = await this.query(q);
            const perms: Record<string, { readable: boolean, editable: boolean }> = {};
            if (result.records) {
                result.records.forEach((rec: any) => {
                    const fieldName = rec.Field?.split('.')?.pop() || rec.Field;
                    perms[fieldName] = {
                        readable: !!rec.PermissionsRead,
                        editable: !!rec.PermissionsEdit
                    };
                });
            }
            return perms;
        } catch (e) {
            console.warn("Failed to fetch permission set field permissions", e);
            return {};
        }
    }

    async getDFMappings(objectName: string): Promise<Record<string, string>> {
        try {
            const q = `SELECT Additional_Field_for_FF__c, Formula_Field_API_Name__c FROM DF_Formula_Field_Mapping__mdt WHERE Object_API_name__c = '${objectName}'`;
            const result = await this.query(q);

            const mappings: Record<string, string> = {};
            if (result.records) {
                result.records.forEach((rec: any) => {
                    if (rec.Formula_Field_API_Name__c && rec.Additional_Field_for_FF__c) {
                        mappings[rec.Formula_Field_API_Name__c] = rec.Additional_Field_for_FF__c;
                    }
                });
            }
            return mappings;
        } catch (e) {
            console.warn("Failed to fetch DF mappings (Custom Metadata might not exist)", e);
            return {};
        }
    }
}

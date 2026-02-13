class SalesforceApi {
    constructor(domain, sessionId) {
        this.domain = domain;
        this.sessionId = sessionId;
        this.apiVersion = "v59.0";
    }

    async describe(objectName) {
        // Construct the URL. Note: Lightning domains are usually 'xyz.lightning.force.com'
        // but API calls often need 'xyz.my.salesforce.com'.
        // However, modern Salesforce allows API calls against lightning domains too if CORS allows, 
        // or we use the 'my.salesforce.com' domain derived from the session.

        // Let's try relative path if we were injecting, but we are in popup.
        // We need the full URL.

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

// Export for module usage (if using modules) or global (if using script tags)
// Since we used script tags in popup.html without type="module", we attach to window.
window.SalesforceApi = SalesforceApi;

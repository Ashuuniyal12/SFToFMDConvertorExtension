// detectObject
// Listens for messages from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_OBJECT_CONTEXT") {
        const url = window.location.href;
        let objectName = null;

        // Strategy: URL Regex for Object Manager ONLY
        // /lightning/setup/ObjectManager/Account/FieldsAndRelationships/view
        const setupRegex = /\/lightning\/setup\/ObjectManager\/([a-zA-Z0-9_]+)\//;
        const match = url.match(setupRegex);

        if (match && match[1]) {
            objectName = match[1];
        }

        // Strategy 2: URL Regex for Classic (less common now but good to have)
        // Check for specific ID pattern or query param? 
        // Classic is harder, let's stick to Lightning first as per modern standards.

        sendResponse({ objectName: objectName });
    }
});

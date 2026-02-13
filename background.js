// Service Worker based Background Script

// Helper to get Session ID from cookies
async function getSessionId(domain) {
    // We need to find the specific cookie 'sid' for the salesforce domain
    try {
        const cookies = await chrome.cookies.getAll({ domain: domain, name: "sid" });
        if (cookies.length === 0) return null;
        // Return the first one (usually there's only one relevant one or we might need to filter)
        return cookies[0].value;
    } catch (e) {
        console.error("Cookie fetch error:", e);
        return null;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_SESSION_ID") {
        const urlStr = request.url;
        const urlObj = new URL(urlStr);

        // Try getting cookie by URL first (most accurate)
        chrome.cookies.getAll({ url: urlStr, name: "sid" }, (cookies) => {
            if (cookies && cookies.length > 0) {
                // Return the first found SID
                sendResponse({ sid: cookies[0].value, instanceUrl: urlObj.origin });
            } else {
                // Fallback: Check .salesforce.com domain specifically
                // This helps if we are on a visualforce page or lightning page but cookie is on root
                chrome.cookies.getAll({ domain: "salesforce.com", name: "sid" }, (sfCookies) => {
                    if (sfCookies && sfCookies.length > 0) {
                        // Construct a generic instance URL if we found a cookie on salesforce.com
                        // We'll trust the current origin first, but if that failed, maybe use the cookie domain
                        // But usually if we are on lightning, we want to try the current origin first.
                        sendResponse({ sid: sfCookies[0].value, instanceUrl: urlObj.origin });
                    } else {
                        sendResponse({ sid: null });
                    }
                });
            }
        });
        return true; // async response
    }
});

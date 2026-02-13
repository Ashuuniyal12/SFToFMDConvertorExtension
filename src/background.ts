// Service Worker based Background Script

chrome.runtime.onMessage.addListener(
    (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request: any,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void
    ) => {
        if (request.action === "GET_SESSION_ID") {
            const urlStr = request.url;
            let urlObj: URL;
            try {
                urlObj = new URL(urlStr);
            } catch (e) {
                sendResponse({ sid: null });
                return true;
            }

            chrome.cookies.getAll({ url: urlStr, name: "sid" }).then((cookies) => {
                if (cookies && cookies.length > 0) {
                    sendResponse({ sid: cookies[0].value, instanceUrl: urlObj.origin });
                } else {
                    chrome.cookies.getAll({ domain: "salesforce.com", name: "sid" }).then((sfCookies) => {
                        if (sfCookies && sfCookies.length > 0) {
                            sendResponse({
                                sid: sfCookies[0].value,
                                instanceUrl: urlObj.origin,
                            });
                        } else {
                            sendResponse({ sid: null });
                        }
                    });
                }
            });
            return true; // async response
        }
    }
);

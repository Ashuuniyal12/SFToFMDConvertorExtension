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

            let targetDomain = urlObj.hostname;
            if (targetDomain.includes('.lightning.force.com')) {
                targetDomain = targetDomain.replace('.lightning.force.com', '.my.salesforce.com');
            }

            const targetUrl = `https://${targetDomain}`;

            chrome.cookies.get({ url: targetUrl, name: "sid" }).then((cookie) => {
                if (cookie) {
                    sendResponse({ sid: cookie.value, instanceUrl: targetUrl });
                } else {
                    chrome.cookies.getAll({ name: "sid" }).then((cookies) => {
                        const apiCookie = cookies.find(c => c.domain.includes('my.salesforce.com') || c.domain.includes(targetDomain));
                        if (apiCookie) {
                            sendResponse({ sid: apiCookie.value, instanceUrl: targetUrl });
                        } else if (cookies && cookies.length > 0) {
                            sendResponse({ sid: cookies[0].value, instanceUrl: targetUrl });
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

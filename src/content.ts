// detectObject
// Listens for messages from Popup

chrome.runtime.onMessage.addListener(
    (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request: any,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void
    ) => {
        if (request.action === "GET_OBJECT_CONTEXT") {
            const url = window.location.href;
            let objectName: string | null = null;

            const setupRegex = /\/lightning\/setup\/ObjectManager\/([a-zA-Z0-9_]+)\//;
            const match = url.match(setupRegex);

            if (match && match[1]) {
                objectName = match[1];
            }

            sendResponse({ objectName });
        }
    }
);

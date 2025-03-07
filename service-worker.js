// Service worker lifecycle events
self.addEventListener('install', (event) => {
    console.log('Service worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service worker activated');
    event.waitUntil(clients.claim());
});

var redirectToLocalhost = function(request, sender, sendResponse) {
    // Replace XMLHttpRequest with fetch API which is required in service workers
    fetch(request.url, {
            method: request.method,
            headers: request.method === "POST" ? { "Content-Type": "application/json;charset=UTF-8" } : {},
            body: request.method === "POST" ? JSON.stringify(request.data) : undefined
        })
        .then(response => {
            return response.text().then(text => {
                try {
                    const data = text ? JSON.parse(text) : {};
                    if (response.ok) {
                        sendResponse({ success: true, data: data });
                    } else {
                        sendResponse({ success: false, data: data });
                    }
                } catch (ex) {
                    sendResponse({ success: false, statusText: response.statusText });
                }
            });
        })
        .catch(error => {
            sendResponse({ success: false, statusText: error.message });
        });

    return true; // Keep the message channel open
};

var senderCallback;
var port = chrome.runtime.connectNative('br.jus.trf2.assijus');
port.onMessage.addListener(function(msg) {
    console.log("got response");
    if (senderCallback !== undefined)
        senderCallback(msg);
    delete senderCallback;
});
port.onDisconnect.addListener(function() {
    console.log("Disconnected");
});

var processMessage = function(request, sender, sendResponse) {
    if (request.url.substring(request.url.length - '/test-extension'.length) == '/test-extension') {
        var version;
        try {
            version = chrome.runtime.getManifest().version;
        } catch (ex) {
            version = '1';
        }
        sendResponse({ success: true, data: { version: version } })
        return false;
    }
    senderCallback = sendResponse;
    try {
        port.postMessage(request);
    } catch (ex) {
        sendResponse({ success: false, data: { errormsg: ex.message, errordetails: [{ context: 'acessando chrome extension', service: 'native-signer', logged: false, presentable: false, stacktrace: ex.stack }] } })
        return false;
    }
    return true;
};

chrome.runtime.onMessageExternal.addListener(processMessage);
var redirectToLocalhost = function(request, sender, sendResponse) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                sendResponse({ success: true, data: JSON.parse(xhr.responseText) });
            } else {
                try {
                    var resp = JSON.parse(xhr.responseText);
                    sendResponse({ success: false, data: resp });
                } catch (ex) {
                    sendResponse({ success: false, statusText: xhr.statusText });
                }
            }
        }
    };
    xhr.open(request.method, request.url, true);
    if (request.method == "POST") {
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify(request.data));
    } else {
        xhr.send();
    }
    return true;
}

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
}

chrome.runtime.onMessageExternal.addListener(processMessage);
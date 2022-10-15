//2022 Damian Janzi
'use strict';

var appURL = (new URL("https://charles-chrome-extension-demo.bubbleapps.io/version-test/popup"));

//load popup iframe
window.onload = load_iframe();

function load_iframe() {
    var iframe = document.createElement('iframe');
    iframe.id = "ExtensioniFrame";
    iframe.src = appURL;
    iframe.style.overflow = "hidden";
    iframe.style.cssText = 'width:320px;height:640px;';
    document.body.appendChild(iframe);
}

//listen to messages from bubble plugin
//add eventlistener to listen for message form bubble plugin
window.addEventListener('message', (event) => {
    if (event.origin != "https://" + appURL.hostname) { //check that event origin is your Bubble App
        console.log("Chrome Extension: postMessage's targetOrigin not allowed, STOP.");
        return;
    }
    if (event.data) { // check that message data data is truthy (not false or null)
        var reqMessage = JSON.parse(event.data);

        // route messges to correct functions
        switch (reqMessage.requestType) {

            case "tabInfo":
                returnTabInfo();
                break;

            case "selectedText":
                returnSelectedText();
                break;

            case "showAlert":
                showAlert(reqMessage.alertText);
                break;

            case "openNewTab":
                openNewTab(reqMessage.url);
                break;

            case "openIframeModal":
                openIframeModal(reqMessage.title, reqMessage.url);
                break;

            case "openIframeSidebar":
                openIframeSidebar(reqMessage.url);
                break;

            case "closePopup":
                window.close();
                break;

            case "copyToClipboard":
                copyToClipboard(reqMessage.text);
                break;

            case "injectJS":
                injectJS(reqMessage.filename);
                break;
        }
    }
}, false);


//adding listener to messges from background.js
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch (request.type) {
            case "closePopup":
                window.close();
                break;
            default:
                console.log("Chrome Extension: unknown request type");
        }

    }
);

//functions to be called from switch-case above

//function: open iframe in Modal (send message to background.js)
function openIframeModal(title, url) {
    var msg = {
        "type": "openIframeModal",
        "title": title,
        "url": url
    };
    chrome.runtime.sendMessage(msg);
};

//function: open iframe in Sidebar (send message to background.js)
function openIframeSidebar(url) {
    var msg = {
        "type": "openIframeSidebar",
        "url": url
    };
    chrome.runtime.sendMessage(msg);
};

//inject custom javascript file
function injectJS(filename) {
    chrome.tabs.query({ //ask for tab infos
        currentWindow: true,
        active: true
    }).then(([tab]) => { //callback function: inject script into current tab
        chrome.scripting.executeScript({
            target: {
                tabId: tab.id
            },
            files: ["CustomJavaScript/" + filename]
        }, () => {
            console.log("injected javascript");
        });
    });
}


//function: return tab info
function returnTabInfo() {
    chrome.tabs.query({ //ask for tab infos
        currentWindow: true,
        active: true
    }, (tabs) => { //callback function: send data back to iFrame
        var msg = {
            "returnType": "tabInfo",
            "url": tabs[0].url,
            "title": tabs[0].title
        };
        postMessageToPlugin(msg);
    });
};

//function: return selected text
function returnSelectedText() {
    chrome.tabs.query({ //ask for tab infos
        currentWindow: true,
        active: true
    }).then(([tab]) => { //callback function: inject script into current tab
        chrome.scripting.executeScript({
            target: {
                tabId: tab.id
            },
            func: getSelection //injected function
        },
            (selection) => { //callback using retrun value from func above -> post message back to plugin
                if (selection) {
                    var msg = {
                        "returnType": "textSelection",
                        "text": selection[0].result
                    };
                    postMessageToPlugin(msg);
                }
            }
        )
    })
};
//return selected text: injection function
function getSelection() {
    return window.getSelection().toString();
};

//show alert
function showAlert(txt) {
    chrome.tabs.query({ //ask for tab infos
        currentWindow: true,
        active: true
    }).then(([tab]) => { //callback function: inject script into current tab
        chrome.scripting.executeScript({
            target: {
                tabId: tab.id
            },
            func: displayAlert, //injected function
            args: [txt] //functino arguments. no callback specified
        })
    })
};
//show alert: injection function
function displayAlert(txt) {
    alert(txt);
};

//open a new tab
function openNewTab(newURL) {
    var url = newURL;
    if (url.substring(0, 4) == "//s3") {
        url = "https:" + url;
    }
    if (url.substring(0, 8) != "https://") {
        url = "https:" + url;
    }
    chrome.tabs.create({
        url: url,
    });
};

//copy to clipboard
function copyToClipboard(txt) {
    chrome.tabs.query({ //ask for tab infos
        currentWindow: true,
        active: true
    }).then(([tab]) => { //callback function: inject script into current tab
        chrome.scripting.executeScript({
            target: {
                tabId: tab.id
            },
            func: copyToTheClipboard, //injected function
            args: [txt] //functino arguments. no callback specified
        })
    })
};
//copy to clipboared: injection function
async function copyToTheClipboard(textToCopy) {
    const el = document.createElement('textarea');
    el.value = textToCopy;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

//post message back to popup (to be used in functions below)
function postMessageToPlugin(msg) {
    var iframe = document.getElementById("ExtensioniFrame");
    var iframeWindow = (iframe.contentWindow || iframe.contentDocument);
    iframeWindow.postMessage(
        JSON.stringify(msg), "*");
};

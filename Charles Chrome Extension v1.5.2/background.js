// 2022 Damian Janzi

//uncomment lines below when the default action when clicking extension icon is to open the sidebar. Please also delete the full line '"default_popup": "popup.html",' in manifest.json and make sure there is no empty line left
// chrome.action.onClicked.addListener(() => {
//     openIframeSidebar("https://dyslexicreader.xyz/r?url=https://bubble.io/blog/improve-web-app-performance/");
// });

//uncomment lines below when the default action when clicking extension icon is to open the modal.Please also delete the full line '"default_popup": "popup.html",' in manifest.json and make sure there is no empty line left
// chrome.action.onClicked.addListener(() => {
//     openIframeModal("Dyslexic Reader", "https://dyslexicreader.xyz/r?url=https://bubble.io/blog/improve-web-app-performance/");
// });


//message listener
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch (request.type) {
            case "openIframeSidebar":
                openIframeSidebar(request.url);
                break;
            case "openIframeModal":
                openIframeModal(request.title, request.url);
                break;
            default:
                console.log("Chrome Extension: unknown request type");
        }
    }
);



//functions

//function: open iframe in Sidebar
function openIframeSidebar(url) {
    chrome.tabs.query({ //ask for tab infos
        currentWindow: true,
        active: true
    }).then(([tab]) => { //callback function: inject script into current tab
        //inject bootstrap CSS
        chrome.scripting.insertCSS({ //inject bootstrap css
            target: {
                tabId: tab.id
            },
            files: ["files/extension.css"]
        }, () => {
            chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                files: ["files/bootstrap.bundle.min.js"] //inject bootstrap js
            }, () => { //callback to open modal once injection is done
                chrome.scripting.executeScript({
                    target: {
                        tabId: tab.id
                    },
                    func: openSidebar, //injected function
                    args: [url]
                }, () => {
                    console.log("sidebar opened");
                    var msg = {
                        "type": "closePopup",
                    };
                    chrome.runtime.sendMessage(msg);
                });
            });
        });
    });
};
//open Sidebar: injection function
function openSidebar(url) {
    //if cannot find element in page
    if (document.getElementById("offCanvasRight") == null) {
        var elem = document.createElement('div');
        elem.className = 'offcanvas offcanvas-end';
        elem.id = 'offCanvasRight';
        elem.setAttribute("data-bs-scroll", "true");
        elem.setAttribute("style", "z-index: 99999;");
        elem.setAttribute("data-bs-backdrop", "false"); //set this to true to make the sidebar backdrop visible
        elem.innerHTML = '<div class="offcanvas-header">' +
            '<button type="button" class="mybtn-close mytext-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>' +
            '</div>' +
            '<div class="offcanvas-body" style="padding:0;">' +
            '<iframe class="myiframe" height="100%" width="100%" src="' + url + '"></iframe>' +
            '</div>';
        document.body.appendChild(elem);
    }
    var bsOffcanvas = new bootstrap.Offcanvas(offCanvasRight);
    bsOffcanvas.show();
    window.addEventListener('message', (event) => {
        console.log(event);
    });
};


//function: open iframe in Modal
function openIframeModal(title, url) {
    chrome.tabs.query({ //ask for tab infos
        currentWindow: true,
        active: true
    }).then(([tab]) => { //callback function: inject script into current tab
        //inject bootstrap CSS
        chrome.scripting.insertCSS({ //inject bootstrap css
            target: {
                tabId: tab.id
            },
            files: ["files/extension.css"]
        }, () => {
            chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                files: ["files/bootstrap.bundle.min.js"] //inject bootstrap js
            }, () => { //callback to open modal once injection is done
                chrome.scripting.executeScript({
                    target: {
                        tabId: tab.id
                    },
                    func: openModal, //injected function
                    args: [title, url]
                }, () => {
                    console.log("modal opened");
                    var msg = {
                        "type": "closePopup",
                    };
                    chrome.runtime.sendMessage(msg);
                });
            });
        });
    });
};
//open Modal: injection function
function openModal(title, url) {
    document.body.innerHTML += '<div class="modal fade" id="myModal" style="z-index: 99999;">' +
        '  <div class="modal-dialog modal-fullscreen">' +
        '    <div class="modal-content">' +
        '      <!-- Modal Header -->' +
        '      <div class="modal-header">' +
        '        <h4 class="modal-title">' + title + '</h4>' +
        '        <button type="button" class="mybtn-close" data-bs-dismiss="modal"></button>' +
        '      </div>' +
        '      <!-- Modal body -->' +
        '      <div class="modal-body" style="padding:0;">' +
        '        <iframe class="myiframe" height="100%" width="100%" src="' + url + '" title="description"></iframe>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    var myModal = new bootstrap.Modal(document.getElementById('myModal'))
    myModal.show();
    window.addEventListener('message', (event) => {
        console.log(event);
    });
};
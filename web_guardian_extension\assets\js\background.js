chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({
        blacklistedDomains: [],
        blacklistedUrls: [],
        whitelistedUrls: [],
        pin: '',
        isPinSet: false
    });
});
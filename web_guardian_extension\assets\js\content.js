let isLocked = true;

function checkIfShouldLock() {
    const currentUrl = window.location.href;
    const domain = window.location.hostname;

    chrome.storage.local.get(['blacklistedDomains', 'blacklistedUrls', 'whitelistedUrls', 'pin'], function(data) {
        const blacklistedDomains = data.blacklistedDomains || [];
        const blacklistedUrls = data.blacklistedUrls || [];
        const whitelistedUrls = data.whitelistedUrls || [];

        if (whitelistedUrls.some(url => currentUrl.includes(url))) {
            return;
        }

        if (blacklistedDomains.some(d => domain.includes(d)) || 
            blacklistedUrls.some(url => currentUrl.includes(url))) {
            if (isLocked) {
                showLockScreen();
            }
        }
    });
}

function lockBrowser() {
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', preventDefaultHandler, true);
    document.addEventListener('keyup', preventDefaultHandler, true);
    document.addEventListener('keypress', preventDefaultHandler, true);
    document.addEventListener('contextmenu', preventDefaultHandler, true);
    document.addEventListener('visibilitychange', preventVisibilityChange, true);
}

function unlockBrowser() {
    document.body.style.overflow = '';
    document.removeEventListener('keydown', preventDefaultHandler, true);
    document.removeEventListener('keyup', preventDefaultHandler, true);
    document.removeEventListener('keypress', preventDefaultHandler, true);
    document.removeEventListener('contextmenu', preventDefaultHandler, true);
    document.removeEventListener('visibilitychange', preventVisibilityChange, true);
}

function preventDefaultHandler(e) {
    if (e.target.id === 'web-lock-pin') return;
    e.preventDefault();
    e.stopPropagation();
    return false;
}

function preventVisibilityChange(e) {
    if (document.hidden) {
        window.focus();
    }
}

function showLockScreen() {
    const overlay = document.createElement('div');
    overlay.className = 'web-lock-overlay';
    
    overlay.innerHTML = `
        <div class="web-lock-container">
            <h2>This page is locked</h2>
            <form id="web-lock-form">
                <div class="input-group">
                    <input type="password" 
                           class="web-lock-input" 
                           id="web-lock-pin" 
                           name="pin"
                           placeholder="Enter PIN"
                           maxlength="4"
                           pattern="[0-9]*"
                           inputmode="numeric"
                           autocomplete="off"
                           required>
                    <button type="submit" class="web-lock-button unlock-btn">Go</button>
                </div>
                <button type="button" class="web-lock-button back-btn">← Back</button>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);
    const pinInput = document.getElementById('web-lock-pin');
    pinInput.focus();
    lockBrowser();

    document.querySelector('.back-btn').addEventListener('click', function() {
        unlockBrowser();
        history.back();
        overlay.remove();
    });

    document.getElementById('web-lock-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const enteredPin = pinInput.value;
        
        chrome.storage.local.get(['pin'], function(data) {
            if (enteredPin === data.pin) {
                isLocked = false;
                unlockBrowser();
                overlay.remove();
            } else {
                alert('Incorrect PIN');
                pinInput.value = '';
                pinInput.focus();
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', checkIfShouldLock);

let lastUrl = location.href; 
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        checkIfShouldLock();
    }
}).observe(document, {subtree: true, childList: true});
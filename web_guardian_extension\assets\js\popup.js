document.addEventListener('DOMContentLoaded', function() {
    const initialSetupScreen = document.getElementById('initialSetupScreen');
    const loginScreen = document.getElementById('loginScreen');
    const settingsScreen = document.getElementById('settingsScreen');

    chrome.storage.local.get(['isPinSet', 'pin'], function(data) {
        if (!data.isPinSet) {
            initialSetupScreen.style.display = 'block';
            loginScreen.style.display = 'none';
            settingsScreen.style.display = 'none';
        } else {
            initialSetupScreen.style.display = 'none';
            loginScreen.style.display = 'block';
            settingsScreen.style.display = 'none';
        }
    });

    document.getElementById('initialSetupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const pin = document.getElementById('initialPin').value;
        
        if (pin.length !== 4 || isNaN(pin)) {
            alert('PIN must be 4 digits');
            return;
        }

        chrome.storage.local.set({
            pin: pin,
            isPinSet: true
        }, function() {
            initialSetupScreen.style.display = 'none';
            loginScreen.style.display = 'block';
        });
    });

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const enteredPin = document.getElementById('loginPin').value;

        chrome.storage.local.get(['pin'], function(data) {
            if (enteredPin === data.pin) {
                loginScreen.style.display = 'none';
                settingsScreen.style.display = 'block';
                initializeSettings();
                document.getElementById('loginPin').value = '';
            } else {
                alert('Incorrect PIN');
                document.getElementById('loginPin').value = '';
            }
        });
    });
});

function initializeSettings() {
    loadLists();
    
    document.getElementById('setPinForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const newPin = document.getElementById('pinInput').value;
        
        if (newPin.length !== 4 || isNaN(newPin)) {
            alert('PIN must be 4 digits');
            return;
        }

        chrome.storage.local.set({ pin: newPin }, function() {
            alert('PIN updated successfully');
            document.getElementById('pinInput').value = '';
        });
    });

    ['Domain', 'Url', 'WhitelistUrl'].forEach(type => {
        document.getElementById(`add${type}Form`).addEventListener('submit', function(e) {
            e.preventDefault();
            const input = document.getElementById(`${type.toLowerCase()}Input`);
            const value = input.value.trim();
            
            if (value) {
                addToList(type.toLowerCase(), value);
                input.value = '';
            }
        });
    });
}

function addToList(type, value) {
    const storageKey = type === 'domain' ? 'blacklistedDomains' : 
                      type === 'url' ? 'blacklistedUrls' : 'whitelistedUrls';
    
    chrome.storage.local.get([storageKey], function(data) {
        const list = data[storageKey] || [];
        if (!list.includes(value)) {
            list.push(value);
            chrome.storage.local.set({ [storageKey]: list }, function() {
                updateList(type, list);
            });
        }
    });
}

function removeFromList(type, value) {
    const storageKey = type === 'domain' ? 'blacklistedDomains' : 
                      type === 'url' ? 'blacklistedUrls' : 'whitelistedUrls';
    
    chrome.storage.local.get([storageKey], function(data) {
        const list = data[storageKey] || [];
        const index = list.indexOf(value);
        if (index > -1) {
            list.splice(index, 1);
            chrome.storage.local.set({ [storageKey]: list }, function() {
                updateList(type, list);
            });
        }
    });
}

function updateList(type, items) {
    const list = document.getElementById(`${type}List`);
    list.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        const removeButton = document.createElement('button');
        removeButton.textContent = '×';
        removeButton.onclick = () => removeFromList(type, item);
        li.appendChild(removeButton);
        list.appendChild(li);
    });
}

function loadLists() {
    chrome.storage.local.get(['blacklistedDomains', 'blacklistedUrls', 'whitelistedUrls'], function(data) {
        updateList('domain', data.blacklistedDomains || []);
        updateList('url', data.blacklistedUrls || []);
        updateList('whitelisturl', data.whitelistedUrls || []);
    });
}
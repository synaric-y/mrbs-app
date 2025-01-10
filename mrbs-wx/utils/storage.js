/**
 * Storage二次封装
 */

// Sets an item with a Key to local storage
const saveStorage = function(key, data) {
    localStorage.setItem(key, data);
};

// Looks for a local storage item and returns if present
const getStorage = function(key) {
    return localStorage.getItem(key)
};

// Clear a single item or the whole local storage
const clearStorage = function(key='false') {
    if(key) {
        localStorage.removeItem(key);
    } else {
        localStorage.clear();
    }
}

// Exports all available functions on the script
export {getStorage, saveStorage, clearStorage}




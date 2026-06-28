import { Logger } from '../services/logger.js';

/**
 * Storage Manager
 * Safely handles application data persistence using LocalStorage with custom prefixes and memory fallbacks.
 */
class StorageManagerService {
    constructor(prefix = 'mission_runner_') {
        this.prefix = prefix;
        this.memoryStore = new Map();
        this.isLocalStorageAvailable = this._checkLocalStorage();
    }

    _checkLocalStorage() {
        try {
            const testKey = `${this.prefix}test_sync_check`;
            localStorage.setItem(testKey, 'ok');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            Logger.warn('StorageManager', 'LocalStorage not accessible, falling back to memory store.');
            return false;
        }
    }

    _prefixKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Get a value from persistence.
     * @param {string} key 
     * @param {any} defaultValue 
     */
    get(key, defaultValue = null) {
        const prefixed = this._prefixKey(key);
        if (this.isLocalStorageAvailable) {
            try {
                const item = localStorage.getItem(prefixed);
                if (item === null) return defaultValue;
                return JSON.parse(item);
            } catch (err) {
                Logger.error('StorageManager', `Failed parsing key: "${key}"`, err);
                return defaultValue;
            }
        } else {
            return this.memoryStore.has(key) ? this.memoryStore.get(key) : defaultValue;
        }
    }

    /**
     * Save a value to persistence.
     * @param {string} key 
     * @param {any} value 
     */
    set(key, value) {
        const prefixed = this._prefixKey(key);
        if (this.isLocalStorageAvailable) {
            try {
                localStorage.setItem(prefixed, JSON.stringify(value));
            } catch (err) {
                Logger.error('StorageManager', `Failed writing key: "${key}"`, err);
            }
        } else {
            this.memoryStore.set(key, value);
        }
    }

    /**
     * Remove a key from persistence.
     * @param {string} key 
     */
    remove(key) {
        const prefixed = this._prefixKey(key);
        if (this.isLocalStorageAvailable) {
            localStorage.removeItem(prefixed);
        } else {
            this.memoryStore.delete(key);
        }
    }

    /**
     * Clears all keys belonging to this namespace.
     */
    clear() {
        if (this.isLocalStorageAvailable) {
            try {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                for (const key of keysToRemove) {
                    localStorage.removeItem(key);
                }
                Logger.info('StorageManager', `Cleared ${keysToRemove.length} items with prefix ${this.prefix}`);
            } catch (err) {
                Logger.error('StorageManager', 'Error during local storage clear.', err);
            }
        } else {
            this.memoryStore.clear();
        }
    }
}

export const StorageManager = new StorageManagerService();

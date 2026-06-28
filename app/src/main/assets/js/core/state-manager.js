import { Logger } from '../services/logger.js';
import { StorageManager } from './storage-manager.js';
import { EventBus } from './event-bus.js';

/**
 * Core State Manager
 * Holds visual/system states and manages responsive reactivity across modules.
 */
class StateManagerService {
    constructor() {
        this.state = {
            theme: StorageManager.get('theme', 'dark'),
            sidebarExpanded: StorageManager.get('sidebar_expanded', true),
            missions: StorageManager.get('missions', [
                { id: 'm-1', title: 'Initialize Quantum Engine', status: 'completed', urgency: 'high', operator: 'A. Vance', updated: '2026-06-28 02:10' },
                { id: 'm-2', title: 'Calibrate Primary Phasers', status: 'in-progress', urgency: 'medium', operator: 'L. Croft', updated: '2026-06-28 03:45' },
                { id: 'm-3', title: 'Scan Sector 4 Sector Log', status: 'pending', urgency: 'low', operator: 'J. Shepard', updated: '2026-06-28 01:15' }
            ]),
            activeMissionId: null,
            user: {
                name: 'Commander Maverick',
                role: 'Flight Operations Lead',
                status: 'Active'
            }
        };

        this.subscribers = new Set();
        this.pathSubscribers = new Map();
    }

    /**
     * Get a copy of the entire current state.
     */
    getState() {
        // Deep copy to prevent outside mutability
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Set state values.
     * @param {Object} updates 
     */
    setState(updates) {
        Logger.debug('StateManager', 'Updating state with keys:', Object.keys(updates));
        const prevState = this.getState();
        
        // Apply updates
        for (const [key, val] of Object.entries(updates)) {
            if (this.state[key] !== undefined) {
                this.state[key] = val;
                
                // Persistence side-effects
                if (['theme', 'sidebarExpanded', 'missions'].includes(key)) {
                    StorageManager.set(
                        key === 'sidebarExpanded' ? 'sidebar_expanded' : key, 
                        val
                    );
                }

                // Notify specific path subscribers
                this._notifyPath(key, val, prevState[key]);
            } else {
                // Support dynamic key addition safely
                this.state[key] = val;
                this._notifyPath(key, val, null);
            }
        }

        // Notify global subscribers
        this._notifyAll(this.getState(), prevState);
        EventBus.publish('state-changed', { current: this.getState(), previous: prevState });
    }

    /**
     * Subscribe to any state change.
     * @param {Function} callback 
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * Subscribe to updates on a specific top-level key.
     * @param {string} key 
     * @param {Function} callback 
     */
    subscribeToKey(key, callback) {
        if (!this.pathSubscribers.has(key)) {
            this.pathSubscribers.set(key, new Set());
        }
        this.pathSubscribers.get(key).add(callback);
        return () => {
            const list = this.pathSubscribers.get(key);
            if (list) {
                list.delete(callback);
                if (list.size === 0) this.pathSubscribers.delete(key);
            }
        };
    }

    _notifyAll(current, previous) {
        for (const callback of this.subscribers) {
            try {
                callback(current, previous);
            } catch (err) {
                Logger.error('StateManager', 'Error in global state subscriber:', err);
            }
        }
    }

    _notifyPath(key, value, previousValue) {
        const list = this.pathSubscribers.get(key);
        if (list) {
            for (const callback of list) {
                try {
                    callback(value, previousValue);
                } catch (err) {
                    Logger.error('StateManager', `Error in key subscriber for: "${key}"`, err);
                }
            }
        }
    }
}

export const StateManager = new StateManagerService();

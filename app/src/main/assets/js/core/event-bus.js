import { Logger } from '../services/logger.js';

/**
 * Core Event Bus
 * Facilitates pub-sub message passing across disparate UI and system modules.
 */
class EventBusService {
    constructor() {
        this.subscriptions = new Map();
    }

    /**
     * Subscribe to a specific event.
     * @param {string} eventName 
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    subscribe(eventName, callback) {
        if (!this.subscriptions.has(eventName)) {
            this.subscriptions.set(eventName, new Set());
        }
        
        const subscribers = this.subscriptions.get(eventName);
        subscribers.add(callback);

        Logger.debug('EventBus', `Subscribed callback to event: "${eventName}". Total: ${subscribers.size}`);

        // Return a cleanup/unsubscribe function
        return () => {
            const currentSubscribers = this.subscriptions.get(eventName);
            if (currentSubscribers) {
                currentSubscribers.delete(callback);
                if (currentSubscribers.size === 0) {
                    this.subscriptions.delete(eventName);
                }
                Logger.debug('EventBus', `Unsubscribed callback from event: "${eventName}"`);
            }
        };
    }

    /**
     * Publish an event to all active subscribers.
     * @param {string} eventName 
     * @param {any} data 
     */
    publish(eventName, data) {
        Logger.debug('EventBus', `Publishing event: "${eventName}"`, data);
        
        const subscribers = this.subscriptions.get(eventName);
        if (!subscribers || subscribers.size === 0) {
            return;
        }

        for (const callback of subscribers) {
            try {
                callback(data);
            } catch (err) {
                Logger.error('EventBus', `Error executing subscription callback for "${eventName}"`, err);
            }
        }
    }
}

export const EventBus = new EventBusService();

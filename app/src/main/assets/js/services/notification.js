import { Logger } from './logger.js';
import { EventBus } from '../core/event-bus.js';

/**
 * Notification System
 * Generates lightweight, beautifully-animated toast notifications in a screen-space overlay.
 */
class NotificationService {
    constructor() {
        this.containerId = 'toast-notification-dock';
        this.container = null;
        this.initialized = false;
    }

    /**
     * Set up the visual viewport dock for stacking toasts.
     */
    init() {
        if (this.initialized) return;

        this.container = document.createElement('div');
        this.container.id = this.containerId;
        this.container.className = 'toast-notification-dock';
        
        // Append container directly into body
        document.body.appendChild(this.container);
        this.initialized = true;
        Logger.info('NotificationService', 'Visual notification dock mounted to body.');
    }

    /**
     * Display a success notification toast.
     * @param {string} msg 
     * @param {number} duration 
     */
    success(msg, duration = 4000) {
        this.show(msg, 'success', 'check_circle', duration);
    }

    /**
     * Display an info notification toast.
     * @param {string} msg 
     * @param {number} duration 
     */
    info(msg, duration = 4000) {
        this.show(msg, 'info', 'info', duration);
    }

    /**
     * Display a warning notification toast.
     * @param {string} msg 
     * @param {number} duration 
     */
    warn(msg, duration = 5000) {
        this.show(msg, 'warning', 'warning', duration);
    }

    /**
     * Display an error notification toast.
     * @param {string} msg 
     * @param {number} duration 
     */
    error(msg, duration = 6000) {
        this.show(msg, 'error', 'dangerous', duration);
    }

    /**
     * Show a custom styled toast notification.
     * @param {string} message 
     * @param {string} type 'success' | 'info' | 'warning' | 'error'
     * @param {string} iconName Material icon symbol string
     * @param {number} duration 
     */
    show(message, type = 'info', iconName = 'info', duration = 4000) {
        if (!this.initialized) {
            this.init();
        }

        Logger.debug('NotificationService', `Pushing toast alert of type "${type}": "${message}"`);

        const toast = document.createElement('div');
        toast.className = `toast-entry toast-${type}`;
        toast.setAttribute('role', 'alert');
        
        toast.innerHTML = `
            <span class="material-symbols-outlined toast-icon">${iconName}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close-btn" aria-label="Dismiss Notification">
                <span class="material-symbols-outlined">close</span>
            </button>
        `;

        // Slide/fade in entry animation support
        this.container.appendChild(toast);
        
        // Setup manual dismissal
        const closeBtn = toast.querySelector('.toast-close-btn');
        closeBtn.addEventListener('click', () => {
            this._dismiss(toast);
        });

        // Setup auto dismissal timer
        const timer = setTimeout(() => {
            this._dismiss(toast);
        }, duration);

        // Store timer to prevent memory leaks if dismissed early
        toast._dismissTimer = timer;

        // Publish event for global tracing if required
        EventBus.publish('notification-published', { message, type, timestamp: new Date() });
    }

    _dismiss(toast) {
        if (toast._dismissing) return;
        toast._dismissing = true;
        
        if (toast._dismissTimer) {
            clearTimeout(toast._dismissTimer);
        }

        // Add visual fade out
        toast.classList.add('toast-exit');
        
        // Wait for visual transition before removing from DOM
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }
}

export const Notification = new NotificationService();

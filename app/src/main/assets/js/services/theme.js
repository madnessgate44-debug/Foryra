import { Logger } from './logger.js';
import { StateManager } from '../core/state-manager.js';
import { EventBus } from '../core/event-bus.js';

/**
 * Theme Manager Service
 * Manages active themes, modifies body classes, and syncs theme overrides.
 */
class ThemeManagerService {
    constructor() {
        this.currentTheme = 'dark';
    }

    /**
     * Set up theme using persisted preferences.
     */
    init() {
        const initialTheme = StateManager.getState().theme || 'dark';
        this.setTheme(initialTheme);
        Logger.info('ThemeManager', `Theme engine initialized. Default: "${initialTheme}"`);

        // Respond to State Manager updates proactively
        StateManager.subscribeToKey('theme', (theme) => {
            if (theme !== this.currentTheme) {
                this.setTheme(theme);
            }
        });
    }

    /**
     * Update active system theme.
     * @param {string} theme 'dark' | 'light'
     */
    setTheme(theme) {
        if (theme !== 'dark' && theme !== 'light') {
            Logger.warn('ThemeManager', `Unrecognized theme identifier: "${theme}". Defaulting to dark.`);
            theme = 'dark';
        }

        Logger.info('ThemeManager', `Transitioning theme to: "${theme}"`);
        
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.classList.remove('theme-light');
            root.classList.add('theme-dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('theme-dark');
            root.classList.add('theme-light');
            root.style.colorScheme = 'light';
        }

        this.currentTheme = theme;
        
        // Notify any non-state listeners
        EventBus.publish('theme-applied', { theme });
    }

    /**
     * Quick toggle helper.
     */
    toggle() {
        const next = this.currentTheme === 'dark' ? 'light' : 'dark';
        StateManager.setState({ theme: next });
    }

    getTheme() {
        return this.currentTheme;
    }
}

export const ThemeManager = new ThemeManagerService();

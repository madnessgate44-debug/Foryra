import { Logger } from '../services/logger.js';
import { EventBus } from './event-bus.js';

/**
 * Hash-Based Client Router
 * Handles address-bar hash changes, path parameter extractions, and route-handling workflows.
 */
class RouterService {
    constructor() {
        this.routes = [];
        this.defaultRoute = '#/dashboard';
        this.isStarted = false;

        this._onHashChange = this._onHashChange.bind(this);
    }

    /**
     * Add a route with a matching handler callback.
     * @param {string} path Example: '#/dashboard' or '#/mission/:id'
     * @param {Function} callback Callback handler
     */
    add(path, callback) {
        // Build regex for parameter extraction
        // Replaces ':param' with '([^/]+)' group
        const pattern = path
            .replace(/:\w+/g, '([^/]+)')
            .replace(/\//g, '\\/');
        
        const regex = new RegExp(`^${pattern}$`);
        
        // Extract parameter keys
        const paramKeys = (path.match(/:\w+/g) || []).map(key => key.substring(1));

        this.routes.push({ path, regex, paramKeys, callback });
        Logger.debug('Router', `Route registered: "${path}"`);
    }

    /**
     * Programmatically navigate to a path.
     * @param {string} path 
     */
    navigate(path) {
        if (!path.startsWith('#')) {
            path = '#' + path;
        }
        Logger.info('Router', `Navigating to: "${path}"`);
        window.location.hash = path;
    }

    /**
     * Start the routing listener.
     */
    start() {
        if (this.isStarted) return;
        
        window.addEventListener('hashchange', this._onHashChange);
        this.isStarted = true;
        Logger.info('Router', 'Router started listening to hash changes.');

        // Route the initial state
        this._onHashChange();
    }

    /**
     * Stop the routing listener.
     */
    stop() {
        if (!this.isStarted) return;
        window.removeEventListener('hashchange', this._onHashChange);
        this.isStarted = false;
        Logger.info('Router', 'Router stopped listening to hash changes.');
    }

    _onHashChange() {
        const hash = window.location.hash || this.defaultRoute;
        
        Logger.debug('Router', `Hash change event detected: "${hash}"`);

        // Check for matches
        let matched = false;
        for (const route of this.routes) {
            const match = hash.match(route.regex);
            if (match) {
                matched = true;
                
                // Extract parameters
                const params = {};
                route.paramKeys.forEach((key, index) => {
                    params[key] = decodeURIComponent(match[index + 1]);
                });

                Logger.info('Router', `Route matched: "${route.path}"`, params);
                
                try {
                    route.callback(params);
                    EventBus.publish('route-changed', { path: route.path, params, hash });
                } catch (err) {
                    Logger.error('Router', `Error executing route handler for: "${route.path}"`, err);
                }
                break;
            }
        }

        if (!matched) {
            Logger.warn('Router', `No matching route found for: "${hash}". Falling back to default.`);
            this.navigate(this.defaultRoute);
        }
    }
}

export const Router = new RouterService();

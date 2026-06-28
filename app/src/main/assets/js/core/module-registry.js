import { Logger } from '../services/logger.js';

/**
 * Core Module Registry
 * Manages modular micro-frontend components, routing links, and uniform lifecycles.
 */
class ModuleRegistryService {
    constructor() {
        this.modules = new Map();
        this.activeModuleId = null;
    }

    /**
     * Register a new application module.
     * @param {string} id Unique identifier for the module
     * @param {Object} moduleInstance Object implementing init(), mount(), unmount()
     */
    register(id, moduleInstance) {
        if (this.modules.has(id)) {
            Logger.warn('ModuleRegistry', `Module already registered with ID: "${id}". Overwriting.`);
        }
        
        // Ensure standard lifecycle contracts are present
        if (typeof moduleInstance.init !== 'function' || 
            typeof moduleInstance.mount !== 'function' || 
            typeof moduleInstance.unmount !== 'function') {
            throw new Error(`Module "${id}" does not conform to the lifecycle API specification.`);
        }

        this.modules.set(id, moduleInstance);
        Logger.info('ModuleRegistry', `Module registered successfully: "${id}"`);
    }

    /**
     * Retrieve a module by its identifier.
     * @param {string} id 
     */
    getModule(id) {
        return this.modules.get(id);
    }

    /**
     * Initialize all registered modules.
     */
    async initAll() {
        Logger.info('ModuleRegistry', 'Initializing all registered modules...');
        for (const [id, mod] of this.modules.entries()) {
            try {
                await mod.init();
                Logger.debug('ModuleRegistry', `Initialized module: "${id}"`);
            } catch (err) {
                Logger.error('ModuleRegistry', `Failed to initialize module: "${id}"`, err);
            }
        }
    }

    /**
     * Mount and display a module into a targeted container element.
     * @param {string} id 
     * @param {HTMLElement} container 
     */
    async activate(id, container) {
        if (!this.modules.has(id)) {
            Logger.error('ModuleRegistry', `Cannot activate non-existent module: "${id}"`);
            return false;
        }

        // Unmount current active module
        if (this.activeModuleId) {
            const currentMod = this.modules.get(this.activeModuleId);
            try {
                Logger.debug('ModuleRegistry', `Unmounting active module: "${this.activeModuleId}"`);
                await currentMod.unmount();
            } catch (err) {
                Logger.error('ModuleRegistry', `Failed to gracefully unmount module: "${this.activeModuleId}"`, err);
            }
        }

        // Mount new active module
        const nextMod = this.modules.get(id);
        try {
            Logger.info('ModuleRegistry', `Mounting module: "${id}"`);
            container.innerHTML = ''; // Safely clear out Workspace Area
            await nextMod.mount(container);
            this.activeModuleId = id;
            return true;
        } catch (err) {
            Logger.error('ModuleRegistry', `Failed to mount module: "${id}"`, err);
            container.innerHTML = `
                <div class="error-boundary-pane">
                    <h3>Module Load Failure</h3>
                    <p>An unexpected error occurred while loading "${id}".</p>
                    <pre>${err.message}</pre>
                </div>
            `;
            return false;
        }
    }

    getActiveModuleId() {
        return this.activeModuleId;
    }
}

export const ModuleRegistry = new ModuleRegistryService();

import { Logger } from './services/logger.js';
import { StateManager } from './core/state-manager.js';
import { StorageManager } from './core/storage-manager.js';
import { EventBus } from './core/event-bus.js';
import { Router } from './core/router.js';
import { ModuleRegistry } from './core/module-registry.js';
import { ThemeManager } from './services/theme.js';
import { Notification } from './services/notification.js';
import { Shell } from './ui/shell.js';

// Import Screens/Modules
import { Dashboard } from './modules/dashboard.js';
import { Settings } from './modules/settings.js';

/**
 * Main Application Bootstrapper
 * Orchestrates foundation system loading and screen mounting.
 */
async function bootstrap() {
    try {
        // 1. Initialize Logger
        Logger.info('CoreBootstrap', 'Starting Mission Runner Core...');

        // 2. Initialize Theme Manager
        ThemeManager.init();

        // 3. Initialize Visual Toast Notification Dock
        Notification.init();

        // 4. Initialize Core Shell Layout UI
        Shell.init();
        const workspaceViewport = Shell.getWorkspaceViewport();

        // 5. Register Micro-Frontend Modules
        ModuleRegistry.register('dashboard', Dashboard);
        ModuleRegistry.register('settings', Settings);

        // 6. Initialize registered modules
        await ModuleRegistry.initAll();

        // 7. Configure Route Bindings
        Router.add('#/dashboard', async () => {
            await ModuleRegistry.activate('dashboard', workspaceViewport);
        });

        Router.add('#/settings', async () => {
            await ModuleRegistry.activate('settings', workspaceViewport);
        });

        // Setup fallback or default redirection route
        Router.defaultRoute = '#/dashboard';

        // 8. Start Router Engine
        Router.start();

        Logger.info('CoreBootstrap', 'Mission Runner Booted Successfully.');
        Notification.success('Mission Runner Node Online.');

    } catch (err) {
        console.error('CRITICAL BOOT ERROR:', err);
        
        // Render fallback emergency error screen if layout shell fails
        const root = document.getElementById('app-shell-root');
        if (root) {
            root.innerHTML = `
                <div class="emergency-crash-screen">
                    <span class="material-symbols-outlined text-danger text-large">system_update_alt</span>
                    <h2>System Initialization Failure</h2>
                    <p>A fatal error occurred while starting the application shell services.</p>
                    <pre>${err.stack || err.message}</pre>
                    <button onclick="window.location.reload()" class="sys-btn sys-btn-primary" style="margin-top: 1rem;">
                        Force Reboot
                    </button>
                </div>
            `;
        }
    }
}

// Kick off bootstrap when document DOM Content is fully loaded
document.addEventListener('DOMContentLoaded', bootstrap);
export { bootstrap };

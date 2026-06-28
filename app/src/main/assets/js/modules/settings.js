import { Logger } from '../services/logger.js';
import { StateManager } from '../core/state-manager.js';
import { StorageManager } from '../core/storage-manager.js';
import { Notification } from '../services/notification.js';

/**
 * Settings Module
 * Standard micro-frontend module for system settings and real-time logs.
 */
class SettingsModule {
    constructor() {
        this.container = null;
        this.logUnsubscribe = null;
        this.stateUnsubscribe = null;
    }

    async init() {
        Logger.info('SettingsModule', 'Settings module initialized.');
    }

    async mount(container) {
        this.container = container;
        Logger.info('SettingsModule', 'Mounting Settings screen...');
        this._render();
        this._setupListeners();
    }

    async unmount() {
        Logger.info('SettingsModule', 'Unmounting Settings screen...');
        
        // Clean up event/state subscriptions to prevent memory leaks
        if (this.logUnsubscribe) {
            this.logUnsubscribe();
            this.logUnsubscribe = null;
        }
        if (this.stateUnsubscribe) {
            this.stateUnsubscribe();
            this.stateUnsubscribe = null;
        }
        this.container = null;
    }

    _render() {
        const state = StateManager.getState();
        this.container.innerHTML = `
            <div class="settings-viewport">
                <!-- Page Title -->
                <div class="view-header">
                    <div class="header-icon-wrap">
                        <span class="material-symbols-outlined header-icon">settings</span>
                    </div>
                    <div>
                        <h2 class="view-title">System Settings</h2>
                        <p class="view-subtitle">Adjust parameters and view real-time diagnostic console streams.</p>
                    </div>
                </div>

                <!-- Settings Grid -->
                <div class="settings-grid">
                    <!-- Column 1: Control panels -->
                    <div class="settings-card-stack">
                        <!-- Appearance Section -->
                        <div class="app-card">
                            <h3 class="card-title">Appearance & Aesthetics</h3>
                            <p class="card-desc">Configure visual styling interfaces for high contrast operations.</p>
                            
                            <div class="control-group">
                                <label class="control-label">System Theme</label>
                                <div class="theme-button-group">
                                    <button class="theme-option-btn ${state.theme === 'dark' ? 'active' : ''}" data-theme="dark">
                                        <span class="material-symbols-outlined">dark_mode</span>
                                        <span>Dark Theme</span>
                                    </button>
                                    <button class="theme-option-btn ${state.theme === 'light' ? 'active' : ''}" data-theme="light">
                                        <span class="material-symbols-outlined">light_mode</span>
                                        <span>Light Theme</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- System Identity -->
                        <div class="app-card">
                            <h3 class="card-title">Profile & Operator Credentials</h3>
                            <p class="card-desc">Set identity fields for transaction records.</p>
                            
                            <div class="field-item">
                                <label class="field-label" for="setting-operator-name">Operator Name</label>
                                <input type="text" id="setting-operator-name" class="system-text-input" value="${state.user.name}">
                            </div>

                            <div class="field-item">
                                <label class="field-label" for="setting-operator-role">Designation / Role</label>
                                <input type="text" id="setting-operator-role" class="system-text-input" value="${state.user.role}">
                            </div>

                            <button id="save-profile-btn" class="sys-btn sys-btn-primary">
                                <span class="material-symbols-outlined">save</span>
                                <span>Save Identity</span>
                            </button>
                        </div>

                        <!-- Reset operations -->
                        <div class="app-card border-danger">
                            <h3 class="card-title text-danger">Hazard Control Node</h3>
                            <p class="card-desc">Irreversible system maintenance actions and cache purges.</p>
                            <button id="reset-storage-btn" class="sys-btn sys-btn-danger">
                                <span class="material-symbols-outlined">restart_alt</span>
                                <span>Reset Local Storage</span>
                            </button>
                        </div>
                    </div>

                    <!-- Column 2: System Logs -->
                    <div class="settings-logs-panel">
                        <div class="app-card height-fill flex-column">
                            <div class="log-panel-header">
                                <div class="flex-column">
                                    <h3 class="card-title">Log Stream Monitor</h3>
                                    <p class="card-desc">Live streaming runtime telemetry events.</p>
                                </div>
                                <button id="clear-logs-btn" class="sys-btn sys-btn-outline compact">
                                    <span class="material-symbols-outlined text-sm">delete_sweep</span>
                                    <span>Clear Logs</span>
                                </button>
                            </div>
                            
                            <!-- Logs Console Area -->
                            <div class="logs-console" id="console-output-area"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this._renderLogHistory();
    }

    _setupListeners() {
        // Theme toggle listener
        const themeButtons = this.container.querySelectorAll('.theme-option-btn');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedTheme = btn.getAttribute('data-theme');
                StateManager.setState({ theme: selectedTheme });
                
                // Toggle active class visually
                themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                Notification.success(`Theme updated to ${selectedTheme}.`);
            });
        });

        // Profile save listener
        const saveProfileBtn = this.container.querySelector('#save-profile-btn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                const nameVal = this.container.querySelector('#setting-operator-name').value.trim();
                const roleVal = this.container.querySelector('#setting-operator-role').value.trim();

                if (!nameVal || !roleVal) {
                    Notification.warn('Operator name and role cannot be blank.');
                    return;
                }

                StateManager.setState({
                    user: {
                        name: nameVal,
                        role: roleVal,
                        status: 'Active'
                    }
                });

                Notification.success('Operator identity updated successfully.');
            });
        }

        // Reset local storage listener
        const resetBtn = this.container.querySelector('#reset-storage-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you absolutely sure? This will wipe your saved missions and settings.')) {
                    StorageManager.clear();
                    Notification.success('Storage wiped. Reloading in 1.5 seconds...');
                    Logger.warn('SettingsModule', 'User wiped local storage database. System reload triggered.');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            });
        }

        // Clear log listener
        const clearLogsBtn = this.container.querySelector('#clear-logs-btn');
        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => {
                Logger.clearHistory();
                this._renderLogHistory();
                Notification.info('Logs stream cleared.');
            });
        }

        // Subscribe to state changes to update the inputs dynamically if changed externally
        this.stateUnsubscribe = StateManager.subscribeToKey('user', (user) => {
            const nameField = this.container.querySelector('#setting-operator-name');
            const roleField = this.container.querySelector('#setting-operator-role');
            if (nameField) nameField.value = user.name;
            if (roleField) roleField.value = user.role;
        });

        // Setup streaming log subscription
        this.logUnsubscribe = Logger.subscribe((log) => {
            const consoleArea = this.container.querySelector('#console-output-area');
            if (consoleArea) {
                const row = this._createLogRow(log);
                consoleArea.appendChild(row);
                consoleArea.scrollTop = consoleArea.scrollHeight;
            }
        });
    }

    _renderLogHistory() {
        const consoleArea = this.container.querySelector('#console-output-area');
        if (!consoleArea) return;

        consoleArea.innerHTML = '';
        const history = Logger.getHistory();
        
        if (history.length === 0) {
            consoleArea.innerHTML = `<div class="empty-log-state">Console stream empty. Ready for transactions.</div>`;
            return;
        }

        history.forEach(log => {
            const row = this._createLogRow(log);
            consoleArea.appendChild(row);
        });

        consoleArea.scrollTop = consoleArea.scrollHeight;
    }

    _createLogRow(log) {
        const row = document.createElement('div');
        row.className = `log-row log-${this._getLevelName(log.level)}`;
        
        const timestamp = log.timestamp.split('T')[1].substring(0, 12);
        
        row.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-tag">[${log.tag}]</span>
            <span class="log-msg">${log.message}</span>
            ${log.data ? `<span class="log-data">${JSON.stringify(log.data)}</span>` : ''}
        `;
        return row;
    }

    _getLevelName(level) {
        switch (level) {
            case 0: return 'debug';
            case 1: return 'info';
            case 2: return 'warn';
            case 3: return 'error';
            default: return 'info';
        }
    }
}

export const Settings = new SettingsModule();

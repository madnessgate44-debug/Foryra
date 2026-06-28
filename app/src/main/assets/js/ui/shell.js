import { Logger } from '../services/logger.js';
import { StateManager } from '../core/state-manager.js';
import { ThemeManager } from '../services/theme.js';
import { Router } from '../core/router.js';

/**
 * Application Shell UI Component
 * Builds the responsive structure, responsive sidebars, top bar headers, and status nodes.
 */
class AppShell {
    constructor() {
        this.appContainer = null;
        this.navListeners = [];
    }

    /**
     * Build the primary layout structure onto the document body.
     */
    init() {
        Logger.info('AppShell', 'Initializing Application Shell...');
        this.appContainer = document.getElementById('app-shell-root');
        
        if (!this.appContainer) {
            throw new Error('Crucial system element "#app-shell-root" is missing from the index.');
        }

        this._renderBaseLayout();
        this._setupClock();
        this._setupSidebarToggle();
        this._bindNavigation();
        this._listenToState();
    }

    _renderBaseLayout() {
        const state = StateManager.getState();
        this.appContainer.innerHTML = `
            <div class="shell-layout ${state.sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}">
                
                <!-- Left Sidebar Navigation Drawer -->
                <aside class="sidebar-aside" id="app-sidebar">
                    <!-- Brand logo header -->
                    <div class="sidebar-brand">
                        <span class="material-symbols-outlined brand-logo">explore</span>
                        <h1 class="brand-text">MISSION RUNNER</h1>
                    </div>

                    <!-- Profile / Operator Card -->
                    <div class="sidebar-operator-card" id="operator-badge">
                        <div class="avatar-circle">
                            <span class="material-symbols-outlined">shield_person</span>
                        </div>
                        <div class="operator-details">
                            <h4 class="operator-name">${state.user.name}</h4>
                            <span class="operator-title">${state.user.role}</span>
                        </div>
                    </div>

                    <!-- Primary nav link tree -->
                    <nav class="sidebar-navigation">
                        <a href="#/dashboard" class="nav-item-link" id="nav-link-dashboard">
                            <span class="material-symbols-outlined nav-item-icon">speed</span>
                            <span class="nav-item-text">Mission Command</span>
                        </a>
                        <a href="#/settings" class="nav-item-link" id="nav-link-settings">
                            <span class="material-symbols-outlined nav-item-icon">settings</span>
                            <span class="nav-item-text">System Settings</span>
                        </a>
                    </nav>

                    <!-- Sidebar Footer footer info -->
                    <div class="sidebar-footer">
                        <span class="version-badge">v1.2.0-core</span>
                        <button class="theme-toggle-quick-btn" id="quick-theme-toggle-btn" title="Toggle Aesthetic Theme">
                            <span class="material-symbols-outlined" id="quick-theme-icon">dark_mode</span>
                        </button>
                    </div>
                </aside>

                <!-- Right Main Stack -->
                <div class="main-content-stack">
                    <!-- Top Navigation & Global Settings Bar -->
                    <header class="top-bar-header">
                        <div class="header-left">
                            <button class="icon-toggle-btn" id="sidebar-toggle-btn" aria-label="Toggle Navigation Sidebar">
                                <span class="material-symbols-outlined">menu_open</span>
                            </button>
                            <span class="system-status-indicator">
                                <span class="status-blink-dot text-success"></span>
                                <span class="status-label-text">SYS ONLINE</span>
                            </span>
                        </div>
                        <div class="header-right">
                            <div class="clock-display" id="system-time-display">00:00:00 UTC</div>
                        </div>
                    </header>

                    <!-- Workspace Viewport Area (Where modules load) -->
                    <main class="workspace-area" id="workspace-viewport"></main>

                    <!-- Footer Status Bar -->
                    <footer class="footer-status-bar">
                        <span class="status-node">
                            <span class="status-indicator-dot dot-success"></span>
                            <span>Network Node Local</span>
                        </span>
                        <span class="status-node" id="footer-mission-counter">
                            <span>0 pending tasks</span>
                        </span>
                    </footer>
                </div>
            </div>
        `;
    }

    _setupClock() {
        const timeDisplay = this.appContainer.querySelector('#system-time-display');
        
        const updateTime = () => {
            const now = new Date();
            const hours = String(now.getUTCHours()).padStart(2, '0');
            const minutes = String(now.getUTCMinutes()).padStart(2, '0');
            const seconds = String(now.getUTCSeconds()).padStart(2, '0');
            if (timeDisplay) {
                timeDisplay.textContent = `${hours}:${minutes}:${seconds} UTC`;
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    _setupSidebarToggle() {
        const toggleBtn = this.appContainer.querySelector('#sidebar-toggle-btn');
        const layoutContainer = this.appContainer.querySelector('.shell-layout');
        const aside = this.appContainer.querySelector('#app-sidebar');

        const applySidebarState = (expanded) => {
            if (expanded) {
                layoutContainer.classList.add('sidebar-expanded');
                layoutContainer.classList.remove('sidebar-collapsed');
                if (toggleBtn) toggleBtn.querySelector('span').textContent = 'menu_open';
            } else {
                layoutContainer.classList.add('sidebar-collapsed');
                layoutContainer.classList.remove('sidebar-expanded');
                if (toggleBtn) toggleBtn.querySelector('span').textContent = 'menu';
            }
        };

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const current = StateManager.getState().sidebarExpanded;
                const next = !current;
                StateManager.setState({ sidebarExpanded: next });
            });
        }

        // Handle adaptive sidebar resizing for mobile viewports
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleMediaQueryChange = (e) => {
            if (e.matches) {
                // If on mobile screen, force collapse
                StateManager.setState({ sidebarExpanded: false });
            } else {
                // Return to true on tablet/desktop
                StateManager.setState({ sidebarExpanded: true });
            }
        };
        mediaQuery.addEventListener('change', handleMediaQueryChange);
        
        // Listen to state manager
        StateManager.subscribeToKey('sidebarExpanded', (expanded) => {
            applySidebarState(expanded);
        });

        // Quick theme toggle from bottom footer sidebar
        const quickThemeBtn = this.appContainer.querySelector('#quick-theme-toggle-btn');
        const quickThemeIcon = this.appContainer.querySelector('#quick-theme-icon');

        const updateQuickThemeIcon = (theme) => {
            if (quickThemeIcon) {
                quickThemeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
            }
        };

        if (quickThemeBtn) {
            quickThemeBtn.addEventListener('click', () => {
                ThemeManager.toggle();
            });
        }

        updateQuickThemeIcon(ThemeManager.getTheme());
        StateManager.subscribeToKey('theme', (theme) => {
            updateQuickThemeIcon(theme);
        });
    }

    _bindNavigation() {
        const links = this.appContainer.querySelectorAll('.nav-item-link');
        
        // Highlight active link dynamically on hash route matching
        const highlightActiveLink = (hash) => {
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (hash.startsWith(href)) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        };

        window.addEventListener('hashchange', () => {
            highlightActiveLink(window.location.hash || '#/dashboard');
        });

        highlightActiveLink(window.location.hash || '#/dashboard');
    }

    _listenToState() {
        // Dynamic operator profile card updating
        StateManager.subscribeToKey('user', (user) => {
            const operatorCard = this.appContainer.querySelector('#operator-badge');
            if (operatorCard) {
                operatorCard.querySelector('.operator-name').textContent = user.name;
                operatorCard.querySelector('.operator-title').textContent = user.role;
            }
        });

        // Dynamic footer operations counter
        const updateCounter = (missions) => {
            const counterEl = this.appContainer.querySelector('#footer-mission-counter');
            if (counterEl) {
                const pending = missions.filter(m => m.status !== 'completed').length;
                counterEl.innerHTML = `<span>${pending} active operation${pending === 1 ? '' : 's'}</span>`;
            }
        };

        updateCounter(StateManager.getState().missions);
        StateManager.subscribeToKey('missions', (missions) => {
            updateCounter(missions);
        });
    }

    /**
     * Returns the workspace viewport element where module content is loaded.
     */
    getWorkspaceViewport() {
        return this.appContainer.querySelector('#workspace-viewport');
    }
}

export const Shell = new AppShell();

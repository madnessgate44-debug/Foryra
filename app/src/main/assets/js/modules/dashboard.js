import { Logger } from '../services/logger.js';
import { StateManager } from '../core/state-manager.js';
import { Notification } from '../services/notification.js';

/**
 * Dashboard Module
 * Core operations board showing active missions, analytics telemetry, and transaction triggers.
 */
class DashboardModule {
    constructor() {
        this.container = null;
        this.stateUnsubscribe = null;
        this.activeFilter = 'all';
        this.activeUrgencyFilter = 'all';
    }

    async init() {
        Logger.info('DashboardModule', 'Dashboard module initialized.');
    }

    async mount(container) {
        this.container = container;
        Logger.info('DashboardModule', 'Mounting Dashboard screen...');
        this._render();
        this._setupListeners();

        // Subscribe to state changes so UI updates reactively
        this.stateUnsubscribe = StateManager.subscribeToKey('missions', () => {
            Logger.debug('DashboardModule', 'Missions list updated in state, refreshing UI.');
            this._refreshListAndTelemetry();
        });
    }

    async unmount() {
        Logger.info('DashboardModule', 'Unmounting Dashboard screen...');
        if (this.stateUnsubscribe) {
            this.stateUnsubscribe();
            this.stateUnsubscribe = null;
        }
        this.container = null;
    }

    _render() {
        this.container.innerHTML = `
            <div class="dashboard-viewport">
                <!-- Page Header -->
                <div class="view-header">
                    <div class="header-icon-wrap">
                        <span class="material-symbols-outlined header-icon">speed</span>
                    </div>
                    <div class="flex-column">
                        <h2 class="view-title">Mission Command</h2>
                        <p class="view-subtitle">Real-time planetary tactical operations dashboard.</p>
                    </div>
                </div>

                <!-- Telemetry Cards Row -->
                <div class="telemetry-deck" id="telemetry-container">
                    <!-- Telemetry rendered dynamically in _refreshListAndTelemetry -->
                </div>

                <!-- Main Grid Layout -->
                <div class="dashboard-grid">
                    <!-- Column 1: Missions List & Filters -->
                    <div class="missions-panel">
                        <div class="app-card flex-column height-fill">
                            <div class="panel-header">
                                <h3 class="card-title">Tactical Log</h3>
                                <button id="add-mission-trigger-btn" class="sys-btn sys-btn-primary compact">
                                    <span class="material-symbols-outlined">add</span>
                                    <span>New Mission</span>
                                </button>
                            </div>

                            <!-- List Filter Bar -->
                            <div class="filter-controls-bar">
                                <div class="filter-group">
                                    <span class="filter-label">Status:</span>
                                    <button class="filter-chip active" data-filter="all">All</button>
                                    <button class="filter-chip" data-filter="pending">Pending</button>
                                    <button class="filter-chip" data-filter="in-progress">Active</button>
                                    <button class="filter-chip" data-filter="completed">Done</button>
                                </div>
                                <div class="filter-group">
                                    <span class="filter-label">Urgency:</span>
                                    <button class="filter-chip active" data-urgency="all">All</button>
                                    <button class="filter-chip" data-urgency="high">High</button>
                                    <button class="filter-chip" data-urgency="medium">Medium</button>
                                    <button class="filter-chip" data-urgency="low">Low</button>
                                </div>
                            </div>

                            <!-- Mission List Scrollable Container -->
                            <div class="mission-list" id="mission-items-wrapper">
                                <!-- Rendered dynamically in _refreshListAndTelemetry -->
                            </div>
                        </div>
                    </div>

                    <!-- Column 2: Tactical Visualizer & Map (Aesthetic telemetry) -->
                    <div class="visualizer-panel">
                        <div class="app-card height-fill flex-column">
                            <h3 class="card-title">Telemetry Stream</h3>
                            <p class="card-desc">Constellation positioning and local node activity.</p>
                            
                            <div class="radar-visual-container">
                                <div class="radar-sweep-grid">
                                    <div class="radar-circle circle-1"></div>
                                    <div class="radar-circle circle-2"></div>
                                    <div class="radar-circle circle-3"></div>
                                    <div class="radar-crosshair-v"></div>
                                    <div class="radar-crosshair-h"></div>
                                    <div class="radar-beam"></div>
                                    <!-- Dynamic blinking dots -->
                                    <div class="radar-dot dot-1"></div>
                                    <div class="radar-dot dot-2"></div>
                                    <div class="radar-dot dot-3"></div>
                                </div>
                            </div>

                            <div class="node-health-grid">
                                <div class="health-cell">
                                    <span class="health-label">System Node</span>
                                    <span class="health-val text-success">NOMINAL</span>
                                </div>
                                <div class="health-cell">
                                    <span class="health-label">Clock Sync</span>
                                    <span class="health-val" id="telemetry-clock-sync">100%</span>
                                </div>
                                <div class="health-cell">
                                    <span class="health-label">Core Load</span>
                                    <span class="health-val text-warning">24.2%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Add Mission Overlay Modal Dialog -->
                <div class="modal-overlay hidden" id="add-mission-modal">
                    <div class="modal-card">
                        <div class="modal-header">
                            <h3 class="modal-title">New Operations Mission</h3>
                            <button class="modal-close-icon-btn" id="modal-close-btn" aria-label="Close modal">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form id="add-mission-form" class="modal-form">
                            <div class="field-item">
                                <label class="field-label" for="mission-title">Mission Title</label>
                                <input type="text" id="mission-title" class="system-text-input" placeholder="e.g. Purge cooling systems" required>
                            </div>
                            
                            <div class="modal-field-row">
                                <div class="field-item flex-1">
                                    <label class="field-label" for="mission-operator">Assigned Operator</label>
                                    <input type="text" id="mission-operator" class="system-text-input" placeholder="e.g. Alex" required>
                                </div>
                                <div class="field-item flex-1">
                                    <label class="field-label" for="mission-urgency">Urgency Tier</label>
                                    <select id="mission-urgency" class="system-select-input">
                                        <option value="high">High Urgency</option>
                                        <option value="medium" selected>Medium Urgency</option>
                                        <option value="low">Low Urgency</option>
                                    </select>
                                </div>
                            </div>

                            <div class="modal-action-row">
                                <button type="button" class="sys-btn sys-btn-outline" id="modal-cancel-btn">Cancel</button>
                                <button type="submit" class="sys-btn sys-btn-primary">Deploy Mission</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this._refreshListAndTelemetry();
    }

    _setupListeners() {
        const triggerBtn = this.container.querySelector('#add-mission-trigger-btn');
        const modal = this.container.querySelector('#add-mission-modal');
        const modalCloseBtn = this.container.querySelector('#modal-close-btn');
        const modalCancelBtn = this.container.querySelector('#modal-cancel-btn');
        const form = this.container.querySelector('#add-mission-form');

        // Modal Open / Close handlers
        if (triggerBtn && modal) {
            triggerBtn.addEventListener('click', () => {
                modal.classList.remove('hidden');
                this.container.querySelector('#mission-title').focus();
            });
        }

        const hideModal = () => {
            if (modal) {
                modal.classList.add('hidden');
                form.reset();
            }
        };

        if (modalCloseBtn) modalCloseBtn.addEventListener('click', hideModal);
        if (modalCancelBtn) modalCancelBtn.addEventListener('click', hideModal);

        // Submit mission form
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const title = this.container.querySelector('#mission-title').value.trim();
                const operator = this.container.querySelector('#mission-operator').value.trim();
                const urgency = this.container.querySelector('#mission-urgency').value;

                if (!title || !operator) {
                    Notification.warn('Please fill in all deployment fields.');
                    return;
                }

                const currentMissions = StateManager.getState().missions;
                const newMission = {
                    id: `m-${Date.now()}`,
                    title,
                    status: 'pending',
                    urgency,
                    operator,
                    updated: new Date().toISOString().replace('T', ' ').substring(0, 16)
                };

                StateManager.setState({
                    missions: [newMission, ...currentMissions]
                });

                Notification.success(`Mission successfully deployed: "${title}"`);
                Logger.info('DashboardModule', `Deployed new mission "${title}" to tactical logs.`, newMission);
                hideModal();
            });
        }

        // Status filter tabs
        const statusChips = this.container.querySelectorAll('[data-filter]');
        statusChips.forEach(chip => {
            chip.addEventListener('click', () => {
                statusChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeFilter = chip.getAttribute('data-filter');
                this._renderMissionsOnly();
            });
        });

        // Urgency filter tabs
        const urgencyChips = this.container.querySelectorAll('[data-urgency]');
        urgencyChips.forEach(chip => {
            chip.addEventListener('click', () => {
                urgencyChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeUrgencyFilter = chip.getAttribute('data-urgency');
                this._renderMissionsOnly();
            });
        });

        // Setup clock Sync ticking to look extremely interactive
        const clockSyncEl = this.container.querySelector('#telemetry-clock-sync');
        let tick = 0;
        const tickInterval = setInterval(() => {
            if (!this.container) {
                clearInterval(tickInterval);
                return;
            }
            tick++;
            if (clockSyncEl) {
                const deviation = (Math.sin(tick / 5) * 0.15).toFixed(2);
                clockSyncEl.textContent = `99.${Math.max(80, Math.floor(95 + parseFloat(deviation) * 10))}%`;
            }
        }, 3000);
    }

    _refreshListAndTelemetry() {
        this._renderTelemetry();
        this._renderMissionsOnly();
    }

    _renderTelemetry() {
        const container = this.container.querySelector('#telemetry-container');
        if (!container) return;

        const missions = StateManager.getState().missions;
        const total = missions.length;
        const completed = missions.filter(m => m.status === 'completed').length;
        const active = missions.filter(m => m.status === 'in-progress').length;
        const highUrgency = missions.filter(m => m.urgency === 'high' && m.status !== 'completed').length;

        container.innerHTML = `
            <div class="telemetry-card">
                <span class="material-symbols-outlined tel-icon">list_alt</span>
                <div class="tel-stats-wrap">
                    <span class="tel-number">${total}</span>
                    <span class="tel-label">Log Total</span>
                </div>
            </div>
            <div class="telemetry-card card-active">
                <span class="material-symbols-outlined tel-icon text-info">pending_actions</span>
                <div class="tel-stats-wrap">
                    <span class="tel-number text-info">${active}</span>
                    <span class="tel-label">Active Deployments</span>
                </div>
            </div>
            <div class="telemetry-card">
                <span class="material-symbols-outlined tel-icon text-success">task_alt</span>
                <div class="tel-stats-wrap">
                    <span class="tel-number text-success">${completed}</span>
                    <span class="tel-label">Secured Tasks</span>
                </div>
            </div>
            <div class="telemetry-card card-critical">
                <span class="material-symbols-outlined tel-icon text-danger">warning</span>
                <div class="tel-stats-wrap">
                    <span class="tel-number text-danger">${highUrgency}</span>
                    <span class="tel-label">Critical Alerts</span>
                </div>
            </div>
        `;
    }

    _renderMissionsOnly() {
        const wrapper = this.container.querySelector('#mission-items-wrapper');
        if (!wrapper) return;

        let missions = StateManager.getState().missions;

        // Apply Status Filter
        if (this.activeFilter !== 'all') {
            missions = missions.filter(m => m.status === this.activeFilter);
        }

        // Apply Urgency Filter
        if (this.activeUrgencyFilter !== 'all') {
            missions = missions.filter(m => m.urgency === this.activeUrgencyFilter);
        }

        if (missions.length === 0) {
            wrapper.innerHTML = `
                <div class="empty-mission-state">
                    <span class="material-symbols-outlined text-large">assignment_late</span>
                    <p>No logged missions matched current telemetry search parameters.</p>
                </div>
            `;
            return;
        }

        wrapper.innerHTML = missions.map(mission => `
            <div class="mission-item border-urgency-${mission.urgency}" data-id="${mission.id}">
                <div class="item-meta">
                    <span class="urgency-badge badge-${mission.urgency}">${mission.urgency.toUpperCase()}</span>
                    <span class="operator-tag">OP: ${mission.operator}</span>
                </div>
                <div class="item-content">
                    <h4 class="mission-item-title ${mission.status === 'completed' ? 'strike' : ''}">${mission.title}</h4>
                    <span class="timestamp-tag">Updated: ${mission.updated}</span>
                </div>
                <div class="item-controls">
                    <!-- Status selector -->
                    <div class="status-cycle-buttons">
                        <button class="action-node-btn ${mission.status === 'pending' ? 'active' : ''}" data-action-status="pending" title="Mark Pending">
                            <span class="material-symbols-outlined">schedule</span>
                        </button>
                        <button class="action-node-btn ${mission.status === 'in-progress' ? 'active' : ''}" data-action-status="in-progress" title="Activate">
                            <span class="material-symbols-outlined">play_arrow</span>
                        </button>
                        <button class="action-node-btn ${mission.status === 'completed' ? 'active' : ''}" data-action-status="completed" title="Complete">
                            <span class="material-symbols-outlined">check</span>
                        </button>
                    </div>
                    <!-- Delete button -->
                    <button class="delete-mission-btn" title="Purge Record">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `).join('');

        // Wire up list events (Status transitions and deleting)
        this._bindListControls(wrapper);
    }

    _bindListControls(wrapper) {
        // Status Transitions
        wrapper.querySelectorAll('[data-action-status]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.mission-item');
                const id = item.getAttribute('data-id');
                const nextStatus = btn.getAttribute('data-action-status');

                this._updateMissionStatus(id, nextStatus);
            });
        });

        // Mission Deletions
        wrapper.querySelectorAll('.delete-mission-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.mission-item');
                const id = item.getAttribute('data-id');
                this._deleteMission(id);
            });
        });
    }

    _updateMissionStatus(id, nextStatus) {
        const missions = StateManager.getState().missions.map(m => {
            if (m.id === id) {
                return {
                    ...m,
                    status: nextStatus,
                    updated: new Date().toISOString().replace('T', ' ').substring(0, 16)
                };
            }
            return m;
        });

        const updatedMission = missions.find(m => m.id === id);
        StateManager.setState({ missions });
        
        Notification.info(`Mission updated: "${updatedMission.title}" is now ${nextStatus.toUpperCase()}`);
        Logger.info('DashboardModule', `Transitioned mission "${updatedMission.title}" (ID: ${id}) to "${nextStatus}".`);
    }

    _deleteMission(id) {
        const itemToDelete = StateManager.getState().missions.find(m => m.id === id);
        if (!itemToDelete) return;

        if (confirm(`Purge tactical log record: "${itemToDelete.title}"?`)) {
            const missions = StateManager.getState().missions.filter(m => m.id !== id);
            StateManager.setState({ missions });
            
            Notification.warn(`Record purged: "${itemToDelete.title}"`);
            Logger.warn('DashboardModule', `Wiped mission "${itemToDelete.title}" (ID: ${id}) from logs database.`);
        }
    }
}

export const Dashboard = new DashboardModule();

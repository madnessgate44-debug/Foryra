/**
 * Logger Service
 * Core service for unified logging throughout the Mission Runner application.
 */

export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

class LoggerService {
    constructor() {
        this.level = LogLevel.DEBUG;
        this.history = [];
        this.maxHistorySize = 200;
        this.listeners = new Set();
    }

    setLevel(newLevel) {
        if (Object.values(LogLevel).includes(newLevel)) {
            this.level = newLevel;
            this.info('Logger', `Log level updated to: ${Object.keys(LogLevel).find(k => LogLevel[k] === newLevel)}`);
        }
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    _log(level, tag, message, data = null) {
        if (level < this.level) return;

        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, tag, message, data };
        
        this.history.push(logEntry);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }

        // Output to standard console
        const formattedMessage = `[${timestamp}] [${tag}] ${message}`;
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage, data || '');
                break;
            case LogLevel.INFO:
                console.info(formattedMessage, data || '');
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage, data || '');
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage, data || '');
                break;
        }

        // Notify listeners
        for (const listener of this.listeners) {
            try {
                listener(logEntry);
            } catch (err) {
                console.error('Error in log subscriber:', err);
            }
        }
    }

    debug(tag, message, data) {
        this._log(LogLevel.DEBUG, tag, message, data);
    }

    info(tag, message, data) {
        this._log(LogLevel.INFO, tag, message, data);
    }

    warn(tag, message, data) {
        this._log(LogLevel.WARN, tag, message, data);
    }

    error(tag, message, data) {
        this._log(LogLevel.ERROR, tag, message, data);
    }

    getHistory() {
        return [...this.history];
    }

    clearHistory() {
        this.history = [];
        this.info('Logger', 'Log history cleared.');
    }
}

export const Logger = new LoggerService();

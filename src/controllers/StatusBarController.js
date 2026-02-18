import { Events } from '../infrastructure/EventEmitter.js';

/**
 * StatusBarController - Handles status bar updates
 * (SRP: Only handles status bar view logic)
 */
export class StatusBarController {
  constructor(eventEmitter, elements) {
    this.eventEmitter = eventEmitter;
    this.statusMessage = elements.statusMessage;
    this.cursorPosition = elements.cursorPosition;
    this.modeIndicator = elements.modeIndicator;
    this.tabCount = elements.tabCount;
    this.totalTabs = 0;
    this.cursorIndex = 0;
    
    this._setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    this.eventEmitter.on(Events.TABS_UPDATED, (tabs) => {
      this.totalTabs = tabs.length;
      this._updateCursorPosition();
    });

    this.eventEmitter.on(Events.CURSOR_MOVED, (index) => {
      this.cursorIndex = index;
      this._updateCursorPosition();
    });

    this.eventEmitter.on(Events.MODE_CHANGED, (mode) => {
      this._updateModeIndicator(mode);
    });

    this.eventEmitter.on(Events.NOTIFICATION, ({ message, type }) => {
      this.showNotification(message, type);
    });

    this.eventEmitter.on(Events.TAB_CLOSED, () => {
      this.setStatus('Tab closed');
    });

    this.eventEmitter.on(Events.TAB_ACTIVATED, () => {
      this.setStatus('Tab activated');
    });
  }

  /**
   * Update cursor position display
   */
  _updateCursorPosition() {
    if (this.cursorPosition) {
      this.cursorPosition.textContent = `${this.cursorIndex + 1}/${this.totalTabs}`;
    }
  }

  /**
   * Update mode indicator
   */
  _updateModeIndicator(mode) {
    if (this.modeIndicator) {
      this.modeIndicator.textContent = mode.toUpperCase();
      this.modeIndicator.className = `mode-indicator ${mode}`;
    }
  }

  /**
   * Set status message
   */
  setStatus(message) {
    if (this.statusMessage) {
      this.statusMessage.textContent = message;
      // Clear after 3 seconds
      setTimeout(() => {
        this.statusMessage.textContent = 'Ready';
      }, 3000);
    }
  }

  /**
   * Show notification toast
   */
  showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Update tab count
   */
  updateTabCount(count, selected = 0) {
    if (this.tabCount) {
      this.tabCount.textContent = selected > 0 
        ? `${selected}/${count} tabs selected`
        : `${count} tabs`;
    }
  }
}


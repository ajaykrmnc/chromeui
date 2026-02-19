/**
 * EventEmitter - Implementation of IEventEmitter
 * (SRP: Only handles event pub/sub)
 */
export class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit an event
   * @param {string} event
   * @param {any} data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event once
   * @param {string} event
   * @param {Function} callback
   */
  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }
}

// Event constants
export const Events = {
  TABS_UPDATED: 'tabs:updated',
  TAB_SELECTED: 'tab:selected',
  TAB_CLOSED: 'tab:closed',
  TAB_ACTIVATED: 'tab:activated',
  MODE_CHANGED: 'mode:changed',
  SEARCH_CHANGED: 'search:changed',
  SELECTION_CHANGED: 'selection:changed',
  CURSOR_MOVED: 'cursor:moved',
  ERROR: 'error',
  NOTIFICATION: 'notification',
  // New events for multi-view support
  CONTENT_UPDATED: 'content:updated',
  VIEW_CHANGED: 'view:changed',
  BOOKMARKS_UPDATED: 'bookmarks:updated',
  HISTORY_UPDATED: 'history:updated',
};


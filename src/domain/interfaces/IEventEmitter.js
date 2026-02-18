/**
 * IEventEmitter Interface (ISP: Segregated interface for event handling)
 * Defines contract for pub/sub event system
 */
export const IEventEmitter = {
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   * @returns {Function} - Unsubscribe function
   */
  on: (event, callback) => {},

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   */
  off: (event, callback) => {},

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit: (event, data) => {},

  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   */
  once: (event, callback) => {},
};


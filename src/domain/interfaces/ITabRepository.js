/**
 * ITabRepository Interface (ISP: Segregated interface for tab data access)
 * Defines contract for tab data operations
 */
export const ITabRepository = {
  /**
   * Get all tabs in current window
   * @returns {Promise<Tab[]>}
   */
  getAllTabs: async () => {},

  /**
   * Get tab by ID
   * @param {number} tabId
   * @returns {Promise<Tab|null>}
   */
  getTabById: async (tabId) => {},

  /**
   * Close a tab
   * @param {number} tabId
   * @returns {Promise<void>}
   */
  closeTab: async (tabId) => {},

  /**
   * Close multiple tabs
   * @param {number[]} tabIds
   * @returns {Promise<void>}
   */
  closeTabs: async (tabIds) => {},

  /**
   * Activate (switch to) a tab
   * @param {number} tabId
   * @returns {Promise<void>}
   */
  activateTab: async (tabId) => {},

  /**
   * Pin/Unpin a tab
   * @param {number} tabId
   * @param {boolean} pinned
   * @returns {Promise<void>}
   */
  pinTab: async (tabId, pinned) => {},

  /**
   * Move tab to new position
   * @param {number} tabId
   * @param {number} newIndex
   * @returns {Promise<void>}
   */
  moveTab: async (tabId, newIndex) => {},

  /**
   * Create a new tab
   * @param {string} url
   * @returns {Promise<Tab>}
   */
  createTab: async (url) => {},

  /**
   * Duplicate a tab
   * @param {number} tabId
   * @returns {Promise<Tab>}
   */
  duplicateTab: async (tabId) => {},
};


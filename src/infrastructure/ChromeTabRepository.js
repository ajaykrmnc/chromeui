import { Tab } from '../domain/entities/Tab.js';

/**
 * ChromeTabRepository - Implementation of ITabRepository using Chrome API
 * (DIP: Depends on abstraction, implements interface)
 */
export class ChromeTabRepository {
  /**
   * Get all tabs in current window
   * @returns {Promise<Tab[]>}
   */
  async getAllTabs() {
    const chromeTabs = await chrome.tabs.query({ currentWindow: true });
    return chromeTabs.map(Tab.fromChromeTab);
  }

  /**
   * Get tab by ID
   * @param {number} tabId
   * @returns {Promise<Tab|null>}
   */
  async getTabById(tabId) {
    try {
      const chromeTab = await chrome.tabs.get(tabId);
      return Tab.fromChromeTab(chromeTab);
    } catch {
      return null;
    }
  }

  /**
   * Close a tab
   * @param {number} tabId
   * @returns {Promise<void>}
   */
  async closeTab(tabId) {
    await chrome.tabs.remove(tabId);
  }

  /**
   * Close multiple tabs
   * @param {number[]} tabIds
   * @returns {Promise<void>}
   */
  async closeTabs(tabIds) {
    await chrome.tabs.remove(tabIds);
  }

  /**
   * Activate (switch to) a tab
   * @param {number} tabId
   * @returns {Promise<void>}
   */
  async activateTab(tabId) {
    await chrome.tabs.update(tabId, { active: true });
  }

  /**
   * Pin/Unpin a tab
   * @param {number} tabId
   * @param {boolean} pinned
   * @returns {Promise<void>}
   */
  async pinTab(tabId, pinned) {
    await chrome.tabs.update(tabId, { pinned });
  }

  /**
   * Move tab to new position
   * @param {number} tabId
   * @param {number} newIndex
   * @returns {Promise<void>}
   */
  async moveTab(tabId, newIndex) {
    await chrome.tabs.move(tabId, { index: newIndex });
  }

  /**
   * Create a new tab
   * @param {string} url
   * @returns {Promise<Tab>}
   */
  async createTab(url = 'chrome://newtab') {
    const chromeTab = await chrome.tabs.create({ url });
    return Tab.fromChromeTab(chromeTab);
  }

  /**
   * Duplicate a tab
   * @param {number} tabId
   * @returns {Promise<Tab>}
   */
  async duplicateTab(tabId) {
    const chromeTab = await chrome.tabs.duplicate(tabId);
    return Tab.fromChromeTab(chromeTab);
  }

  /**
   * Get current tab ID (for excluding from list)
   * @returns {Promise<number|null>}
   */
  async getCurrentTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id || null;
  }
}


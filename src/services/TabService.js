import { Events } from '../infrastructure/EventEmitter.js';

/**
 * TabService - Handles tab business logic
 * (SRP: Only handles tab operations)
 * (DIP: Depends on ITabRepository abstraction)
 */
export class TabService {
  /**
   * @param {import('../infrastructure/ChromeTabRepository.js').ChromeTabRepository} tabRepository
   * @param {import('../infrastructure/EventEmitter.js').EventEmitter} eventEmitter
   */
  constructor(tabRepository, eventEmitter) {
    this.tabRepository = tabRepository;
    this.eventEmitter = eventEmitter;
    this.tabs = [];
    this.managerTabId = null;
  }

  /**
   * Set the manager tab ID (to exclude from list)
   * @param {number} tabId
   */
  setManagerTabId(tabId) {
    this.managerTabId = tabId;
  }

  /**
   * Load all tabs
   * @returns {Promise<Tab[]>}
   */
  async loadTabs() {
    const allTabs = await this.tabRepository.getAllTabs();
    // Exclude the manager tab from the list
    this.tabs = allTabs.filter(tab => tab.id !== this.managerTabId);
    this.eventEmitter.emit(Events.TABS_UPDATED, this.tabs);
    return this.tabs;
  }

  /**
   * Get current tabs
   * @returns {Tab[]}
   */
  getTabs() {
    return this.tabs;
  }

  /**
   * Close a tab
   * @param {number} tabId
   */
  async closeTab(tabId) {
    await this.tabRepository.closeTab(tabId);
    this.eventEmitter.emit(Events.TAB_CLOSED, tabId);
    await this.loadTabs();
  }

  /**
   * Close multiple tabs
   * @param {number[]} tabIds
   */
  async closeTabs(tabIds) {
    await this.tabRepository.closeTabs(tabIds);
    tabIds.forEach(id => this.eventEmitter.emit(Events.TAB_CLOSED, id));
    await this.loadTabs();
  }

  /**
   * Activate (switch to) a tab
   * @param {number} tabId
   */
  async activateTab(tabId) {
    await this.tabRepository.activateTab(tabId);
    this.eventEmitter.emit(Events.TAB_ACTIVATED, tabId);
  }

  /**
   * Toggle pin state
   * @param {number} tabId
   */
  async togglePin(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      await this.tabRepository.pinTab(tabId, !tab.pinned);
      await this.loadTabs();
    }
  }

  /**
   * Move tab to new position
   * @param {number} tabId
   * @param {number} newIndex
   */
  async moveTab(tabId, newIndex) {
    await this.tabRepository.moveTab(tabId, newIndex);
    await this.loadTabs();
  }

  /**
   * Duplicate a tab
   * @param {number} tabId
   */
  async duplicateTab(tabId) {
    await this.tabRepository.duplicateTab(tabId);
    await this.loadTabs();
  }

  /**
   * Search tabs
   * @param {string} query
   * @returns {Tab[]}
   */
  searchTabs(query) {
    if (!query) return this.tabs;
    return this.tabs.filter(tab => tab.matchesSearch(query));
  }

  /**
   * Close all tabs except pinned and current
   * @param {number} exceptTabId
   */
  async closeOtherTabs(exceptTabId) {
    const tabsToClose = this.tabs
      .filter(t => t.id !== exceptTabId && !t.pinned)
      .map(t => t.id);
    await this.closeTabs(tabsToClose);
  }

  /**
   * Close tabs to the right
   * @param {number} tabIndex
   */
  async closeTabsToRight(tabIndex) {
    const tabsToClose = this.tabs
      .filter(t => t.index > tabIndex && !t.pinned)
      .map(t => t.id);
    await this.closeTabs(tabsToClose);
  }
}


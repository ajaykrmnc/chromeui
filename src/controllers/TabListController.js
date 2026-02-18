import { Events } from '../infrastructure/EventEmitter.js';

/**
 * TabListController - Handles tab list rendering
 * (SRP: Only handles tab list view logic)
 */
export class TabListController {
  constructor(eventEmitter, containerSelector) {
    this.eventEmitter = eventEmitter;
    this.container = document.querySelector(containerSelector);
    this.tabs = [];
    this.cursorIndex = 0;
    this.selectedIds = new Set();
    this.searchQuery = '';
    
    this._setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    this.eventEmitter.on(Events.TABS_UPDATED, (tabs) => {
      this.tabs = tabs;
      this.render();
    });

    this.eventEmitter.on(Events.CURSOR_MOVED, (index) => {
      this.cursorIndex = index;
      this.render();
      this._scrollToVisible();
    });

    this.eventEmitter.on(Events.SELECTION_CHANGED, (ids) => {
      this.selectedIds = new Set(ids);
      this.render();
    });

    this.eventEmitter.on(Events.SEARCH_CHANGED, (query) => {
      this.searchQuery = query;
    });
  }

  /**
   * Render the tab list
   */
  render() {
    if (this.tabs.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📑</div>
          <div>No tabs found</div>
        </div>
      `;
      return;
    }

    const html = this.tabs.map((tab, index) => this._renderTabItem(tab, index)).join('');
    this.container.innerHTML = html;
  }

  /**
   * Render a single tab item
   */
  _renderTabItem(tab, index) {
    const isCursor = index === this.cursorIndex;
    const isSelected = this.selectedIds.has(tab.id);
    
    const classes = ['tab-item'];
    if (isCursor) classes.push('cursor');
    if (isSelected) classes.push('selected');
    if (tab.active) classes.push('active-tab');

    const faviconHtml = tab.favIconUrl 
      ? `<img class="tab-favicon" src="${this._escapeHtml(tab.favIconUrl)}" alt="" onerror="this.className='tab-favicon placeholder'">`
      : `<div class="tab-favicon placeholder"></div>`;

    const badges = [];
    if (tab.pinned) badges.push('<span class="badge pinned">PIN</span>');
    if (tab.active) badges.push('<span class="badge active">●</span>');

    return `
      <div class="${classes.join(' ')}" data-tab-id="${tab.id}" data-index="${index}">
        <span class="tab-index">${index + 1}</span>
        ${faviconHtml}
        <div class="tab-info">
          <div class="tab-title">${this._highlightSearch(this._escapeHtml(tab.getDisplayTitle()))}</div>
          <div class="tab-url">${this._highlightSearch(this._escapeHtml(tab.getDomain()))}</div>
        </div>
        <div class="tab-badges">${badges.join('')}</div>
      </div>
    `;
  }

  /**
   * Highlight search matches
   */
  _highlightSearch(text) {
    if (!this.searchQuery) return text;
    const regex = new RegExp(`(${this._escapeRegex(this.searchQuery)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escape HTML
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Escape regex special characters
   */
  _escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Scroll to keep cursor visible
   */
  _scrollToVisible() {
    const cursorElement = this.container.querySelector('.tab-item.cursor');
    if (cursorElement) {
      cursorElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Get tab ID at index
   */
  getTabIdAtIndex(index) {
    return this.tabs[index]?.id;
  }

  /**
   * Update tab count display
   */
  updateTabCount(element) {
    if (element) {
      const selected = this.selectedIds.size;
      const total = this.tabs.length;
      element.textContent = selected > 0 
        ? `${selected} selected / ${total} tabs`
        : `${total} tabs`;
    }
  }
}


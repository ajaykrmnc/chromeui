import { Events } from '../infrastructure/EventEmitter.js';

/**
 * ContentListController - Handles content list rendering for tabs, bookmarks, and history
 * (SRP: Only handles content list view logic)
 */
export class ContentListController {
  constructor(eventEmitter, containerSelector) {
    this.eventEmitter = eventEmitter;
    this.container = document.querySelector(containerSelector);
    this.items = [];
    this.cursorIndex = 0;
    this.selectedIds = new Set();
    this.searchQuery = '';
    this.currentView = 'tabs'; // 'tabs', 'bookmarks', 'history'
    
    this._setupEventListeners();
  }

  _setupEventListeners() {
    this.eventEmitter.on(Events.CONTENT_UPDATED, ({ items, view }) => {
      this.items = items;
      this.currentView = view;
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

  render() {
    if (this.items.length === 0) {
      const emptyMessage = {
        tabs: 'No open tabs',
        bookmarks: 'No bookmarks found',
        history: 'No history found'
      };
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${this._getEmptyIcon()}</div>
          <div>${emptyMessage[this.currentView] || 'No items found'}</div>
        </div>
      `;
      return;
    }

    const html = this.items.map((item, index) => this._renderItem(item, index)).join('');
    this.container.innerHTML = html;
  }

  _getEmptyIcon() {
    return { tabs: '📑', bookmarks: '📚', history: '📜' }[this.currentView] || '📑';
  }

  _renderItem(item, index) {
    const isCursor = index === this.cursorIndex;
    const isSelected = this.selectedIds.has(item.id);
    
    const classes = ['tab-item'];
    if (isCursor) classes.push('cursor');
    if (isSelected) classes.push('selected');
    if (this.currentView === 'tabs' && item.active) classes.push('active-tab');

    const faviconUrl = item.favIconUrl || this._getFaviconUrl(item.url);
    const faviconHtml = faviconUrl 
      ? `<img class="tab-favicon" src="${this._escapeHtml(faviconUrl)}" alt="" onerror="this.className='tab-favicon placeholder'">`
      : `<div class="tab-favicon placeholder"></div>`;

    const badges = this._getBadges(item);
    const subtitle = this._getSubtitle(item);

    return `
      <div class="${classes.join(' ')}" data-item-id="${item.id}" data-index="${index}">
        <span class="tab-index">${index + 1}</span>
        ${faviconHtml}
        <div class="tab-info">
          <div class="tab-title">${this._highlightSearch(this._escapeHtml(item.getDisplayTitle()))}</div>
          <div class="tab-url">${this._highlightSearch(this._escapeHtml(subtitle))}</div>
        </div>
        <div class="tab-badges">${badges.join('')}</div>
      </div>
    `;
  }

  _getFaviconUrl(url) {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return '';
    }
  }

  _getBadges(item) {
    const badges = [];
    if (this.currentView === 'tabs') {
      if (item.pinned) badges.push('<span class="badge pinned">PIN</span>');
      if (item.active) badges.push('<span class="badge active">●</span>');
    } else if (this.currentView === 'history' && item.visitCount > 1) {
      badges.push(`<span class="badge visits">${item.visitCount}</span>`);
    }
    return badges;
  }

  _getSubtitle(item) {
    if (this.currentView === 'history' && item.getFormattedDate) {
      return `${item.getDomain()} • ${item.getFormattedDate()}`;
    }
    return item.getDomain();
  }

  _highlightSearch(text) {
    if (!this.searchQuery) return text;
    const regex = new RegExp(`(${this._escapeRegex(this.searchQuery)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  _scrollToVisible() {
    const cursorElement = this.container.querySelector('.tab-item.cursor');
    if (cursorElement) {
      cursorElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}


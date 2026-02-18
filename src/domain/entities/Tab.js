/**
 * Tab Entity - Represents a browser tab (SRP: Only tab data representation)
 */
export class Tab {
  constructor({ id, title, url, favIconUrl, active, pinned, index, windowId }) {
    this.id = id;
    this.title = title || 'Untitled';
    this.url = url || '';
    this.favIconUrl = favIconUrl || '';
    this.active = active || false;
    this.pinned = pinned || false;
    this.index = index;
    this.windowId = windowId;
  }

  /**
   * Get display title (truncated if needed)
   */
  getDisplayTitle(maxLength = 60) {
    if (this.title.length <= maxLength) return this.title;
    return this.title.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get domain from URL
   */
  getDomain() {
    try {
      const url = new URL(this.url);
      return url.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Check if tab matches search query
   */
  matchesSearch(query) {
    const lowerQuery = query.toLowerCase();
    return (
      this.title.toLowerCase().includes(lowerQuery) ||
      this.url.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Create Tab entity from Chrome tab object
   */
  static fromChromeTab(chromeTab) {
    return new Tab({
      id: chromeTab.id,
      title: chromeTab.title,
      url: chromeTab.url,
      favIconUrl: chromeTab.favIconUrl,
      active: chromeTab.active,
      pinned: chromeTab.pinned,
      index: chromeTab.index,
      windowId: chromeTab.windowId,
    });
  }
}


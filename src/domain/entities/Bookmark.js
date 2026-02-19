/**
 * Bookmark Entity - Represents a browser bookmark (SRP: Only bookmark data representation)
 */
export class Bookmark {
  constructor({ id, title, url, dateAdded, parentId, index }) {
    this.id = id;
    this.title = title || 'Untitled';
    this.url = url || '';
    this.dateAdded = dateAdded;
    this.parentId = parentId;
    this.index = index;
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
   * Check if bookmark matches search query
   */
  matchesSearch(query) {
    const lowerQuery = query.toLowerCase();
    return (
      this.title.toLowerCase().includes(lowerQuery) ||
      this.url.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Create Bookmark entity from Chrome bookmark object
   */
  static fromChromeBookmark(chromeBookmark) {
    return new Bookmark({
      id: chromeBookmark.id,
      title: chromeBookmark.title,
      url: chromeBookmark.url,
      dateAdded: chromeBookmark.dateAdded,
      parentId: chromeBookmark.parentId,
      index: chromeBookmark.index,
    });
  }
}


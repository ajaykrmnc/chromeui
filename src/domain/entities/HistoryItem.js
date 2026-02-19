/**
 * HistoryItem Entity - Represents a browser history item (SRP: Only history data representation)
 */
export class HistoryItem {
  constructor({ id, title, url, lastVisitTime, visitCount, typedCount }) {
    this.id = id;
    this.title = title || 'Untitled';
    this.url = url || '';
    this.lastVisitTime = lastVisitTime;
    this.visitCount = visitCount || 0;
    this.typedCount = typedCount || 0;
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
   * Get formatted date
   */
  getFormattedDate() {
    if (!this.lastVisitTime) return '';
    const date = new Date(this.lastVisitTime);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  /**
   * Check if history item matches search query
   */
  matchesSearch(query) {
    const lowerQuery = query.toLowerCase();
    return (
      this.title.toLowerCase().includes(lowerQuery) ||
      this.url.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Create HistoryItem entity from Chrome history object
   */
  static fromChromeHistory(chromeHistory) {
    return new HistoryItem({
      id: chromeHistory.id,
      title: chromeHistory.title,
      url: chromeHistory.url,
      lastVisitTime: chromeHistory.lastVisitTime,
      visitCount: chromeHistory.visitCount,
      typedCount: chromeHistory.typedCount,
    });
  }
}


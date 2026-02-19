import { HistoryItem } from '../domain/entities/HistoryItem.js';

/**
 * ChromeHistoryRepository - Implementation using Chrome History API
 * (DIP: Depends on abstraction, implements interface)
 */
export class ChromeHistoryRepository {
  /**
   * Get recent history items
   * @param {number} maxResults - Maximum number of results (default 100)
   * @returns {Promise<HistoryItem[]>}
   */
  async getRecentHistory(maxResults = 100) {
    const results = await chrome.history.search({
      text: '',
      maxResults: maxResults,
      startTime: 0,
    });
    return results.map(HistoryItem.fromChromeHistory);
  }

  /**
   * Search history
   * @param {string} query
   * @param {number} maxResults
   * @returns {Promise<HistoryItem[]>}
   */
  async searchHistory(query, maxResults = 100) {
    const results = await chrome.history.search({
      text: query,
      maxResults: maxResults,
      startTime: 0,
    });
    return results.map(HistoryItem.fromChromeHistory);
  }

  /**
   * Delete a history URL
   * @param {string} url
   * @returns {Promise<void>}
   */
  async deleteUrl(url) {
    await chrome.history.deleteUrl({ url });
  }

  /**
   * Delete all history
   * @returns {Promise<void>}
   */
  async deleteAll() {
    await chrome.history.deleteAll();
  }
}


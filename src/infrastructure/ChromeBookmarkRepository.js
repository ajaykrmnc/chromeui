import { Bookmark } from '../domain/entities/Bookmark.js';

/**
 * ChromeBookmarkRepository - Implementation using Chrome Bookmarks API
 * (DIP: Depends on abstraction, implements interface)
 */
export class ChromeBookmarkRepository {
  /**
   * Get all bookmarks (flattened)
   * @returns {Promise<Bookmark[]>}
   */
  async getAllBookmarks() {
    const tree = await chrome.bookmarks.getTree();
    const bookmarks = [];
    this._flattenBookmarks(tree, bookmarks);
    return bookmarks;
  }

  /**
   * Recursively flatten bookmark tree
   * @param {Array} nodes
   * @param {Array} result
   */
  _flattenBookmarks(nodes, result) {
    for (const node of nodes) {
      // Only include items with URLs (actual bookmarks, not folders)
      if (node.url) {
        result.push(Bookmark.fromChromeBookmark(node));
      }
      // Recurse into children
      if (node.children) {
        this._flattenBookmarks(node.children, result);
      }
    }
  }

  /**
   * Search bookmarks
   * @param {string} query
   * @returns {Promise<Bookmark[]>}
   */
  async searchBookmarks(query) {
    const results = await chrome.bookmarks.search(query);
    return results.filter(b => b.url).map(Bookmark.fromChromeBookmark);
  }

  /**
   * Create a new bookmark
   * @param {string} title
   * @param {string} url
   * @returns {Promise<Bookmark>}
   */
  async createBookmark(title, url) {
    const chromeBookmark = await chrome.bookmarks.create({ title, url });
    return Bookmark.fromChromeBookmark(chromeBookmark);
  }

  /**
   * Remove a bookmark
   * @param {string} bookmarkId
   * @returns {Promise<void>}
   */
  async removeBookmark(bookmarkId) {
    await chrome.bookmarks.remove(bookmarkId);
  }
}


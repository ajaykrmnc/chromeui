import { Events } from '../infrastructure/EventEmitter.js';

/**
 * SelectionService - Manages cursor and selection state
 * (SRP: Only handles selection logic)
 */
export class SelectionService {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter;
    this.cursorIndex = 0;
    this.selectedIds = new Set();
    this.visualMode = false;
    this.visualStartIndex = 0;
    this.items = [];
  }

  /**
   * Set items to navigate
   * @param {Array} items
   */
  setItems(items) {
    this.items = items;
    // Keep cursor in bounds
    if (this.cursorIndex >= items.length) {
      this.cursorIndex = Math.max(0, items.length - 1);
    }
    this.eventEmitter.emit(Events.CURSOR_MOVED, this.cursorIndex);
  }

  /**
   * Move cursor down
   * @param {number} count
   */
  moveDown(count = 1) {
    const newIndex = Math.min(this.cursorIndex + count, this.items.length - 1);
    this._moveCursor(newIndex);
  }

  /**
   * Move cursor up
   * @param {number} count
   */
  moveUp(count = 1) {
    const newIndex = Math.max(this.cursorIndex - count, 0);
    this._moveCursor(newIndex);
  }

  /**
   * Move to first item
   */
  moveToFirst() {
    this._moveCursor(0);
  }

  /**
   * Move to last item
   */
  moveToLast() {
    this._moveCursor(this.items.length - 1);
  }

  /**
   * Internal cursor move
   * @param {number} newIndex
   */
  _moveCursor(newIndex) {
    this.cursorIndex = newIndex;
    
    if (this.visualMode) {
      this._updateVisualSelection();
    }
    
    this.eventEmitter.emit(Events.CURSOR_MOVED, this.cursorIndex);
  }

  /**
   * Get current cursor index
   * @returns {number}
   */
  getCursorIndex() {
    return this.cursorIndex;
  }

  /**
   * Get currently selected item
   * @returns {any}
   */
  getCurrentItem() {
    return this.items[this.cursorIndex];
  }

  /**
   * Toggle visual mode
   */
  toggleVisualMode() {
    this.visualMode = !this.visualMode;
    if (this.visualMode) {
      this.visualStartIndex = this.cursorIndex;
      this.selectedIds.clear();
      this._updateVisualSelection();
    } else {
      this.selectedIds.clear();
    }
    this.eventEmitter.emit(Events.SELECTION_CHANGED, this.getSelectedIds());
  }

  /**
   * Update selection in visual mode
   */
  _updateVisualSelection() {
    const start = Math.min(this.visualStartIndex, this.cursorIndex);
    const end = Math.max(this.visualStartIndex, this.cursorIndex);
    
    this.selectedIds.clear();
    for (let i = start; i <= end; i++) {
      if (this.items[i]?.id) {
        this.selectedIds.add(this.items[i].id);
      }
    }
    this.eventEmitter.emit(Events.SELECTION_CHANGED, this.getSelectedIds());
  }

  /**
   * Toggle selection of current item
   */
  toggleCurrentSelection() {
    const item = this.getCurrentItem();
    if (item?.id) {
      if (this.selectedIds.has(item.id)) {
        this.selectedIds.delete(item.id);
      } else {
        this.selectedIds.add(item.id);
      }
      this.eventEmitter.emit(Events.SELECTION_CHANGED, this.getSelectedIds());
    }
  }

  /**
   * Get selected IDs
   * @returns {number[]}
   */
  getSelectedIds() {
    return Array.from(this.selectedIds);
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedIds.clear();
    this.visualMode = false;
    this.eventEmitter.emit(Events.SELECTION_CHANGED, []);
  }

  /**
   * Select all
   */
  selectAll() {
    this.items.forEach(item => {
      if (item?.id) this.selectedIds.add(item.id);
    });
    this.eventEmitter.emit(Events.SELECTION_CHANGED, this.getSelectedIds());
  }

  /**
   * Is visual mode active?
   * @returns {boolean}
   */
  isVisualMode() {
    return this.visualMode;
  }
}


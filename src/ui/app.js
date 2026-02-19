import { EventEmitter, Events } from '../infrastructure/EventEmitter.js';
import { ChromeTabRepository } from '../infrastructure/ChromeTabRepository.js';
import { ChromeBookmarkRepository } from '../infrastructure/ChromeBookmarkRepository.js';
import { ChromeHistoryRepository } from '../infrastructure/ChromeHistoryRepository.js';
import { TabService } from '../services/TabService.js';
import { KeyBindingService } from '../services/KeyBindingService.js';
import { SelectionService } from '../services/SelectionService.js';
import { ContentListController } from '../controllers/ContentListController.js';
import { StatusBarController } from '../controllers/StatusBarController.js';
import { HelpController } from '../controllers/HelpController.js';

/**
 * VimTabApp - Main application class
 * (SRP: Orchestrates dependencies and handles app lifecycle)
 */
class VimTabApp {
  constructor() {
    // Infrastructure (DIP: Inject dependencies)
    this.eventEmitter = new EventEmitter();
    this.tabRepository = new ChromeTabRepository();
    this.bookmarkRepository = new ChromeBookmarkRepository();
    this.historyRepository = new ChromeHistoryRepository();

    // Services
    this.tabService = new TabService(this.tabRepository, this.eventEmitter);
    this.keyBindingService = new KeyBindingService(this.eventEmitter);
    this.selectionService = new SelectionService(this.eventEmitter);

    // Controllers (will be initialized after DOM ready)
    this.contentListController = null;
    this.statusBarController = null;
    this.helpController = null;

    // State
    this.searchQuery = '';
    this.currentView = 'tabs'; // 'tabs', 'bookmarks', 'history'
    this.tabs = [];
    this.bookmarks = [];
    this.history = [];
    this.filteredItems = [];

    // Panel focus state: 'sidebar' or 'content'
    this.focusedPanel = 'content';
    this.sidebarItems = ['newtab', 'tabs', 'bookmarks', 'history'];
    this.sidebarIndex = 1; // Start on 'tabs' (index 1, since newtab is 0)
  }

  /**
   * Initialize the application
   */
  async init() {
    // Store current tab ID (manager tab)
    const currentTabId = await this.tabRepository.getCurrentTabId();
    this.tabService.setManagerTabId(currentTabId);

    // Initialize controllers
    this._initControllers();

    // Register keybindings
    this._registerKeyBindings();

    // Setup event listeners
    this._setupEventListeners();

    // Setup sidebar navigation
    this._setupSidebarNavigation();

    // Load initial data
    await this._loadAllData();

    // Setup tab change listeners
    this._setupChromeListeners();
  }

  /**
   * Load all data (tabs, bookmarks, history)
   */
  async _loadAllData() {
    await Promise.all([
      this._loadTabs(),
      this._loadBookmarks(),
      this._loadHistory()
    ]);
    this._updateContent();
  }

  async _loadTabs() {
    await this.tabService.loadTabs();
    this.tabs = this.tabService.getTabs();
    document.getElementById('tabsCount').textContent = this.tabs.length;
  }

  async _loadBookmarks() {
    this.bookmarks = await this.bookmarkRepository.getAllBookmarks();
    document.getElementById('bookmarksCount').textContent = this.bookmarks.length;
  }

  async _loadHistory() {
    this.history = await this.historyRepository.getRecentHistory(100);
    document.getElementById('historyCount').textContent = this.history.length;
  }

  /**
   * Initialize controllers
   */
  _initControllers() {
    this.contentListController = new ContentListController(this.eventEmitter, '#contentList');

    this.statusBarController = new StatusBarController(this.eventEmitter, {
      statusMessage: document.getElementById('statusMessage'),
      cursorPosition: document.getElementById('cursorPosition'),
      modeIndicator: document.getElementById('modeIndicator'),
      tabCount: document.getElementById('tabCount'),
    });

    this.helpController = new HelpController(
      document.getElementById('helpModal'),
      document.getElementById('helpContent'),
      document.getElementById('closeHelp')
    );
  }

  /**
   * Setup sidebar navigation
   */
  _setupSidebarNavigation() {
    // All sidebar items (including New Tab)
    const allSidebarItems = document.querySelectorAll('.sidebar-item');
    allSidebarItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        // Update sidebar index on click
        this.sidebarIndex = index;
        this._updateSidebarCursor();

        const view = item.dataset.view;
        const action = item.dataset.action;

        if (action === 'newtab') {
          this._openNewTab();
        } else if (view) {
          this._switchView(view);
          this._focusPanel('content');
        }
      });
    });

    // Initialize sidebar visual state and focus content by default
    this._focusPanel('content');
  }

  /**
   * Focus a panel (sidebar or content)
   */
  _focusPanel(panel) {
    this.focusedPanel = panel;

    // Update visual state
    document.querySelector('.sidebar').classList.toggle('focused', panel === 'sidebar');
    document.querySelector('.content-area').classList.toggle('focused', panel === 'content');

    if (panel === 'sidebar') {
      this._updateSidebarCursor();
    }
  }

  /**
   * Update sidebar cursor position
   */
  _updateSidebarCursor() {
    const items = document.querySelectorAll('.sidebar-item');
    items.forEach((item, index) => {
      item.classList.toggle('cursor', index === this.sidebarIndex && this.focusedPanel === 'sidebar');
    });
  }

  /**
   * Move sidebar cursor
   */
  _moveSidebarCursor(direction) {
    const newIndex = this.sidebarIndex + direction;
    if (newIndex >= 0 && newIndex < this.sidebarItems.length) {
      this.sidebarIndex = newIndex;
      this._updateSidebarCursor();
    }
  }

  /**
   * Activate current sidebar item
   */
  _activateSidebarItem() {
    const currentItem = this.sidebarItems[this.sidebarIndex];
    if (currentItem === 'newtab') {
      this._openNewTab();
    } else {
      this._switchView(currentItem);
      this._focusPanel('content');
    }
  }

  /**
   * Open new tab with Vimium new tab page
   */
  _openNewTab() {
    chrome.tabs.create({ url: 'https://vimium.github.io/new-tab/' });
  }

  /**
   * Switch between views (tabs, bookmarks, history)
   */
  _switchView(view) {
    this.currentView = view;
    this.searchQuery = '';

    // Update sidebarIndex to match view
    const viewIndex = this.sidebarItems.indexOf(view);
    if (viewIndex !== -1) {
      this.sidebarIndex = viewIndex;
    }

    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach((item, index) => {
      const itemView = item.dataset.view;
      item.classList.toggle('active', itemView === view);
    });

    // Reset selection
    this.selectionService.clearSelection();

    // Update content
    this._updateContent();
    this._updateSidebarCursor();
  }

  /**
   * Update content based on current view
   */
  _updateContent() {
    let items;
    switch (this.currentView) {
      case 'bookmarks':
        items = this.bookmarks;
        break;
      case 'history':
        items = this.history;
        break;
      default:
        items = this.tabs;
    }

    this.filteredItems = this.searchQuery
      ? items.filter(item => item.matchesSearch(this.searchQuery))
      : items;

    this.selectionService.setItems(this.filteredItems);
    this.eventEmitter.emit(Events.CONTENT_UPDATED, {
      items: this.filteredItems,
      view: this.currentView
    });
    this.statusBarController.updateTabCount(
      this.filteredItems.length,
      this.selectionService.getSelectedIds().length
    );
  }

  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => this._handleKeyDown(e));

    // Content click events
    document.getElementById('contentList').addEventListener('click', (e) => {
      const tabItem = e.target.closest('.tab-item');
      if (tabItem) {
        const index = parseInt(tabItem.dataset.index, 10);
        this.selectionService._moveCursor(index);
      }
    });

    // Double-click to activate/open
    document.getElementById('contentList').addEventListener('dblclick', (e) => {
      const tabItem = e.target.closest('.tab-item');
      if (tabItem) {
        this._activateCurrentItem();
      }
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => this._handleSearch(e.target.value));
    searchInput.addEventListener('keydown', (e) => this._handleSearchKeyDown(e));

    // Command input
    const commandInput = document.getElementById('commandInput');
    commandInput.addEventListener('keydown', (e) => this._handleCommandKeyDown(e));

    // Update when tabs change
    this.eventEmitter.on(Events.TABS_UPDATED, (tabs) => {
      this.tabs = tabs;
      document.getElementById('tabsCount').textContent = tabs.length;
      if (this.currentView === 'tabs') {
        this._updateContent();
      }
    });

    this.eventEmitter.on(Events.SELECTION_CHANGED, (ids) => {
      this.statusBarController.updateTabCount(this.filteredItems.length, ids.length);
    });
  }

  /**
   * Register all keybindings
   */
  _registerKeyBindings() {
    const kb = this.keyBindingService;

    // Panel switching (h = left/sidebar, l = right/content)
    kb.register('h', () => this._focusPanel('sidebar'), 'Focus sidebar', ['normal']);
    kb.register('ArrowLeft', () => this._focusPanel('sidebar'), 'Focus sidebar', ['normal']);
    kb.register('l', () => this._handleMoveRight(), 'Focus content / Activate', ['normal']);
    kb.register('ArrowRight', () => this._handleMoveRight(), 'Focus content / Activate', ['normal']);

    // Navigation (works in both panels)
    kb.register('j', () => this._handleMoveDown(), 'Move down', ['normal']);
    kb.register('ArrowDown', () => this._handleMoveDown(), 'Move down', ['normal']);
    kb.register('k', () => this._handleMoveUp(), 'Move up', ['normal']);
    kb.register('ArrowUp', () => this._handleMoveUp(), 'Move up', ['normal']);
    kb.register('gg', () => this._handleMoveToFirst(), 'Go to first', ['normal']);
    kb.register('G', () => this._handleMoveToLast(), 'Go to last', ['normal']);
    kb.register('Ctrl+d', () => this._handleMoveDown(10), 'Half page down', ['normal']);
    kb.register('Ctrl+u', () => this._handleMoveUp(10), 'Half page up', ['normal']);

    // Item actions
    kb.register('Enter', () => this._handleEnter(), 'Open/Activate', ['normal']);
    kb.register('dd', () => this._deleteCurrentItem(), 'Close/Delete', ['normal']);
    kb.register('x', () => this._deleteSelectedItems(), 'Delete selected', ['normal']);
    kb.register('p', () => this._togglePinCurrentTab(), 'Toggle pin (tabs)', ['normal']);
    kb.register('yy', () => this._duplicateCurrentTab(), 'Duplicate (tabs)', ['normal']);
    kb.register('o', () => this._openNewTab(), 'New Tab', ['normal']);

    // View switching (number keys)
    kb.register('1', () => { this._switchView('tabs'); this._focusPanel('content'); }, 'Open Tabs', ['normal']);
    kb.register('2', () => { this._switchView('bookmarks'); this._focusPanel('content'); }, 'Bookmarks', ['normal']);
    kb.register('3', () => { this._switchView('history'); this._focusPanel('content'); }, 'History', ['normal']);
    kb.register('n', () => this._openNewTab(), 'New Tab', ['normal']);

    // Selection
    kb.register('v', () => this.selectionService.toggleVisualMode(), 'Visual mode', ['normal']);
    kb.register('Space', () => this.selectionService.toggleCurrentSelection(), 'Toggle select', ['normal']);
    kb.register('Escape', () => this._handleEscape(), 'Escape', ['normal', 'search', 'command', 'visual']);

    // Search & commands
    kb.register('/', () => this._enterSearchMode(), 'Search', ['normal']);
    kb.register(':', () => this._enterCommandMode(), 'Command', ['normal']);
    kb.register('?', () => this.helpController.toggle(), 'Help', ['normal']);
    kb.register('r', () => this._refreshCurrentView(), 'Refresh', ['normal']);
  }

  /**
   * Handle move down based on focused panel
   */
  _handleMoveDown(count = 1) {
    if (this.focusedPanel === 'sidebar') {
      for (let i = 0; i < count; i++) this._moveSidebarCursor(1);
    } else {
      this.selectionService.moveDown(count);
    }
  }

  /**
   * Handle move up based on focused panel
   */
  _handleMoveUp(count = 1) {
    if (this.focusedPanel === 'sidebar') {
      for (let i = 0; i < count; i++) this._moveSidebarCursor(-1);
    } else {
      this.selectionService.moveUp(count);
    }
  }

  /**
   * Handle move to first based on focused panel
   */
  _handleMoveToFirst() {
    if (this.focusedPanel === 'sidebar') {
      this.sidebarIndex = 0;
      this._updateSidebarCursor();
    } else {
      this.selectionService.moveToFirst();
    }
  }

  /**
   * Handle move to last based on focused panel
   */
  _handleMoveToLast() {
    if (this.focusedPanel === 'sidebar') {
      this.sidebarIndex = this.sidebarItems.length - 1;
      this._updateSidebarCursor();
    } else {
      this.selectionService.moveToLast();
    }
  }

  /**
   * Handle move right (l key) - activates sidebar item or just focuses content
   */
  _handleMoveRight() {
    if (this.focusedPanel === 'sidebar') {
      // When in sidebar, activate the selected item (switch view) and focus content
      this._activateSidebarItem();
    } else {
      // Already in content, do nothing (or could focus content to be explicit)
      this._focusPanel('content');
    }
  }

  /**
   * Handle Enter key based on focused panel
   */
  _handleEnter() {
    if (this.focusedPanel === 'sidebar') {
      this._activateSidebarItem();
    } else {
      this._activateCurrentItem();
    }
  }

  /**
   * Handle keydown events
   */
  _handleKeyDown(e) {
    if (this.keyBindingService.getMode() !== 'normal') {
      return;
    }
    this.keyBindingService.handleKeyPress(e);
  }

  /**
   * Handle escape key
   */
  _handleEscape() {
    const mode = this.keyBindingService.getMode();

    if (this.helpController.isVisible) {
      this.helpController.hide();
      return;
    }

    if (mode === 'search') {
      this._cancelSearch();
    } else if (mode === 'command') {
      this._exitCommandMode();
    } else if (this.selectionService.isVisualMode()) {
      this.selectionService.clearSelection();
    } else if (this.searchQuery) {
      // If there's an active search filter in normal mode, clear it
      this._clearSearch();
    }

    this.keyBindingService.setMode('normal');
  }

  _enterSearchMode() {
    this.keyBindingService.setMode('search');
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    searchBar.style.display = 'flex';
    searchInput.focus();
    // Keep existing search query if re-entering search mode
    searchInput.value = this.searchQuery;
    searchInput.select();
  }

  /**
   * Confirm search (Enter) - keep filtered results and go to normal mode
   */
  _confirmSearch() {
    document.getElementById('searchBar').style.display = 'none';
    // Keep the search query active - don't clear it
    // Move cursor to first item in filtered results
    this.selectionService.moveToFirst();
    this._focusPanel('content');
  }

  /**
   * Cancel search (Escape) - clear filter and return to full list
   */
  _cancelSearch() {
    document.getElementById('searchBar').style.display = 'none';
    document.getElementById('searchInput').value = '';
    this.searchQuery = '';
    this.eventEmitter.emit(Events.SEARCH_CHANGED, '');
    this._applySearch();
  }

  /**
   * Clear current search and show all items (used when needed)
   */
  _clearSearch() {
    this.searchQuery = '';
    document.getElementById('searchInput').value = '';
    this.eventEmitter.emit(Events.SEARCH_CHANGED, '');
    this._applySearch();
  }

  _enterCommandMode() {
    this.keyBindingService.setMode('command');
    const commandBar = document.getElementById('commandBar');
    const commandInput = document.getElementById('commandInput');
    commandBar.style.display = 'flex';
    commandInput.focus();
    commandInput.value = '';
  }

  _exitCommandMode() {
    document.getElementById('commandBar').style.display = 'none';
    document.getElementById('commandInput').value = '';
  }

  _handleSearch(query) {
    this.searchQuery = query;
    this.eventEmitter.emit(Events.SEARCH_CHANGED, query);
    this._applySearch();
  }

  _applySearch() {
    this._updateContent();
  }

  _handleSearchKeyDown(e) {
    // Ctrl+j / Ctrl+n / Down - move down in results (like Telescope)
    if ((e.ctrlKey && (e.key === 'j' || e.key === 'n')) || e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectionService.moveDown();
      return;
    }

    // Ctrl+k / Ctrl+p / Up - move up in results (like Telescope)
    if ((e.ctrlKey && (e.key === 'k' || e.key === 'p')) || e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectionService.moveUp();
      return;
    }

    // Enter - confirm search, activate selected item
    if (e.key === 'Enter') {
      e.preventDefault();
      this._confirmSearch();
      this.keyBindingService.setMode('normal');
      // Activate the selected item immediately
      this._activateCurrentItem();
      return;
    }

    // Escape - cancel search, clear filter
    if (e.key === 'Escape') {
      e.preventDefault();
      this._cancelSearch();
      this.keyBindingService.setMode('normal');
      return;
    }

    // Tab - confirm search without activating (stay in filtered list)
    if (e.key === 'Tab') {
      e.preventDefault();
      this._confirmSearch();
      this.keyBindingService.setMode('normal');
      return;
    }
  }

  _handleCommandKeyDown(e) {
    if (e.key === 'Escape') {
      this._exitCommandMode();
      this.keyBindingService.setMode('normal');
    } else if (e.key === 'Enter') {
      this._executeCommand(e.target.value);
      this._exitCommandMode();
      this.keyBindingService.setMode('normal');
    }
  }

  _executeCommand(cmd) {
    const commands = {
      'q': () => window.close(),
      'qa': () => this._closeAllTabs(),
      'w': () => this._refreshCurrentView(),
      'bd': () => this._deleteCurrentItem(),
      'new': () => this._openNewTab(),
      'tabs': () => this._switchView('tabs'),
      'bookmarks': () => this._switchView('bookmarks'),
      'history': () => this._switchView('history'),
    };
    const handler = commands[cmd.trim()];
    if (handler) handler();
    else this.eventEmitter.emit(Events.NOTIFICATION, { message: `Unknown command: ${cmd}`, type: 'error' });
  }

  /**
   * Refresh current view data
   */
  async _refreshCurrentView() {
    switch (this.currentView) {
      case 'bookmarks':
        await this._loadBookmarks();
        break;
      case 'history':
        await this._loadHistory();
        break;
      default:
        await this._loadTabs();
    }
    this._updateContent();
  }

  /**
   * Activate/open current item based on view
   */
  async _activateCurrentItem() {
    const item = this.selectionService.getCurrentItem();
    if (!item) return;

    if (this.currentView === 'tabs') {
      await this.tabService.activateTab(item.id);
    } else {
      // For bookmarks and history, open in new tab
      chrome.tabs.create({ url: item.url });
    }
  }

  /**
   * Delete current item based on view
   */
  async _deleteCurrentItem() {
    const item = this.selectionService.getCurrentItem();
    if (!item) return;

    switch (this.currentView) {
      case 'tabs':
        if (!item.pinned) await this.tabService.closeTab(item.id);
        break;
      case 'bookmarks':
        await this.bookmarkRepository.removeBookmark(item.id);
        await this._loadBookmarks();
        this._updateContent();
        break;
      case 'history':
        await this.historyRepository.deleteUrl(item.url);
        await this._loadHistory();
        this._updateContent();
        break;
    }
  }

  /**
   * Delete selected items
   */
  async _deleteSelectedItems() {
    const ids = this.selectionService.getSelectedIds();
    if (ids.length === 0) {
      await this._deleteCurrentItem();
      return;
    }

    switch (this.currentView) {
      case 'tabs':
        const tabsToClose = ids.filter(id => {
          const tab = this.filteredItems.find(t => t.id === id);
          return tab && !tab.pinned;
        });
        await this.tabService.closeTabs(tabsToClose);
        break;
      case 'bookmarks':
        for (const id of ids) {
          await this.bookmarkRepository.removeBookmark(id);
        }
        await this._loadBookmarks();
        this._updateContent();
        break;
      case 'history':
        for (const id of ids) {
          const item = this.filteredItems.find(h => h.id === id);
          if (item) await this.historyRepository.deleteUrl(item.url);
        }
        await this._loadHistory();
        this._updateContent();
        break;
    }
    this.selectionService.clearSelection();
  }

  async _togglePinCurrentTab() {
    if (this.currentView !== 'tabs') return;
    const tab = this.selectionService.getCurrentItem();
    if (tab) await this.tabService.togglePin(tab.id);
  }

  async _duplicateCurrentTab() {
    if (this.currentView !== 'tabs') return;
    const tab = this.selectionService.getCurrentItem();
    if (tab) await this.tabService.duplicateTab(tab.id);
  }

  async _closeOtherTabs() {
    if (this.currentView !== 'tabs') return;
    const tab = this.selectionService.getCurrentItem();
    if (tab) await this.tabService.closeOtherTabs(tab.id);
  }

  async _closeAllTabs() {
    if (this.currentView !== 'tabs') return;
    const tabIds = this.filteredItems.filter(t => !t.pinned).map(t => t.id);
    await this.tabService.closeTabs(tabIds);
  }

  _setupChromeListeners() {
    chrome.tabs.onCreated.addListener(() => this._loadTabs());
    chrome.tabs.onRemoved.addListener(() => this._loadTabs());
    chrome.tabs.onUpdated.addListener(() => this._loadTabs());
    chrome.tabs.onMoved.addListener(() => this._loadTabs());
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new VimTabApp();
  app.init().catch(console.error);
});

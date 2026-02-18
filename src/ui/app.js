import { EventEmitter, Events } from '../infrastructure/EventEmitter.js';
import { ChromeTabRepository } from '../infrastructure/ChromeTabRepository.js';
import { TabService } from '../services/TabService.js';
import { KeyBindingService } from '../services/KeyBindingService.js';
import { SelectionService } from '../services/SelectionService.js';
import { TabListController } from '../controllers/TabListController.js';
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
    
    // Services
    this.tabService = new TabService(this.tabRepository, this.eventEmitter);
    this.keyBindingService = new KeyBindingService(this.eventEmitter);
    this.selectionService = new SelectionService(this.eventEmitter);
    
    // Controllers (will be initialized after DOM ready)
    this.tabListController = null;
    this.statusBarController = null;
    this.helpController = null;
    
    // State
    this.searchQuery = '';
    this.filteredTabs = [];
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
    
    // Load initial tabs
    await this.tabService.loadTabs();
    
    // Setup tab change listeners
    this._setupChromeListeners();
  }

  /**
   * Initialize controllers
   */
  _initControllers() {
    this.tabListController = new TabListController(this.eventEmitter, '#tabList');
    
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
   * Setup event listeners
   */
  _setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => this._handleKeyDown(e));
    
    // Tab click events
    document.getElementById('tabList').addEventListener('click', (e) => {
      const tabItem = e.target.closest('.tab-item');
      if (tabItem) {
        const index = parseInt(tabItem.dataset.index, 10);
        this.selectionService._moveCursor(index);
      }
    });

    // Double-click to activate
    document.getElementById('tabList').addEventListener('dblclick', (e) => {
      const tabItem = e.target.closest('.tab-item');
      if (tabItem) {
        const tabId = parseInt(tabItem.dataset.tabId, 10);
        this.tabService.activateTab(tabId);
      }
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => this._handleSearch(e.target.value));
    searchInput.addEventListener('keydown', (e) => this._handleSearchKeyDown(e));

    // Command input
    const commandInput = document.getElementById('commandInput');
    commandInput.addEventListener('keydown', (e) => this._handleCommandKeyDown(e));

    // Update selection service when tabs change
    this.eventEmitter.on(Events.TABS_UPDATED, (tabs) => {
      this.filteredTabs = tabs;
      this.selectionService.setItems(tabs);
      this.statusBarController.updateTabCount(tabs.length, this.selectionService.getSelectedIds().length);
    });

    this.eventEmitter.on(Events.SELECTION_CHANGED, (ids) => {
      this.statusBarController.updateTabCount(this.filteredTabs.length, ids.length);
    });
  }

  /**
   * Register all keybindings
   */
  _registerKeyBindings() {
    const kb = this.keyBindingService;
    
    // Navigation
    kb.register('j', () => this.selectionService.moveDown(), 'Move down', ['normal']);
    kb.register('ArrowDown', () => this.selectionService.moveDown(), 'Move down', ['normal']);
    kb.register('k', () => this.selectionService.moveUp(), 'Move up', ['normal']);
    kb.register('ArrowUp', () => this.selectionService.moveUp(), 'Move up', ['normal']);
    kb.register('gg', () => this.selectionService.moveToFirst(), 'Go to first', ['normal']);
    kb.register('G', () => this.selectionService.moveToLast(), 'Go to last', ['normal']);
    kb.register('Ctrl+d', () => this.selectionService.moveDown(10), 'Half page down', ['normal']);
    kb.register('Ctrl+u', () => this.selectionService.moveUp(10), 'Half page up', ['normal']);
    
    // Tab actions
    kb.register('Enter', () => this._activateCurrentTab(), 'Activate tab', ['normal']);
    kb.register('dd', () => this._closeCurrentTab(), 'Close tab', ['normal']);
    kb.register('x', () => this._closeSelectedTabs(), 'Close selected', ['normal']);
    kb.register('p', () => this._togglePinCurrentTab(), 'Toggle pin', ['normal']);
    kb.register('yy', () => this._duplicateCurrentTab(), 'Duplicate tab', ['normal']);
    kb.register('o', () => this._closeOtherTabs(), 'Close others', ['normal']);
    
    // Selection
    kb.register('v', () => this.selectionService.toggleVisualMode(), 'Visual mode', ['normal']);
    kb.register('Space', () => this.selectionService.toggleCurrentSelection(), 'Toggle select', ['normal']);
    kb.register('Escape', () => this._handleEscape(), 'Escape', ['normal', 'search', 'command', 'visual']);
    
    // Search & commands
    kb.register('/', () => this._enterSearchMode(), 'Search', ['normal']);
    kb.register(':', () => this._enterCommandMode(), 'Command', ['normal']);
    kb.register('?', () => this.helpController.toggle(), 'Help', ['normal']);
    kb.register('r', () => this.tabService.loadTabs(), 'Refresh', ['normal']);
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
      this._exitSearchMode();
    } else if (mode === 'command') {
      this._exitCommandMode();
    } else if (this.selectionService.isVisualMode()) {
      this.selectionService.clearSelection();
    }

    this.keyBindingService.setMode('normal');
  }

  _enterSearchMode() {
    this.keyBindingService.setMode('search');
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    searchBar.style.display = 'flex';
    searchInput.focus();
    searchInput.value = '';
  }

  _exitSearchMode() {
    document.getElementById('searchBar').style.display = 'none';
    document.getElementById('searchInput').value = '';
    this.searchQuery = '';
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
    const allTabs = this.tabService.getTabs();
    this.filteredTabs = this.searchQuery
      ? allTabs.filter(tab => tab.matchesSearch(this.searchQuery))
      : allTabs;
    this.selectionService.setItems(this.filteredTabs);
    this.eventEmitter.emit(Events.TABS_UPDATED, this.filteredTabs);
  }

  _handleSearchKeyDown(e) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      this._exitSearchMode();
      this.keyBindingService.setMode('normal');
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
      'w': () => this.tabService.loadTabs(),
      'bd': () => this._closeCurrentTab(),
    };
    const handler = commands[cmd.trim()];
    if (handler) handler();
    else this.eventEmitter.emit(Events.NOTIFICATION, { message: `Unknown command: ${cmd}`, type: 'error' });
  }

  async _activateCurrentTab() {
    const tab = this.selectionService.getCurrentItem();
    if (tab) await this.tabService.activateTab(tab.id);
  }

  async _closeCurrentTab() {
    const tab = this.selectionService.getCurrentItem();
    if (tab && !tab.pinned) await this.tabService.closeTab(tab.id);
  }

  async _closeSelectedTabs() {
    const ids = this.selectionService.getSelectedIds();
    if (ids.length > 0) {
      const tabsToClose = ids.filter(id => {
        const tab = this.filteredTabs.find(t => t.id === id);
        return tab && !tab.pinned;
      });
      await this.tabService.closeTabs(tabsToClose);
      this.selectionService.clearSelection();
    } else {
      await this._closeCurrentTab();
    }
  }

  async _togglePinCurrentTab() {
    const tab = this.selectionService.getCurrentItem();
    if (tab) await this.tabService.togglePin(tab.id);
  }

  async _duplicateCurrentTab() {
    const tab = this.selectionService.getCurrentItem();
    if (tab) await this.tabService.duplicateTab(tab.id);
  }

  async _closeOtherTabs() {
    const tab = this.selectionService.getCurrentItem();
    if (tab) await this.tabService.closeOtherTabs(tab.id);
  }

  async _closeAllTabs() {
    const tabIds = this.filteredTabs.filter(t => !t.pinned).map(t => t.id);
    await this.tabService.closeTabs(tabIds);
  }

  _setupChromeListeners() {
    chrome.tabs.onCreated.addListener(() => this.tabService.loadTabs());
    chrome.tabs.onRemoved.addListener(() => this.tabService.loadTabs());
    chrome.tabs.onUpdated.addListener(() => this.tabService.loadTabs());
    chrome.tabs.onMoved.addListener(() => this.tabService.loadTabs());
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new VimTabApp();
  app.init().catch(console.error);
});

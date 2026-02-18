import { Events } from '../infrastructure/EventEmitter.js';

/**
 * KeyBindingService - Handles Vim-like keybindings
 * (SRP: Only handles key binding logic)
 * (OCP: Open for extension via register method)
 */
export class KeyBindingService {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter;
    this.bindings = new Map();
    this.mode = 'normal'; // normal, search, command
    this.keyBuffer = '';
    this.keyTimeout = null;
  }

  /**
   * Register a key binding
   * @param {string} key
   * @param {Function} handler
   * @param {string} description
   * @param {string[]} modes - Modes where binding is active
   */
  register(key, handler, description, modes = ['normal']) {
    this.bindings.set(key, { handler, description, modes });
  }

  /**
   * Unregister a key binding
   * @param {string} key
   */
  unregister(key) {
    this.bindings.delete(key);
  }

  /**
   * Set current mode
   * @param {string} mode
   */
  setMode(mode) {
    this.mode = mode;
    this.keyBuffer = '';
    this.eventEmitter.emit(Events.MODE_CHANGED, mode);
  }

  /**
   * Get current mode
   * @returns {string}
   */
  getMode() {
    return this.mode;
  }

  /**
   * Handle key press
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  handleKeyPress(event) {
    // Build key string from event
    const key = this._buildKeyString(event);
    
    // If in search or command mode, let input handle it
    if (this.mode !== 'normal' && !['Escape', 'Enter'].includes(event.key)) {
      return false;
    }

    // Add to buffer for multi-key commands (like dd, gg)
    this.keyBuffer += key;
    
    // Clear previous timeout
    if (this.keyTimeout) {
      clearTimeout(this.keyTimeout);
    }

    // Check for exact match first
    const binding = this.bindings.get(this.keyBuffer);
    if (binding && binding.modes.includes(this.mode)) {
      event.preventDefault();
      this.keyBuffer = '';
      binding.handler();
      return true;
    }

    // Check if buffer could be start of a command
    const possibleMatch = Array.from(this.bindings.keys()).some(k => 
      k.startsWith(this.keyBuffer) && k !== this.keyBuffer
    );

    if (possibleMatch) {
      // Wait for more keys
      this.keyTimeout = setTimeout(() => {
        this.keyBuffer = '';
      }, 500);
      return true;
    }

    // No match, reset buffer
    this.keyBuffer = '';
    return false;
  }

  /**
   * Build key string from event
   * @param {KeyboardEvent} event
   * @returns {string}
   */
  _buildKeyString(event) {
    let parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.metaKey) parts.push('Meta');
    if (event.shiftKey && event.key.length > 1) parts.push('Shift');
    
    const key = event.key === ' ' ? 'Space' : event.key;
    parts.push(key);
    
    return parts.join('+');
  }

  /**
   * Get all bindings
   * @returns {Map}
   */
  getBindings() {
    return this.bindings;
  }

  /**
   * Get help text for current mode
   * @returns {Array<{key: string, description: string}>}
   */
  getHelp() {
    const help = [];
    this.bindings.forEach((value, key) => {
      if (value.modes.includes(this.mode)) {
        help.push({ key, description: value.description });
      }
    });
    return help;
  }
}


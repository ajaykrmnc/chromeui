/**
 * IKeyBindingHandler Interface (ISP: Segregated interface for keybinding operations)
 * Defines contract for handling keyboard input
 */
export const IKeyBindingHandler = {
  /**
   * Register a key binding
   * @param {string} key - Key combination (e.g., 'j', 'dd', 'gg')
   * @param {Function} handler - Callback function
   * @param {string} description - Human-readable description
   */
  register: (key, handler, description) => {},

  /**
   * Unregister a key binding
   * @param {string} key
   */
  unregister: (key) => {},

  /**
   * Handle a key press event
   * @param {KeyboardEvent} event
   * @returns {boolean} - Whether the key was handled
   */
  handleKeyPress: (event) => {},

  /**
   * Get all registered bindings
   * @returns {Map<string, {handler: Function, description: string}>}
   */
  getBindings: () => {},

  /**
   * Set current mode (normal, search, command)
   * @param {string} mode
   */
  setMode: (mode) => {},

  /**
   * Get current mode
   * @returns {string}
   */
  getMode: () => {},
};


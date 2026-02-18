/**
 * HelpController - Handles help modal
 * (SRP: Only handles help view logic)
 */
export class HelpController {
  constructor(modalElement, contentElement, closeButton) {
    this.modal = modalElement;
    this.content = contentElement;
    this.closeButton = closeButton;
    this.isVisible = false;
    
    this._setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    this.closeButton?.addEventListener('click', () => this.hide());
    
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hide();
    });
  }

  /**
   * Show help modal
   */
  show() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      this.isVisible = true;
      this._renderHelp();
    }
  }

  /**
   * Hide help modal
   */
  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.isVisible = false;
    }
  }

  /**
   * Toggle help modal
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Render help content
   */
  _renderHelp() {
    const sections = [
      {
        title: 'Navigation',
        bindings: [
          { key: 'j / ↓', desc: 'Move cursor down' },
          { key: 'k / ↑', desc: 'Move cursor up' },
          { key: 'gg', desc: 'Go to first tab' },
          { key: 'G', desc: 'Go to last tab' },
          { key: 'Ctrl+d', desc: 'Move down half page' },
          { key: 'Ctrl+u', desc: 'Move up half page' },
        ]
      },
      {
        title: 'Tab Actions',
        bindings: [
          { key: 'Enter', desc: 'Switch to selected tab' },
          { key: 'dd', desc: 'Close current tab' },
          { key: 'x', desc: 'Close selected tabs' },
          { key: 'p', desc: 'Toggle pin' },
          { key: 'yy', desc: 'Duplicate tab' },
          { key: 'o', desc: 'Close other tabs' },
        ]
      },
      {
        title: 'Selection',
        bindings: [
          { key: 'v', desc: 'Toggle visual mode' },
          { key: 'Space', desc: 'Toggle selection' },
          { key: 'Escape', desc: 'Clear selection / Exit mode' },
        ]
      },
      {
        title: 'Search & Commands',
        bindings: [
          { key: '/', desc: 'Start search' },
          { key: 'n', desc: 'Next search result' },
          { key: 'N', desc: 'Previous search result' },
          { key: ':', desc: 'Command mode' },
          { key: '?', desc: 'Toggle help' },
          { key: 'r', desc: 'Refresh tab list' },
        ]
      }
    ];

    this.content.innerHTML = sections.map(section => `
      <div class="help-section">
        <h3>${section.title}</h3>
        ${section.bindings.map(b => `
          <div class="help-row">
            <span class="help-key">${b.key}</span>
            <span class="help-desc">${b.desc}</span>
          </div>
        `).join('')}
      </div>
    `).join('');
  }
}


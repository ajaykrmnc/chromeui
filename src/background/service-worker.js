/**
 * Background Service Worker
 * Handles extension lifecycle and opens the tab manager
 */

// Open tab manager when extension icon is clicked
chrome.action.onClicked.addListener(async () => {
  await openTabManager();
});

/**
 * Open the tab manager in a new tab
 */
async function openTabManager() {
  // Check if tab manager is already open
  const existingTab = await findExistingManagerTab();
  
  if (existingTab) {
    // Focus the existing tab
    await chrome.tabs.update(existingTab.id, { active: true });
    await chrome.windows.update(existingTab.windowId, { focused: true });
  } else {
    // Open a new tab manager
    await chrome.tabs.create({
      url: chrome.runtime.getURL('src/ui/manager.html'),
      active: true,
    });
  }
}

/**
 * Find existing tab manager tab in current window
 */
async function findExistingManagerTab() {
  const managerUrl = chrome.runtime.getURL('src/ui/manager.html');
  const tabs = await chrome.tabs.query({ currentWindow: true });
  
  return tabs.find(tab => tab.url === managerUrl);
}

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    openTabManager();
  }
});

// Log when service worker starts
console.log('VimTab Manager service worker started');


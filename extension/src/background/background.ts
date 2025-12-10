/**
 * Background service worker for SubmitMe extension.
 * Handles side panel opening and cross-component communication.
 */

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Listen for messages from content script or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Forward messages between content script and side panel if needed
  if (message.type === 'FORWARD_TO_CONTENT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message.payload, (response) => {
          sendResponse(response);
        });
      }
    });
    return true;
  }
});

console.log('SubmitMe background service worker loaded');

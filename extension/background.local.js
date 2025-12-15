// BulkDM Background Service Worker - LOCAL VERSION
// Handles cookie access and communication

// LOCAL URL - Hardcoded for Development
const BACKEND_URL = 'http://localhost:3001';

// Install event
chrome.runtime.onInstalled.addListener(() => {
  console.log('BulkDM Instagram Session Grabber (LOCAL) installed');
});

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getBackendUrl') {
    sendResponse({ url: BACKEND_URL });
  }
});


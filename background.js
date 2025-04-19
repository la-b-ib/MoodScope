// Background service worker for MoodScope Pro
chrome.runtime.onInstalled.addListener(() => {
    // Set default settings
    chrome.storage.local.set({
      settings: {
        enabled: true,
        mode: 'combined',
        language: 'en',
        sensitivity: 0.5,
        keywords: {
          positive: {
            good: 1,
            great: 1.2,
            excellent: 1.5,
            happy: 1,
            love: 1.5
          },
          negative: {
            bad: -1,
            terrible: -1.5,
            awful: -1.5,
            hate: -1.8,
            sad: -1.2
          },
          neutral: {}
        }
      },
      analysisHistory: []
    });
  });
  
  // Handle messages from popup and content scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'updateSettings') {
      chrome.storage.local.get(['settings'], (result) => {
        const newSettings = { ...result.settings, ...request.settings };
        chrome.storage.local.set({ settings: newSettings }, () => {
          // Notify all tabs about settings change
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.sendMessage(tab.id, {
                type: 'settingsUpdate',
                settings: newSettings
              });
            });
          });
          sendResponse({ success: true });
        });
      });
      return true; // Keep message channel open for async response
    }
  });
  
  // Scheduled tasks
  chrome.alarms.create('cleanupOldData', {
    periodInMinutes: 60 * 24 // Daily cleanup
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanupOldData') {
      chrome.storage.local.get(['analysisHistory'], (result) => {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const filtered = result.analysisHistory?.filter(
          item => item.timestamp > oneWeekAgo
        ) || [];
        chrome.storage.local.set({ analysisHistory: filtered });
      });
    }
  });
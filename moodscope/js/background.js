/**
 * MoodScope Background Service Worker
 * Handles notifications, cross-tab communication, and extension lifecycle
 * Author: Labib Bin Shahed
 */

class MoodScopeBackground {
  constructor() {
    this.init();
  }
  
  init() {
    // Set up message listeners
    this.setupMessageListeners();
    
    // Set up notification click handlers
    this.setupNotificationHandlers();
    
    // Initialize default settings on install
    this.setupInstallHandler();
    
    console.log('MoodScope: Background service worker initialized');
  }
  
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'SHOW_NOTIFICATION':
          this.showNotification(message);
          break;
          
        case 'GET_ANALYSIS_STATE':
          this.getAnalysisState().then(sendResponse);
          return true; // Keep message channel open for async response
          
        case 'SET_ANALYSIS_STATE':
          this.setAnalysisState(message.active);
          break;
          
        case 'BROADCAST_SENSITIVITY_CHANGE':
          this.broadcastSensitivityChange(message.sensitivity);
          break;
          
        case 'BROADCAST_PLATFORM_CHANGE':
          this.broadcastPlatformChange(message.platforms);
          break;
          
        case 'GET_SENTIMENT_SUMMARY':
          this.getSentimentSummary().then(sendResponse);
          return true;
          
        case 'CLEAR_ALL_DATA':
          this.clearAllData().then(sendResponse);
          return true;
          
        case 'EXPORT_DATA':
          this.exportData().then(sendResponse);
          return true;
          
        case 'IMPORT_DATA':
          this.importData(message.data).then(sendResponse);
          return true;
      }
    });
  }
  
  setupNotificationHandlers() {
    // Handle notification clicks
    chrome.notifications.onClicked.addListener((notificationId) => {
      // Open extension popup or focus relevant tab
      chrome.action.openPopup();
      
      // Clear the notification
      chrome.notifications.clear(notificationId);
    });
    
    // Handle notification button clicks
    chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
      if (buttonIndex === 0) {
        // "View Details" button
        chrome.action.openPopup();
      } else if (buttonIndex === 1) {
        // "Dismiss" button
        chrome.notifications.clear(notificationId);
      }
    });
  }
  
  setupInstallHandler() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.initializeDefaultSettings();
      } else if (details.reason === 'update') {
        this.handleUpdate(details.previousVersion);
      }
    });
  }
  
  async initializeDefaultSettings() {
    const defaultSettings = {
      moodscope_sensitivity: 0.5,
      moodscope_platforms: {
        twitter: true,
        facebook: true,
        linkedin: true,
        reddit: true,
        instagram: true,
        youtube: true
      },
      moodscope_notifications: {
        enabled: true,
        criticalOnly: false,
        keywordAlerts: true
      },
      moodscope_theme: 'light',
      moodscope_custom_keywords: {
        positive: [],
        neutral: [],
        negative: []
      },
      moodscope_alert_keywords: []
    };
    
    try {
      await chrome.storage.sync.set(defaultSettings);
      await chrome.storage.local.set({
        moodscope_analysis_active: false,
        moodscope_sentiment_data: { positive: 0, neutral: 0, negative: 0 },
        moodscope_recent_alerts: []
      });
      
      console.log('MoodScope: Default settings initialized');
    } catch (error) {
      console.error('MoodScope: Failed to initialize default settings:', error);
    }
  }
  
  async handleUpdate(previousVersion) {
    console.log(`MoodScope: Updated from version ${previousVersion}`);
    
    // Handle any migration logic here if needed
    // For now, just ensure all required settings exist
    try {
      const result = await chrome.storage.sync.get(null);
      
      // Add any missing settings with defaults
      const updates = {};
      
      if (!result.moodscope_sensitivity) {
        updates.moodscope_sensitivity = 0.5;
      }
      
      if (!result.moodscope_platforms) {
        updates.moodscope_platforms = {
          twitter: true,
          facebook: true,
          linkedin: true,
          reddit: true,
          instagram: true,
          youtube: true
        };
      }
      
      if (!result.moodscope_notifications) {
        updates.moodscope_notifications = {
          enabled: true,
          criticalOnly: false,
          keywordAlerts: true
        };
      }
      
      if (Object.keys(updates).length > 0) {
        await chrome.storage.sync.set(updates);
        console.log('MoodScope: Settings updated after extension update');
      }
    } catch (error) {
      console.error('MoodScope: Failed to handle update:', error);
    }
  }
  
  async showNotification(message) {
    try {
      const settings = await chrome.storage.sync.get(['moodscope_notifications']);
      const notifications = settings.moodscope_notifications || { enabled: true };
      
      if (!notifications.enabled) {
        return;
      }
      
      const notificationId = `moodscope_${Date.now()}`;
      
      const notificationOptions = {
        type: 'basic',
        iconUrl: message.iconUrl || 'icons/icon48.png',
        title: message.title || 'MoodScope Alert',
        message: message.message || 'Sentiment analysis alert',
        buttons: [
          { title: 'View Details' },
          { title: 'Dismiss' }
        ],
        priority: 1
      };
      
      await chrome.notifications.create(notificationId, notificationOptions);
      
      // Auto-clear notification after 10 seconds
      setTimeout(() => {
        chrome.notifications.clear(notificationId);
      }, 10000);
      
    } catch (error) {
      console.error('MoodScope: Failed to show notification:', error);
    }
  }
  
  async getAnalysisState() {
    try {
      const result = await chrome.storage.local.get(['moodscope_analysis_active']);
      return result.moodscope_analysis_active || false;
    } catch (error) {
      console.error('MoodScope: Failed to get analysis state:', error);
      return false;
    }
  }
  
  async setAnalysisState(active) {
    try {
      await chrome.storage.local.set({ moodscope_analysis_active: active });
      
      // Broadcast to all content scripts
      const tabs = await chrome.tabs.query({});
      const message = { type: 'TOGGLE_ANALYSIS', active };
      
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Tab might not have content script, ignore
        }
      }
      
      console.log(`MoodScope: Analysis ${active ? 'started' : 'stopped'}`);
    } catch (error) {
      console.error('MoodScope: Failed to set analysis state:', error);
    }
  }
  
  async broadcastSensitivityChange(sensitivity) {
    try {
      const tabs = await chrome.tabs.query({});
      const message = { type: 'SENSITIVITY_CHANGED', sensitivity };
      
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Tab might not have content script, ignore
        }
      }
      
      console.log(`MoodScope: Sensitivity changed to ${sensitivity}`);
    } catch (error) {
      console.error('MoodScope: Failed to broadcast sensitivity change:', error);
    }
  }
  
  async broadcastPlatformChange(platforms) {
    try {
      const tabs = await chrome.tabs.query({});
      const message = { type: 'PLATFORM_CHANGED', platforms };
      
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Tab might not have content script, ignore
        }
      }
      
      console.log('MoodScope: Platform settings changed');
    } catch (error) {
      console.error('MoodScope: Failed to broadcast platform change:', error);
    }
  }
  
  async getSentimentSummary() {
    try {
      const result = await chrome.storage.local.get(['moodscope_sentiment_data']);
      const data = result.moodscope_sentiment_data || { positive: 0, neutral: 0, negative: 0 };
      
      const total = data.positive + data.neutral + data.negative;
      
      return {
        data,
        total,
        percentages: {
          positive: total > 0 ? ((data.positive / total) * 100).toFixed(1) : 0,
          neutral: total > 0 ? ((data.neutral / total) * 100).toFixed(1) : 0,
          negative: total > 0 ? ((data.negative / total) * 100).toFixed(1) : 0
        }
      };
    } catch (error) {
      console.error('MoodScope: Failed to get sentiment summary:', error);
      return {
        data: { positive: 0, neutral: 0, negative: 0 },
        total: 0,
        percentages: { positive: 0, neutral: 0, negative: 0 }
      };
    }
  }
  
  async clearAllData() {
    try {
      await chrome.storage.local.set({
        moodscope_sentiment_data: { positive: 0, neutral: 0, negative: 0 },
        moodscope_recent_alerts: []
      });
      
      console.log('MoodScope: All data cleared');
      return { success: true };
    } catch (error) {
      console.error('MoodScope: Failed to clear data:', error);
      return { success: false, error: error.message };
    }
  }
  
  async exportData() {
    try {
      const syncData = await chrome.storage.sync.get(null);
      const localData = await chrome.storage.local.get(null);
      
      const exportData = {
        version: '1.0',
        timestamp: Date.now(),
        settings: syncData,
        data: localData
      };
      
      return { success: true, data: exportData };
    } catch (error) {
      console.error('MoodScope: Failed to export data:', error);
      return { success: false, error: error.message };
    }
  }
  
  async importData(importData) {
    try {
      if (!importData || !importData.settings || !importData.data) {
        throw new Error('Invalid import data format');
      }
      
      // Import settings (sync storage)
      await chrome.storage.sync.set(importData.settings);
      
      // Import data (local storage)
      await chrome.storage.local.set(importData.data);
      
      console.log('MoodScope: Data imported successfully');
      return { success: true };
    } catch (error) {
      console.error('MoodScope: Failed to import data:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize the background service worker
const moodScopeBackground = new MoodScopeBackground();

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup, but we can add additional logic here if needed
  console.log('MoodScope: Extension icon clicked');
});

// Handle tab updates to reinitialize content scripts if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a supported platform
    const supportedDomains = [
      'twitter.com',
      'x.com',
      'facebook.com',
      'linkedin.com',
      'reddit.com',
      'instagram.com',
      'youtube.com'
    ];
    
    const isSupported = supportedDomains.some(domain => tab.url.includes(domain));
    
    if (isSupported) {
      // Inject content scripts if they're not already loaded
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['sentiment-engine.js']
      }).catch(() => {
        // Script might already be injected, ignore error
      });
    }
  }
});

// Periodic cleanup of old alerts (run every hour)
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get(['moodscope_recent_alerts']);
    const alerts = result.moodscope_recent_alerts || [];
    
    // Keep only alerts from the last 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const filteredAlerts = alerts.filter(alert => alert.timestamp > sevenDaysAgo);
    
    if (filteredAlerts.length !== alerts.length) {
      await chrome.storage.local.set({ moodscope_recent_alerts: filteredAlerts });
      console.log(`MoodScope: Cleaned up ${alerts.length - filteredAlerts.length} old alerts`);
    }
  } catch (error) {
    console.error('MoodScope: Failed to cleanup old alerts:', error);
  }
}, 60 * 60 * 1000); // Run every hour
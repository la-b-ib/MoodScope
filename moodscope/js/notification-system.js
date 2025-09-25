/**
 * MoodScope Notification System
 * Handles alerts, keyword monitoring, and user notifications
 * Author: Labib Bin Shahed
 */

class NotificationSystem {
  constructor() {
    this.alertKeywords = [];
    this.notificationSettings = {
      enabled: true,
      criticalOnly: false,
      keywordAlerts: true
    };
    this.recentAlerts = [];
    this.sentimentThresholds = {
      critical: 0.8, // High confidence negative sentiment
      warning: 0.6   // Medium confidence negative sentiment
    };
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    this.setupMessageListener();
    console.log('MoodScope: Notification system initialized');
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'moodscope_alert_keywords',
        'moodscope_notifications'
      ]);
      
      this.alertKeywords = result.moodscope_alert_keywords || [];
      this.notificationSettings = result.moodscope_notifications || {
        enabled: true,
        criticalOnly: false,
        keywordAlerts: true
      };
      
      // Load recent alerts from local storage
      const localResult = await chrome.storage.local.get(['moodscope_recent_alerts']);
      this.recentAlerts = localResult.moodscope_recent_alerts || [];
      
    } catch (error) {
      console.error('MoodScope: Failed to load notification settings:', error);
    }
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'CHECK_ALERT_KEYWORDS':
          const hasAlert = this.checkAlertKeywords(message.text);
          sendResponse({ hasAlert, keywords: hasAlert ? this.getMatchingKeywords(message.text) : [] });
          break;
          
        case 'SENTIMENT_ALERT':
          this.handleSentimentAlert(message);
          break;
          
        case 'UPDATE_ALERT_KEYWORDS':
          this.updateAlertKeywords(message.keywords);
          break;
          
        case 'UPDATE_NOTIFICATION_SETTINGS':
          this.updateNotificationSettings(message.settings);
          break;
          
        case 'GET_RECENT_ALERTS':
          sendResponse({ alerts: this.recentAlerts });
          break;
          
        case 'CLEAR_ALERTS':
          this.clearAlerts().then(sendResponse);
          return true;
      }
    });
  }
  
  /**
   * Check if text contains any alert keywords
   */
  checkAlertKeywords(text) {
    if (!this.notificationSettings.keywordAlerts || this.alertKeywords.length === 0) {
      return false;
    }
    
    const lowerText = text.toLowerCase();
    return this.alertKeywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }
  
  /**
   * Get matching keywords from text
   */
  getMatchingKeywords(text) {
    const lowerText = text.toLowerCase();
    return this.alertKeywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }
  
  /**
   * Handle sentiment-based alerts
   */
  async handleSentimentAlert(alertData) {
    if (!this.notificationSettings.enabled) {
      return;
    }
    
    const { sentiment, confidence, text, platform, url } = alertData;
    
    // Check if this meets our alert criteria
    const shouldAlert = this.shouldTriggerAlert(sentiment, confidence);
    
    if (shouldAlert) {
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: 'sentiment',
        sentiment,
        confidence,
        text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        platform,
        url,
        severity: this.getSeverity(sentiment, confidence)
      };
      
      await this.addAlert(alert);
      await this.showNotification(alert);
    }
  }
  
  /**
   * Handle keyword-based alerts
   */
  async handleKeywordAlert(alertData) {
    if (!this.notificationSettings.enabled || !this.notificationSettings.keywordAlerts) {
      return;
    }
    
    const { text, keywords, platform, url } = alertData;
    
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'keyword',
      keywords,
      text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      platform,
      url,
      severity: 'medium'
    };
    
    await this.addAlert(alert);
    await this.showNotification(alert);
  }
  
  /**
   * Determine if sentiment should trigger an alert
   */
  shouldTriggerAlert(sentiment, confidence) {
    if (sentiment !== 'negative') {
      return false;
    }
    
    if (this.notificationSettings.criticalOnly) {
      return confidence >= this.sentimentThresholds.critical;
    }
    
    return confidence >= this.sentimentThresholds.warning;
  }
  
  /**
   * Get alert severity based on sentiment and confidence
   */
  getSeverity(sentiment, confidence) {
    if (sentiment === 'negative' && confidence >= this.sentimentThresholds.critical) {
      return 'high';
    } else if (sentiment === 'negative' && confidence >= this.sentimentThresholds.warning) {
      return 'medium';
    }
    return 'low';
  }
  
  /**
   * Add alert to recent alerts list
   */
  async addAlert(alert) {
    this.recentAlerts.unshift(alert);
    
    // Keep only the last 100 alerts
    if (this.recentAlerts.length > 100) {
      this.recentAlerts = this.recentAlerts.slice(0, 100);
    }
    
    try {
      await chrome.storage.local.set({ moodscope_recent_alerts: this.recentAlerts });
    } catch (error) {
      console.error('MoodScope: Failed to save alert:', error);
    }
  }
  
  /**
   * Show notification to user
   */
  async showNotification(alert) {
    try {
      let title, message, iconUrl;
      
      if (alert.type === 'sentiment') {
        title = `${alert.severity === 'high' ? '🚨' : '⚠️'} Sentiment Alert`;
        message = `${alert.severity === 'high' ? 'Critical' : 'Warning'} negative sentiment detected on ${alert.platform}`;
        iconUrl = 'icons/icon48.png';
      } else if (alert.type === 'keyword') {
        title = '🔍 Keyword Alert';
        message = `Keywords detected: ${alert.keywords.join(', ')} on ${alert.platform}`;
        iconUrl = 'icons/icon48.png';
      }
      
      // Send message to background script to show notification
      await chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        message,
        iconUrl
      });
      
    } catch (error) {
      console.error('MoodScope: Failed to show notification:', error);
    }
  }
  
  /**
   * Update alert keywords
   */
  async updateAlertKeywords(keywords) {
    this.alertKeywords = keywords;
    
    try {
      await chrome.storage.sync.set({ moodscope_alert_keywords: keywords });
    } catch (error) {
      console.error('MoodScope: Failed to update alert keywords:', error);
    }
  }
  
  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings) {
    this.notificationSettings = { ...this.notificationSettings, ...settings };
    
    try {
      await chrome.storage.sync.set({ moodscope_notifications: this.notificationSettings });
    } catch (error) {
      console.error('MoodScope: Failed to update notification settings:', error);
    }
  }
  
  /**
   * Clear all alerts
   */
  async clearAlerts() {
    this.recentAlerts = [];
    
    try {
      await chrome.storage.local.set({ moodscope_recent_alerts: [] });
      return { success: true };
    } catch (error) {
      console.error('MoodScope: Failed to clear alerts:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get alerts filtered by criteria
   */
  getFilteredAlerts(filters = {}) {
    let filtered = [...this.recentAlerts];
    
    if (filters.type) {
      filtered = filtered.filter(alert => alert.type === filters.type);
    }
    
    if (filters.severity) {
      filtered = filtered.filter(alert => alert.severity === filters.severity);
    }
    
    if (filters.platform) {
      filtered = filtered.filter(alert => alert.platform === filters.platform);
    }
    
    if (filters.timeRange) {
      const now = Date.now();
      const timeLimit = now - (filters.timeRange * 60 * 60 * 1000); // hours to milliseconds
      filtered = filtered.filter(alert => alert.timestamp > timeLimit);
    }
    
    return filtered;
  }
  
  /**
   * Get alert statistics
   */
  getAlertStats(timeRange = 24) { // Default to last 24 hours
    const now = Date.now();
    const timeLimit = now - (timeRange * 60 * 60 * 1000);
    
    const recentAlerts = this.recentAlerts.filter(alert => alert.timestamp > timeLimit);
    
    const stats = {
      total: recentAlerts.length,
      byType: {
        sentiment: recentAlerts.filter(a => a.type === 'sentiment').length,
        keyword: recentAlerts.filter(a => a.type === 'keyword').length
      },
      bySeverity: {
        high: recentAlerts.filter(a => a.severity === 'high').length,
        medium: recentAlerts.filter(a => a.severity === 'medium').length,
        low: recentAlerts.filter(a => a.severity === 'low').length
      },
      byPlatform: {}
    };
    
    // Count by platform
    recentAlerts.forEach(alert => {
      if (alert.platform) {
        stats.byPlatform[alert.platform] = (stats.byPlatform[alert.platform] || 0) + 1;
      }
    });
    
    return stats;
  }
  
  /**
   * Export alerts data
   */
  exportAlerts(format = 'json') {
    const exportData = {
      timestamp: Date.now(),
      alerts: this.recentAlerts,
      settings: this.notificationSettings,
      keywords: this.alertKeywords
    };
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      return this.convertAlertsToCSV(this.recentAlerts);
    }
    
    return exportData;
  }
  
  /**
   * Convert alerts to CSV format
   */
  convertAlertsToCSV(alerts) {
    const headers = ['Timestamp', 'Type', 'Severity', 'Platform', 'Text', 'Keywords/Sentiment'];
    const rows = alerts.map(alert => [
      new Date(alert.timestamp).toISOString(),
      alert.type,
      alert.severity,
      alert.platform || '',
      `"${alert.text.replace(/"/g, '""')}"`, // Escape quotes in CSV
      alert.type === 'keyword' ? alert.keywords.join(';') : alert.sentiment || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  /**
   * Test notification system
   */
  async testNotification() {
    const testAlert = {
      id: 'test_alert',
      timestamp: Date.now(),
      type: 'sentiment',
      sentiment: 'negative',
      confidence: 0.9,
      text: 'This is a test notification from MoodScope',
      platform: 'test',
      url: 'about:blank',
      severity: 'high'
    };
    
    await this.showNotification(testAlert);
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationSystem;
} else {
  window.NotificationSystem = NotificationSystem;
}
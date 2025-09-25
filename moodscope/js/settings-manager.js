/**
 * MoodScope Settings Manager
 * Handles settings management, export/import functionality, and synchronization
 * Author: Labib Bin Shahed
 */

class SettingsManager {
  constructor() {
    this.defaultSettings = {
      sensitivity: 0.5,
      platforms: {
        twitter: true,
        facebook: true,
        linkedin: true,
        reddit: true,
        instagram: true,
        youtube: true
      },
      notifications: {
        enabled: true,
        criticalOnly: false,
        keywordAlerts: true
      },
      theme: 'light',
      customKeywords: {
        positive: [],
        neutral: [],
        negative: []
      },
      alertKeywords: [],
      filterSettings: {
        filters: {
          positive: true,
          neutral: true,
          negative: true
        },
        mode: 'show'
      }
    };
    
    this.currentSettings = {};
    this.settingsVersion = '1.0';
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    this.setupMessageListener();
    console.log('MoodScope: Settings manager initialized');
  }
  
  /**
   * Load all settings from storage
   */
  async loadSettings() {
    try {
      // Load from sync storage
      const syncResult = await chrome.storage.sync.get([
        'moodscope_sensitivity',
        'moodscope_platforms',
        'moodscope_notifications',
        'moodscope_theme',
        'moodscope_custom_keywords',
        'moodscope_alert_keywords'
      ]);
      
      // Load from local storage
      const localResult = await chrome.storage.local.get([
        'moodscope_filter_settings'
      ]);
      
      // Merge with defaults
      this.currentSettings = {
        sensitivity: syncResult.moodscope_sensitivity ?? this.defaultSettings.sensitivity,
        platforms: { ...this.defaultSettings.platforms, ...syncResult.moodscope_platforms },
        notifications: { ...this.defaultSettings.notifications, ...syncResult.moodscope_notifications },
        theme: syncResult.moodscope_theme ?? this.defaultSettings.theme,
        customKeywords: { ...this.defaultSettings.customKeywords, ...syncResult.moodscope_custom_keywords },
        alertKeywords: syncResult.moodscope_alert_keywords ?? this.defaultSettings.alertKeywords,
        filterSettings: { ...this.defaultSettings.filterSettings, ...localResult.moodscope_filter_settings }
      };
      
    } catch (error) {
      console.error('MoodScope: Failed to load settings:', error);
      this.currentSettings = { ...this.defaultSettings };
    }
  }
  
  /**
   * Save settings to storage
   */
  async saveSettings(settings = null) {
    const settingsToSave = settings || this.currentSettings;
    
    try {
      // Save to sync storage
      await chrome.storage.sync.set({
        moodscope_sensitivity: settingsToSave.sensitivity,
        moodscope_platforms: settingsToSave.platforms,
        moodscope_notifications: settingsToSave.notifications,
        moodscope_theme: settingsToSave.theme,
        moodscope_custom_keywords: settingsToSave.customKeywords,
        moodscope_alert_keywords: settingsToSave.alertKeywords
      });
      
      // Save to local storage
      await chrome.storage.local.set({
        moodscope_filter_settings: settingsToSave.filterSettings
      });
      
      if (!settings) {
        this.currentSettings = settingsToSave;
      }
      
      // Broadcast settings change
      this.broadcastSettingsChange(settingsToSave);
      
    } catch (error) {
      console.error('MoodScope: Failed to save settings:', error);
      throw error;
    }
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'GET_SETTINGS':
          sendResponse({ settings: this.currentSettings });
          break;
          
        case 'UPDATE_SETTING':
          this.updateSetting(message.key, message.value).then(() => {
            sendResponse({ success: true });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
          
        case 'UPDATE_SETTINGS':
          this.updateSettings(message.settings).then(() => {
            sendResponse({ success: true });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
          
        case 'RESET_SETTINGS':
          this.resetSettings().then(() => {
            sendResponse({ success: true });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
          
        case 'EXPORT_SETTINGS':
          this.exportSettings().then(sendResponse);
          return true;
          
        case 'IMPORT_SETTINGS':
          this.importSettings(message.data).then(sendResponse);
          return true;
          
        case 'VALIDATE_SETTINGS':
          const validation = this.validateSettings(message.settings);
          sendResponse(validation);
          break;
      }
    });
  }
  
  /**
   * Update a single setting
   */
  async updateSetting(key, value) {
    const keys = key.split('.');
    let current = this.currentSettings;
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // Set the value
    current[keys[keys.length - 1]] = value;
    
    await this.saveSettings();
  }
  
  /**
   * Update multiple settings
   */
  async updateSettings(newSettings) {
    this.currentSettings = this.mergeSettings(this.currentSettings, newSettings);
    await this.saveSettings();
  }
  
  /**
   * Reset settings to defaults
   */
  async resetSettings() {
    this.currentSettings = { ...this.defaultSettings };
    await this.saveSettings();
  }
  
  /**
   * Export settings to JSON
   */
  async exportSettings() {
    try {
      // Get all data for export
      const syncData = await chrome.storage.sync.get(null);
      const localData = await chrome.storage.local.get(null);
      
      const exportData = {
        version: this.settingsVersion,
        timestamp: Date.now(),
        settings: this.currentSettings,
        rawData: {
          sync: syncData,
          local: localData
        },
        metadata: {
          userAgent: navigator.userAgent,
          extensionVersion: chrome.runtime.getManifest().version
        }
      };
      
      return {
        success: true,
        data: exportData,
        filename: `moodscope-settings-${new Date().toISOString().split('T')[0]}.json`
      };
      
    } catch (error) {
      console.error('MoodScope: Failed to export settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Import settings from JSON
   */
  async importSettings(importData) {
    try {
      // Validate import data
      const validation = this.validateImportData(importData);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }
      
      // Extract settings
      let settingsToImport;
      
      if (importData.settings) {
        // New format with structured settings
        settingsToImport = importData.settings;
      } else if (importData.rawData) {
        // Fallback to raw data
        settingsToImport = this.extractSettingsFromRawData(importData.rawData);
      } else {
        throw new Error('No valid settings data found in import');
      }
      
      // Validate settings
      const settingsValidation = this.validateSettings(settingsToImport);
      if (!settingsValidation.valid) {
        return {
          success: false,
          error: `Invalid settings: ${settingsValidation.errors.join(', ')}`
        };
      }
      
      // Apply settings
      await this.updateSettings(settingsToImport);
      
      return {
        success: true,
        imported: settingsToImport
      };
      
    } catch (error) {
      console.error('MoodScope: Failed to import settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Validate import data structure
   */
  validateImportData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid data format' };
    }
    
    if (!data.version) {
      return { valid: false, error: 'Missing version information' };
    }
    
    if (!data.settings && !data.rawData) {
      return { valid: false, error: 'No settings data found' };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate settings object
   */
  validateSettings(settings) {
    const errors = [];
    
    // Check sensitivity
    if (settings.sensitivity !== undefined) {
      if (typeof settings.sensitivity !== 'number' || settings.sensitivity < 0 || settings.sensitivity > 1) {
        errors.push('Sensitivity must be a number between 0 and 1');
      }
    }
    
    // Check platforms
    if (settings.platforms) {
      const validPlatforms = ['twitter', 'facebook', 'linkedin', 'reddit', 'instagram', 'youtube'];
      for (const platform in settings.platforms) {
        if (!validPlatforms.includes(platform)) {
          errors.push(`Invalid platform: ${platform}`);
        }
        if (typeof settings.platforms[platform] !== 'boolean') {
          errors.push(`Platform ${platform} must be boolean`);
        }
      }
    }
    
    // Check theme
    if (settings.theme !== undefined) {
      if (!['light', 'dark', 'auto'].includes(settings.theme)) {
        errors.push('Theme must be light, dark, or auto');
      }
    }
    
    // Check custom keywords
    if (settings.customKeywords) {
      const validTypes = ['positive', 'neutral', 'negative'];
      for (const type in settings.customKeywords) {
        if (!validTypes.includes(type)) {
          errors.push(`Invalid keyword type: ${type}`);
        }
        if (!Array.isArray(settings.customKeywords[type])) {
          errors.push(`Custom keywords ${type} must be an array`);
        }
      }
    }
    
    // Check alert keywords
    if (settings.alertKeywords !== undefined && !Array.isArray(settings.alertKeywords)) {
      errors.push('Alert keywords must be an array');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Extract settings from raw storage data
   */
  extractSettingsFromRawData(rawData) {
    const sync = rawData.sync || {};
    const local = rawData.local || {};
    
    return {
      sensitivity: sync.moodscope_sensitivity ?? this.defaultSettings.sensitivity,
      platforms: { ...this.defaultSettings.platforms, ...sync.moodscope_platforms },
      notifications: { ...this.defaultSettings.notifications, ...sync.moodscope_notifications },
      theme: sync.moodscope_theme ?? this.defaultSettings.theme,
      customKeywords: { ...this.defaultSettings.customKeywords, ...sync.moodscope_custom_keywords },
      alertKeywords: sync.moodscope_alert_keywords ?? this.defaultSettings.alertKeywords,
      filterSettings: { ...this.defaultSettings.filterSettings, ...local.moodscope_filter_settings }
    };
  }
  
  /**
   * Merge settings objects deeply
   */
  mergeSettings(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeSettings(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  /**
   * Broadcast settings change to all tabs
   */
  async broadcastSettingsChange(settings) {
    try {
      const tabs = await chrome.tabs.query({});
      const message = {
        type: 'SETTINGS_CHANGED',
        settings
      };
      
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Tab might not have content script, ignore
        }
      }
      
    } catch (error) {
      console.error('MoodScope: Failed to broadcast settings change:', error);
    }
  }
  
  /**
   * Get setting by key path
   */
  getSetting(key) {
    const keys = key.split('.');
    let current = this.currentSettings;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
  
  /**
   * Check if setting exists
   */
  hasSetting(key) {
    return this.getSetting(key) !== undefined;
  }
  
  /**
   * Get all settings
   */
  getAllSettings() {
    return { ...this.currentSettings };
  }
  
  /**
   * Get settings summary for display
   */
  getSettingsSummary() {
    const enabledPlatforms = Object.entries(this.currentSettings.platforms)
      .filter(([_, enabled]) => enabled)
      .map(([platform, _]) => platform);
    
    const totalCustomKeywords = Object.values(this.currentSettings.customKeywords)
      .reduce((total, keywords) => total + keywords.length, 0);
    
    return {
      sensitivity: this.currentSettings.sensitivity,
      theme: this.currentSettings.theme,
      enabledPlatforms: enabledPlatforms.length,
      platformsList: enabledPlatforms,
      notificationsEnabled: this.currentSettings.notifications.enabled,
      customKeywords: totalCustomKeywords,
      alertKeywords: this.currentSettings.alertKeywords.length,
      lastModified: Date.now()
    };
  }
  
  /**
   * Create settings backup
   */
  async createBackup() {
    const exportResult = await this.exportSettings();
    
    if (exportResult.success) {
      // Store backup in local storage
      const backupKey = `moodscope_backup_${Date.now()}`;
      await chrome.storage.local.set({
        [backupKey]: exportResult.data
      });
      
      // Keep only last 5 backups
      const allData = await chrome.storage.local.get(null);
      const backupKeys = Object.keys(allData)
        .filter(key => key.startsWith('moodscope_backup_'))
        .sort()
        .reverse();
      
      if (backupKeys.length > 5) {
        const keysToRemove = backupKeys.slice(5);
        await chrome.storage.local.remove(keysToRemove);
      }
      
      return { success: true, backupKey };
    }
    
    return exportResult;
  }
  
  /**
   * Restore from backup
   */
  async restoreFromBackup(backupKey) {
    try {
      const result = await chrome.storage.local.get([backupKey]);
      const backupData = result[backupKey];
      
      if (!backupData) {
        throw new Error('Backup not found');
      }
      
      return await this.importSettings(backupData);
      
    } catch (error) {
      console.error('MoodScope: Failed to restore from backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * List available backups
   */
  async listBackups() {
    try {
      const allData = await chrome.storage.local.get(null);
      const backups = [];
      
      for (const key in allData) {
        if (key.startsWith('moodscope_backup_')) {
          const timestamp = parseInt(key.replace('moodscope_backup_', ''));
          const data = allData[key];
          
          backups.push({
            key,
            timestamp,
            date: new Date(timestamp).toISOString(),
            version: data.version || 'unknown',
            size: JSON.stringify(data).length
          });
        }
      }
      
      return backups.sort((a, b) => b.timestamp - a.timestamp);
      
    } catch (error) {
      console.error('MoodScope: Failed to list backups:', error);
      return [];
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
} else {
  window.SettingsManager = SettingsManager;
}
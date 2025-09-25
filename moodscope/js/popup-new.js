/**
 * MoodScope Popup Interface - Production Version
 * Clean, optimized UI with proper error handling
 * Author: Labib Bin Shahed
 */

class MoodScopePopup {
  constructor() {
    this.currentTab = 'dashboard';
    this.sentimentData = { positive: 0, neutral: 0, negative: 0 };
    this.isAnalysisActive = true;
    this.currentSite = 'Unknown Site';
    this.customKeywords = [];
    this.alertKeywords = [];
    this.recentAlerts = [];
    
    this.init();
  }
  
  async init() {
    try {
      this.showLoading(true);
      
      // Initialize core functionality
      await this.loadSettings();
      this.setupEventListeners();
      this.setupTabs();
      
      // Load data
      await this.updateCurrentSite();
      await this.loadSentimentData();
      this.loadCustomKeywords();
      this.loadAlertKeywords();
      this.loadRecentAlerts();
      
      this.showLoading(false);
      this.startPeriodicUpdates();
      
    } catch (error) {
      console.error('MoodScope initialization error:', error);
      this.showLoading(false);
    }
  }
  
  showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? 'flex' : 'none';
    }
  }
  
  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', this.toggleTheme.bind(this));
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', this.refreshData.bind(this));
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', this.exportData.bind(this));
    }
    
    // Analysis toggle
    const analysisToggle = document.getElementById('analysisToggle');
    if (analysisToggle) {
      analysisToggle.addEventListener('click', this.toggleAnalysis.bind(this));
    }
    
    // Notification toggle
    const notificationToggle = document.getElementById('notificationToggle');
    if (notificationToggle) {
      notificationToggle.addEventListener('click', this.toggleNotifications.bind(this));
    }
    
    // Add keyword button
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    if (addKeywordBtn) {
      addKeywordBtn.addEventListener('click', this.addCustomKeyword.bind(this));
    }
    
    // Add alert button
    const addAlertBtn = document.getElementById('addAlertBtn');
    if (addAlertBtn) {
      addAlertBtn.addEventListener('click', this.addAlertKeyword.bind(this));
    }
    
    // Enter key support for inputs
    const newKeywordInput = document.getElementById('newKeyword');
    if (newKeywordInput) {
      newKeywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addCustomKeyword();
        }
      });
    }
    
    const newAlertInput = document.getElementById('newAlertKeyword');
    if (newAlertInput) {
      newAlertInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addAlertKeyword();
        }
      });
    }
    
    // Sensitivity slider
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    if (sensitivitySlider) {
      sensitivitySlider.addEventListener('input', this.updateSensitivity.bind(this));
    }
  }
  
  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });
  }
  
  switchTab(tabName) {
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.classList.toggle('active', button.getAttribute('data-tab') === tabName);
    });
    
    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === tabName);
    });
    
    this.currentTab = tabName;
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'analysisEnabled',
        'notificationsEnabled',
        'sensitivity',
        'customKeywords',
        'alertKeywords'
      ]);
      
      this.isAnalysisActive = result.analysisEnabled !== false;
      this.customKeywords = result.customKeywords || [];
      this.alertKeywords = result.alertKeywords || [];
      
      // Update UI elements
      const analysisToggle = document.getElementById('analysisToggle');
      if (analysisToggle) {
        analysisToggle.classList.toggle('active', this.isAnalysisActive);
      }
      
      const notificationToggle = document.getElementById('notificationToggle');
      if (notificationToggle) {
        notificationToggle.classList.toggle('active', result.notificationsEnabled || false);
      }
      
      const sensitivitySlider = document.getElementById('sensitivitySlider');
      if (sensitivitySlider) {
        sensitivitySlider.value = result.sensitivity || 5;
      }
      
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  async updateCurrentSite() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const url = new URL(tab.url);
        const hostname = url.hostname;
        
        const supportedSites = {
          'twitter.com': 'Twitter',
          'x.com': 'X (Twitter)',
          'facebook.com': 'Facebook',
          'www.facebook.com': 'Facebook',
          'linkedin.com': 'LinkedIn',
          'www.linkedin.com': 'LinkedIn',
          'reddit.com': 'Reddit',
          'www.reddit.com': 'Reddit',
          'instagram.com': 'Instagram',
          'www.instagram.com': 'Instagram',
          'youtube.com': 'YouTube',
          'www.youtube.com': 'YouTube'
        };
        
        this.currentSite = supportedSites[hostname] || 'Unsupported Site';
        
        // Update UI
        const currentSiteElement = document.getElementById('currentSite');
        if (currentSiteElement) {
          currentSiteElement.textContent = this.currentSite;
        }
        
        const statusBadge = document.getElementById('statusBadge');
        if (statusBadge) {
          const isSupported = supportedSites[hostname];
          statusBadge.textContent = isSupported ? 'Active' : 'Inactive';
          statusBadge.classList.toggle('inactive', !isSupported);
        }
        
      }
    } catch (error) {
      console.error('Failed to update current site:', error);
    }
  }
  
  async loadSentimentData() {
    try {
      const result = await chrome.storage.local.get(['sentimentData']);
      this.sentimentData = result.sentimentData || { positive: 0, neutral: 0, negative: 0 };
      this.updateSentimentDisplay();
    } catch (error) {
      console.error('Failed to load sentiment data:', error);
    }
  }
  
  updateSentimentDisplay() {
    const positiveElement = document.getElementById('positiveCount');
    const neutralElement = document.getElementById('neutralCount');
    const negativeElement = document.getElementById('negativeCount');
    
    if (positiveElement) positiveElement.textContent = this.sentimentData.positive || 0;
    if (neutralElement) neutralElement.textContent = this.sentimentData.neutral || 0;
    if (negativeElement) negativeElement.textContent = this.sentimentData.negative || 0;
  }
  
  loadCustomKeywords() {
    const keywordList = document.getElementById('keywordList');
    if (!keywordList) return;
    
    if (this.customKeywords.length === 0) {
      keywordList.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">search</span>
          <div class="empty-state-title">No Keywords Added</div>
          <div class="empty-state-desc">Add keywords to track specific topics</div>
        </div>
      `;
      return;
    }
    
    keywordList.innerHTML = this.customKeywords.map(keyword => `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-title">${keyword}</div>
          <div class="list-item-desc">Custom tracking keyword</div>
        </div>
        <div class="list-item-action">
          <button class="icon-button" onclick="window.moodScope.removeCustomKeyword('${keyword}')" title="Remove keyword">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  loadAlertKeywords() {
    const alertKeywordList = document.getElementById('alertKeywordList');
    if (!alertKeywordList) return;
    
    if (this.alertKeywords.length === 0) {
      alertKeywordList.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">add_alert</span>
          <div class="empty-state-title">No Alert Keywords</div>
          <div class="empty-state-desc">Add keywords to receive notifications</div>
        </div>
      `;
      return;
    }
    
    alertKeywordList.innerHTML = this.alertKeywords.map(keyword => `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-title">${keyword}</div>
          <div class="list-item-desc">Alert keyword</div>
        </div>
        <div class="list-item-action">
          <button class="icon-button" onclick="window.moodScope.removeAlertKeyword('${keyword}')" title="Remove alert">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  loadRecentAlerts() {
    const recentAlertsElement = document.getElementById('recentAlerts');
    if (!recentAlertsElement) return;
    
    if (this.recentAlerts.length === 0) {
      recentAlertsElement.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">notifications_none</span>
          <div class="empty-state-title">No Recent Alerts</div>
          <div class="empty-state-desc">Alerts will appear here when keywords are detected</div>
        </div>
      `;
      return;
    }
    
    // TODO: Implement recent alerts display when available
  }
  
  async addCustomKeyword() {
    const input = document.getElementById('newKeyword');
    if (!input) return;
    
    const keyword = input.value.trim();
    if (!keyword) return;
    
    if (this.customKeywords.includes(keyword)) {
      this.showToast('Keyword already exists', 'warning');
      return;
    }
    
    this.customKeywords.push(keyword);
    await this.saveCustomKeywords();
    
    input.value = '';
    this.loadCustomKeywords();
    this.showToast('Keyword added successfully', 'success');
  }
  
  async addAlertKeyword() {
    const input = document.getElementById('newAlertKeyword');
    if (!input) return;
    
    const keyword = input.value.trim();
    if (!keyword) return;
    
    if (this.alertKeywords.includes(keyword)) {
      this.showToast('Alert keyword already exists', 'warning');
      return;
    }
    
    this.alertKeywords.push(keyword);
    await this.saveAlertKeywords();
    
    input.value = '';
    this.loadAlertKeywords();
    this.showToast('Alert keyword added successfully', 'success');
  }
  
  async removeCustomKeyword(keyword) {
    this.customKeywords = this.customKeywords.filter(k => k !== keyword);
    await this.saveCustomKeywords();
    this.loadCustomKeywords();
    this.showToast('Keyword removed', 'success');
  }
  
  async removeAlertKeyword(keyword) {
    this.alertKeywords = this.alertKeywords.filter(k => k !== keyword);
    await this.saveAlertKeywords();
    this.loadAlertKeywords();
    this.showToast('Alert keyword removed', 'success');
  }
  
  async saveCustomKeywords() {
    try {
      await chrome.storage.sync.set({ customKeywords: this.customKeywords });
    } catch (error) {
      console.error('Failed to save custom keywords:', error);
    }
  }
  
  async saveAlertKeywords() {
    try {
      await chrome.storage.sync.set({ alertKeywords: this.alertKeywords });
    } catch (error) {
      console.error('Failed to save alert keywords:', error);
    }
  }
  
  async toggleAnalysis() {
    this.isAnalysisActive = !this.isAnalysisActive;
    
    const analysisToggle = document.getElementById('analysisToggle');
    if (analysisToggle) {
      analysisToggle.classList.toggle('active', this.isAnalysisActive);
    }
    
    try {
      await chrome.storage.sync.set({ analysisEnabled: this.isAnalysisActive });
      this.showToast(
        this.isAnalysisActive ? 'Analysis enabled' : 'Analysis disabled',
        'success'
      );
    } catch (error) {
      console.error('Failed to save analysis setting:', error);
    }
  }
  
  async toggleNotifications() {
    const notificationToggle = document.getElementById('notificationToggle');
    if (!notificationToggle) return;
    
    const isEnabled = !notificationToggle.classList.contains('active');
    notificationToggle.classList.toggle('active', isEnabled);
    
    try {
      await chrome.storage.sync.set({ notificationsEnabled: isEnabled });
      this.showToast(
        isEnabled ? 'Notifications enabled' : 'Notifications disabled',
        'success'
      );
    } catch (error) {
      console.error('Failed to save notification setting:', error);
    }
  }
  
  async updateSensitivity() {
    const slider = document.getElementById('sensitivitySlider');
    if (!slider) return;
    
    const sensitivity = parseInt(slider.value);
    
    try {
      await chrome.storage.sync.set({ sensitivity });
      this.showToast('Sensitivity updated', 'success');
    } catch (error) {
      console.error('Failed to save sensitivity:', error);
    }
  }
  
  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const themeIcon = document.querySelector('#themeToggle .material-icons');
    if (themeIcon) {
      themeIcon.textContent = document.body.classList.contains('dark-theme') 
        ? 'light_mode' 
        : 'dark_mode';
    }
  }
  
  async refreshData() {
    this.showLoading(true);
    
    try {
      await this.updateCurrentSite();
      await this.loadSentimentData();
      this.showToast('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      this.showToast('Failed to refresh data', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  async exportData() {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        sentimentData: this.sentimentData,
        customKeywords: this.customKeywords,
        alertKeywords: this.alertKeywords,
        currentSite: this.currentSite
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `moodscope-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showToast('Data exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      this.showToast('Failed to export data', 'error');
    }
  }
  
  showToast(message, type = 'info') {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      padding: 12px 16px;
      background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
  
  startPeriodicUpdates() {
    // Update sentiment data every 30 seconds
    setInterval(() => {
      if (this.isAnalysisActive) {
        this.loadSentimentData();
      }
    }, 30000);
  }
}

// Add CSS for toast animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  window.moodScope = new MoodScopePopup();
});
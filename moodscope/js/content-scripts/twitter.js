/**
 * MoodScope Twitter/X Content Script
 * Analyzes sentiment on Twitter/X posts and comments
 * Author: Labib Bin Shahed
 */

class TwitterMoodScope {
  constructor() {
    this.isActive = false;
    this.processedTweets = new Set();
    this.sentimentData = { positive: 0, neutral: 0, negative: 0 };
    this.observer = null;
    this.settings = {
      sensitivity: 0.5,
      platforms: { twitter: true },
      notifications: { enabled: true, criticalOnly: false, keywordAlerts: true }
    };
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    await this.loadAnalysisState();
    
    if (this.isActive && this.settings.platforms.twitter) {
      this.startAnalysis();
    }
    
    this.setupMessageListener();
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'moodscope_sensitivity',
        'moodscope_platforms',
        'moodscope_notifications'
      ]);
      
      if (result.moodscope_sensitivity !== undefined) {
        this.settings.sensitivity = result.moodscope_sensitivity;
        if (window.MoodScopeSentiment) {
          window.MoodScopeSentiment.setSensitivity(this.settings.sensitivity);
        }
      }
      
      if (result.moodscope_platforms) {
        this.settings.platforms = result.moodscope_platforms;
      }
      
      if (result.moodscope_notifications) {
        this.settings.notifications = result.moodscope_notifications;
      }
    } catch (error) {
      console.log('MoodScope: Using default settings for Twitter');
    }
  }
  
  async loadAnalysisState() {
    try {
      const result = await chrome.storage.local.get(['moodscope_analysis_active']);
      this.isActive = result.moodscope_analysis_active || false;
    } catch (error) {
      console.log('MoodScope: Analysis state not found');
    }
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'TOGGLE_ANALYSIS':
          this.isActive = message.active;
          if (this.isActive && this.settings.platforms.twitter) {
            this.startAnalysis();
          } else {
            this.stopAnalysis();
          }
          break;
          
        case 'SENSITIVITY_CHANGED':
          this.settings.sensitivity = message.sensitivity;
          if (window.MoodScopeSentiment) {
            window.MoodScopeSentiment.setSensitivity(message.sensitivity);
          }
          break;
          
        case 'GET_SENTIMENT_DATA':
          sendResponse(this.sentimentData);
          break;
      }
    });
  }
  
  startAnalysis() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Process existing tweets
    this.processTweets();
    
    // Set up observer for new tweets
    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if new tweets were added
              if (node.querySelector && (
                node.querySelector('[data-testid="tweet"]') ||
                node.querySelector('[data-testid="tweetText"]') ||
                node.matches('[data-testid="tweet"]')
              )) {
                shouldProcess = true;
              }
            }
          });
        }
      });
      
      if (shouldProcess) {
        // Debounce processing
        clearTimeout(this.processTimeout);
        this.processTimeout = setTimeout(() => {
          this.processTweets();
        }, 500);
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('MoodScope: Twitter analysis started');
  }
  
  stopAnalysis() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Remove all sentiment indicators
    document.querySelectorAll('.moodscope-sentiment-indicator').forEach(el => {
      el.remove();
    });
    
    document.querySelectorAll('.moodscope-highlighted').forEach(el => {
      el.classList.remove('moodscope-highlighted', 'moodscope-positive', 'moodscope-negative', 'moodscope-neutral');
    });
    
    console.log('MoodScope: Twitter analysis stopped');
  }
  
  processTweets() {
    if (!this.isActive || !window.MoodScopeSentiment) return;
    
    // Find all tweet elements
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    
    tweets.forEach(tweet => {
      const tweetId = this.getTweetId(tweet);
      if (!tweetId || this.processedTweets.has(tweetId)) return;
      
      this.processTweet(tweet, tweetId);
      this.processedTweets.add(tweetId);
    });
    
    // Also process individual tweet text elements that might not be in tweet containers
    const tweetTexts = document.querySelectorAll('[data-testid="tweetText"]');
    tweetTexts.forEach(tweetText => {
      if (!tweetText.closest('[data-testid="tweet"]')) {
        const textId = this.getElementId(tweetText);
        if (!this.processedTweets.has(textId)) {
          this.processTweetText(tweetText);
          this.processedTweets.add(textId);
        }
      }
    });
    
    this.updateSentimentData();
  }
  
  getTweetId(tweet) {
    // Try to get tweet ID from various possible attributes
    const link = tweet.querySelector('a[href*="/status/"]');
    if (link) {
      const match = link.href.match(/\/status\/(\d+)/);
      if (match) return match[1];
    }
    
    // Fallback to element position
    return this.getElementId(tweet);
  }
  
  getElementId(element) {
    // Generate a unique ID based on element position and content
    const rect = element.getBoundingClientRect();
    const content = element.textContent.substring(0, 50);
    return `${rect.top}_${rect.left}_${content.replace(/\s+/g, '_')}`;
  }
  
  processTweet(tweet, tweetId) {
    const tweetText = tweet.querySelector('[data-testid="tweetText"]');
    if (!tweetText) return;
    
    this.processTweetText(tweetText);
  }
  
  processTweetText(tweetTextElement) {
    const text = tweetTextElement.textContent;
    if (!text || text.trim().length === 0) return;
    
    // Analyze sentiment
    const analysis = window.MoodScopeSentiment.analyzeSentiment(text);
    
    // Check for alert keywords
    const alertKeywords = window.MoodScopeSentiment.checkAlertKeywords(text);
    if (alertKeywords.length > 0 && this.settings.notifications.keywordAlerts) {
      this.showAlert(`Alert keywords found: ${alertKeywords.join(', ')}`, text.substring(0, 100));
    }
    
    // Add sentiment indicator
    this.addSentimentIndicator(tweetTextElement, analysis);
    
    // Highlight text
    this.highlightSentiment(tweetTextElement, analysis);
    
    // Update sentiment data
    this.sentimentData[analysis.sentiment]++;
  }
  
  addSentimentIndicator(element, analysis) {
    // Remove existing indicator
    const existingIndicator = element.parentNode.querySelector('.moodscope-sentiment-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // Create sentiment indicator
    const indicator = document.createElement('div');
    indicator.className = `moodscope-sentiment-indicator moodscope-${analysis.sentiment}`;
    indicator.innerHTML = `
      <span class="material-icons">${this.getSentimentIcon(analysis.sentiment)}</span>
      <span class="sentiment-score">${analysis.score.toFixed(2)}</span>
    `;
    
    // Add tooltip
    indicator.title = `Sentiment: ${analysis.sentiment} (${(analysis.confidence * 100).toFixed(1)}% confidence)`;
    
    // Insert indicator
    const tweetContainer = element.closest('[data-testid="tweet"]') || element.parentNode;
    if (tweetContainer) {
      tweetContainer.style.position = 'relative';
      tweetContainer.appendChild(indicator);
    }
  }
  
  highlightSentiment(element, analysis) {
    // Add highlighting class
    element.classList.add('moodscope-highlighted', `moodscope-${analysis.sentiment}`);
    
    // Add data attribute for filtering
    element.setAttribute('data-moodscope-sentiment', analysis.sentiment);
    element.setAttribute('data-moodscope-score', analysis.score.toFixed(2));
  }
  
  getSentimentIcon(sentiment) {
    switch (sentiment) {
      case 'positive':
        return 'sentiment_very_satisfied';
      case 'negative':
        return 'sentiment_very_dissatisfied';
      case 'neutral':
      default:
        return 'sentiment_neutral';
    }
  }
  
  async updateSentimentData() {
    try {
      await chrome.storage.local.set({ moodscope_sentiment_data: this.sentimentData });
    } catch (error) {
      console.log('MoodScope: Could not save sentiment data');
    }
  }
  
  async showAlert(title, content) {
    if (!this.settings.notifications.enabled) return;
    
    try {
      // Store alert
      const result = await chrome.storage.local.get(['moodscope_recent_alerts']);
      const alerts = result.moodscope_recent_alerts || [];
      
      alerts.unshift({
        title,
        message: content,
        timestamp: Date.now(),
        site: 'Twitter/X'
      });
      
      // Keep only last 50 alerts
      if (alerts.length > 50) {
        alerts.splice(50);
      }
      
      await chrome.storage.local.set({ moodscope_recent_alerts: alerts });
      
      // Show notification
      chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        title: `MoodScope Alert - ${title}`,
        message: content,
        iconUrl: 'icons/icon48.png'
      });
    } catch (error) {
      console.log('MoodScope: Could not show alert');
    }
  }
  
  // Public methods for filtering
  filterBySentiment(sentiment) {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    
    tweets.forEach(tweet => {
      const tweetText = tweet.querySelector('[data-moodscope-sentiment]');
      if (tweetText) {
        const tweetSentiment = tweetText.getAttribute('data-moodscope-sentiment');
        if (sentiment === 'all' || tweetSentiment === sentiment) {
          tweet.style.display = '';
        } else {
          tweet.style.display = 'none';
        }
      }
    });
  }
  
  resetFilter() {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    tweets.forEach(tweet => {
      tweet.style.display = '';
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.TwitterMoodScope = new TwitterMoodScope();
  });
} else {
  window.TwitterMoodScope = new TwitterMoodScope();
}

// Also initialize on page navigation (Twitter is SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Reinitialize on navigation
    setTimeout(() => {
      if (window.TwitterMoodScope) {
        window.TwitterMoodScope.processTweets();
      }
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });
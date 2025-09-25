/**
 * MoodScope YouTube Content Script
 * Analyzes sentiment on YouTube video comments
 * Author: Labib Bin Shahed
 */

class YouTubeMoodScope {
  constructor() {
    this.isActive = false;
    this.processedComments = new Set();
    this.processedDescriptions = new Set();
    this.sentimentData = { positive: 0, neutral: 0, negative: 0 };
    this.observer = null;
    this.settings = {
      sensitivity: 0.5,
      platforms: { youtube: true },
      notifications: { enabled: true, criticalOnly: false, keywordAlerts: true }
    };
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    await this.loadAnalysisState();
    
    if (this.isActive && this.settings.platforms.youtube) {
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
      console.log('MoodScope: Using default settings for YouTube');
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
          if (this.isActive && this.settings.platforms.youtube) {
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
    
    // Process existing content
    this.processContent();
    
    // Set up observer for new content
    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if new comments or video descriptions were added
              if (node.querySelector && (
                node.querySelector('ytd-comment-thread-renderer') ||
                node.querySelector('ytd-comment-renderer') ||
                node.querySelector('#content-text') ||
                node.querySelector('yt-attributed-string') ||
                node.matches('ytd-comment-thread-renderer') ||
                node.matches('ytd-comment-renderer')
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
          this.processContent();
        }, 500);
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('MoodScope: YouTube analysis started');
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
    
    console.log('MoodScope: YouTube analysis stopped');
  }
  
  processContent() {
    if (!this.isActive || !window.MoodScopeSentiment) return;
    
    // Process video description
    this.processVideoDescription();
    
    // Process comments
    this.processComments();
    
    this.updateSentimentData();
  }
  
  processVideoDescription() {
    // YouTube video description
    const descriptions = document.querySelectorAll([
      'ytd-video-secondary-info-renderer #content-text',
      'ytd-expandable-video-description-body-renderer #content-text',
      '#description yt-attributed-string',
      '#description-text'
    ].join(', '));
    
    descriptions.forEach(description => {
      const descId = this.getDescriptionId(description);
      if (!descId || this.processedDescriptions.has(descId)) return;
      
      this.processDescription(description, descId);
      this.processedDescriptions.add(descId);
    });
  }
  
  processComments() {
    // YouTube comments
    const comments = document.querySelectorAll([
      'ytd-comment-thread-renderer #content-text',
      'ytd-comment-renderer #content-text',
      'yt-attributed-string[slot="content"]'
    ].join(', '));
    
    comments.forEach(comment => {
      const commentId = this.getCommentId(comment);
      if (!commentId || this.processedComments.has(commentId)) return;
      
      this.processComment(comment, commentId);
      this.processedComments.add(commentId);
    });
  }
  
  getDescriptionId(description) {
    // Try to get description ID from parent elements
    const container = description.closest('ytd-video-secondary-info-renderer') ||
                     description.closest('ytd-expandable-video-description-body-renderer');
    
    if (container) {
      return 'video-description';
    }
    
    // Fallback to element position
    return this.getElementId(description);
  }
  
  getCommentId(comment) {
    // Try to get comment ID from parent elements
    const commentRenderer = comment.closest('ytd-comment-renderer') ||
                           comment.closest('ytd-comment-thread-renderer');
    
    if (commentRenderer) {
      const commentId = commentRenderer.getAttribute('id') ||
                       commentRenderer.querySelector('[data-cid]')?.getAttribute('data-cid');
      if (commentId) return commentId;
    }
    
    // Fallback to element position
    return this.getElementId(comment);
  }
  
  getElementId(element) {
    // Generate a unique ID based on element position and content
    const rect = element.getBoundingClientRect();
    const content = element.textContent.substring(0, 50);
    return `${rect.top}_${rect.left}_${content.replace(/\s+/g, '_')}`;
  }
  
  processDescription(description, descId) {
    const content = description.textContent;
    if (content && content.trim().length > 0) {
      this.analyzeAndHighlight(description, content, 'description');
    }
  }
  
  processComment(comment, commentId) {
    const commentText = comment.textContent;
    if (commentText && commentText.trim().length > 0) {
      this.analyzeAndHighlight(comment, commentText, 'comment');
    }
  }
  
  analyzeAndHighlight(element, text, type) {
    // Analyze sentiment
    const analysis = window.MoodScopeSentiment.analyzeSentiment(text);
    
    // Check for alert keywords
    const alertKeywords = window.MoodScopeSentiment.checkAlertKeywords(text);
    if (alertKeywords.length > 0 && this.settings.notifications.keywordAlerts) {
      this.showAlert(`Alert keywords found: ${alertKeywords.join(', ')}`, text.substring(0, 100));
    }
    
    // Add sentiment indicator
    this.addSentimentIndicator(element, analysis, type);
    
    // Highlight text
    this.highlightSentiment(element, analysis);
    
    // Update sentiment data
    this.sentimentData[analysis.sentiment]++;
  }
  
  addSentimentIndicator(element, analysis, type) {
    // Find appropriate container
    const container = element.closest('ytd-comment-thread-renderer') ||
                     element.closest('ytd-comment-renderer') ||
                     element.closest('ytd-video-secondary-info-renderer') ||
                     element.closest('ytd-expandable-video-description-body-renderer') ||
                     element.parentNode;
    
    if (!container) return;
    
    const existingIndicator = container.querySelector('.moodscope-sentiment-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // Create sentiment indicator
    const indicator = document.createElement('div');
    indicator.className = `moodscope-sentiment-indicator moodscope-${analysis.sentiment}`;
    indicator.innerHTML = `
      <span class="material-icons">${this.getSentimentIcon(analysis.sentiment)}</span>
      <span class="sentiment-score">${analysis.score.toFixed(2)}</span>
      <span class="content-type">${type}</span>
    `;
    
    // Add tooltip
    indicator.title = `${type} sentiment: ${analysis.sentiment} (${(analysis.confidence * 100).toFixed(1)}% confidence)`;
    
    // Insert indicator
    container.style.position = 'relative';
    container.appendChild(indicator);
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
        site: 'YouTube'
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
    // Filter comments
    const comments = document.querySelectorAll('ytd-comment-thread-renderer, ytd-comment-renderer');
    comments.forEach(comment => {
      const sentimentElement = comment.querySelector('[data-moodscope-sentiment]');
      if (sentimentElement) {
        const commentSentiment = sentimentElement.getAttribute('data-moodscope-sentiment');
        if (sentiment === 'all' || commentSentiment === sentiment) {
          comment.style.display = '';
        } else {
          comment.style.display = 'none';
        }
      }
    });
    
    // Filter video description
    const descriptions = document.querySelectorAll('ytd-video-secondary-info-renderer, ytd-expandable-video-description-body-renderer');
    descriptions.forEach(description => {
      const sentimentElement = description.querySelector('[data-moodscope-sentiment]');
      if (sentimentElement) {
        const descSentiment = sentimentElement.getAttribute('data-moodscope-sentiment');
        if (sentiment === 'all' || descSentiment === sentiment) {
          description.style.display = '';
        } else {
          description.style.display = 'none';
        }
      }
    });
  }
  
  resetFilter() {
    const comments = document.querySelectorAll('ytd-comment-thread-renderer, ytd-comment-renderer');
    comments.forEach(comment => {
      comment.style.display = '';
    });
    
    const descriptions = document.querySelectorAll('ytd-video-secondary-info-renderer, ytd-expandable-video-description-body-renderer');
    descriptions.forEach(description => {
      description.style.display = '';
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.YouTubeMoodScope = new YouTubeMoodScope();
  });
} else {
  window.YouTubeMoodScope = new YouTubeMoodScope();
}

// Also initialize on page navigation (YouTube is SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Reinitialize on navigation
    setTimeout(() => {
      if (window.YouTubeMoodScope) {
        window.YouTubeMoodScope.processContent();
      }
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// Handle YouTube's dynamic loading
setInterval(() => {
  if (window.YouTubeMoodScope && window.YouTubeMoodScope.isActive) {
    window.YouTubeMoodScope.processContent();
  }
}, 3000);
/**
 * MoodScope Reddit Content Script
 * Analyzes sentiment on Reddit posts and comments
 * Author: Labib Bin Shahed
 */

class RedditMoodScope {
  constructor() {
    this.isActive = false;
    this.processedPosts = new Set();
    this.processedComments = new Set();
    this.sentimentData = { positive: 0, neutral: 0, negative: 0 };
    this.observer = null;
    this.settings = {
      sensitivity: 0.5,
      platforms: { reddit: true },
      notifications: { enabled: true, criticalOnly: false, keywordAlerts: true }
    };
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    await this.loadAnalysisState();
    
    if (this.isActive && this.settings.platforms.reddit) {
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
      console.log('MoodScope: Using default settings for Reddit');
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
          if (this.isActive && this.settings.platforms.reddit) {
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
              // Check if new posts or comments were added
              if (node.querySelector && (
                node.querySelector('[data-testid="post-content"]') ||
                node.querySelector('.Comment') ||
                node.querySelector('[data-click-id="text"]') ||
                node.matches('[data-testid="post-content"]') ||
                node.matches('.Comment')
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
    
    console.log('MoodScope: Reddit analysis started');
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
    
    console.log('MoodScope: Reddit analysis stopped');
  }
  
  processContent() {
    if (!this.isActive || !window.MoodScopeSentiment) return;
    
    // Process posts
    this.processPosts();
    
    // Process comments
    this.processComments();
    
    this.updateSentimentData();
  }
  
  processPosts() {
    // New Reddit design
    const newPosts = document.querySelectorAll('[data-testid="post-content"]');
    newPosts.forEach(post => {
      const postId = this.getPostId(post);
      if (!postId || this.processedPosts.has(postId)) return;
      
      this.processPost(post, postId);
      this.processedPosts.add(postId);
    });
    
    // Old Reddit design
    const oldPosts = document.querySelectorAll('.thing[data-type="link"]');
    oldPosts.forEach(post => {
      const postId = post.getAttribute('data-fullname');
      if (!postId || this.processedPosts.has(postId)) return;
      
      this.processOldPost(post, postId);
      this.processedPosts.add(postId);
    });
  }
  
  processComments() {
    // New Reddit design
    const newComments = document.querySelectorAll('[data-testid="comment"]');
    newComments.forEach(comment => {
      const commentId = this.getCommentId(comment);
      if (!commentId || this.processedComments.has(commentId)) return;
      
      this.processComment(comment, commentId);
      this.processedComments.add(commentId);
    });
    
    // Old Reddit design
    const oldComments = document.querySelectorAll('.comment');
    oldComments.forEach(comment => {
      const commentId = comment.getAttribute('data-fullname');
      if (!commentId || this.processedComments.has(commentId)) return;
      
      this.processOldComment(comment, commentId);
      this.processedComments.add(commentId);
    });
  }
  
  getPostId(post) {
    // Try to get post ID from URL or data attributes
    const link = post.querySelector('a[href*="/comments/"]');
    if (link) {
      const match = link.href.match(/\/comments\/(\w+)/);
      if (match) return match[1];
    }
    
    // Fallback to element position
    return this.getElementId(post);
  }
  
  getCommentId(comment) {
    // Try to get comment ID from data attributes
    const commentData = comment.getAttribute('data-testid');
    if (commentData) return commentData;
    
    // Fallback to element position
    return this.getElementId(comment);
  }
  
  getElementId(element) {
    // Generate a unique ID based on element position and content
    const rect = element.getBoundingClientRect();
    const content = element.textContent.substring(0, 50);
    return `${rect.top}_${rect.left}_${content.replace(/\s+/g, '_')}`;
  }
  
  processPost(post, postId) {
    // Find post title
    const titleElement = post.querySelector('h3') || post.querySelector('[data-click-id="text"]');
    if (titleElement) {
      const title = titleElement.textContent;
      if (title && title.trim().length > 0) {
        this.analyzeAndHighlight(titleElement, title, 'post');
      }
    }
    
    // Find post content/text
    const contentElement = post.querySelector('[data-testid="post-content"] p') || 
                          post.querySelector('.usertext-body');
    if (contentElement) {
      const content = contentElement.textContent;
      if (content && content.trim().length > 0) {
        this.analyzeAndHighlight(contentElement, content, 'post');
      }
    }
  }
  
  processOldPost(post, postId) {
    // Old Reddit post title
    const titleElement = post.querySelector('.title a.title');
    if (titleElement) {
      const title = titleElement.textContent;
      if (title && title.trim().length > 0) {
        this.analyzeAndHighlight(titleElement, title, 'post');
      }
    }
    
    // Old Reddit post text
    const textElement = post.querySelector('.usertext-body');
    if (textElement) {
      const text = textElement.textContent;
      if (text && text.trim().length > 0) {
        this.analyzeAndHighlight(textElement, text, 'post');
      }
    }
  }
  
  processComment(comment, commentId) {
    const commentBody = comment.querySelector('[data-testid="comment"] > div > div:last-child') ||
                       comment.querySelector('.usertext-body');
    
    if (commentBody) {
      const text = commentBody.textContent;
      if (text && text.trim().length > 0) {
        this.analyzeAndHighlight(commentBody, text, 'comment');
      }
    }
  }
  
  processOldComment(comment, commentId) {
    const commentBody = comment.querySelector('.usertext-body');
    
    if (commentBody) {
      const text = commentBody.textContent;
      if (text && text.trim().length > 0) {
        this.analyzeAndHighlight(commentBody, text, 'comment');
      }
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
    // Remove existing indicator
    const container = element.closest('[data-testid="post-content"]') || 
                     element.closest('[data-testid="comment"]') ||
                     element.closest('.thing') ||
                     element.closest('.comment') ||
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
        site: 'Reddit'
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
    // Filter posts
    const posts = document.querySelectorAll('[data-testid="post-content"], .thing[data-type="link"]');
    posts.forEach(post => {
      const sentimentElement = post.querySelector('[data-moodscope-sentiment]');
      if (sentimentElement) {
        const postSentiment = sentimentElement.getAttribute('data-moodscope-sentiment');
        if (sentiment === 'all' || postSentiment === sentiment) {
          post.style.display = '';
        } else {
          post.style.display = 'none';
        }
      }
    });
    
    // Filter comments
    const comments = document.querySelectorAll('[data-testid="comment"], .comment');
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
  }
  
  resetFilter() {
    const posts = document.querySelectorAll('[data-testid="post-content"], .thing[data-type="link"]');
    posts.forEach(post => {
      post.style.display = '';
    });
    
    const comments = document.querySelectorAll('[data-testid="comment"], .comment');
    comments.forEach(comment => {
      comment.style.display = '';
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.RedditMoodScope = new RedditMoodScope();
  });
} else {
  window.RedditMoodScope = new RedditMoodScope();
}

// Also initialize on page navigation (Reddit can be SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Reinitialize on navigation
    setTimeout(() => {
      if (window.RedditMoodScope) {
        window.RedditMoodScope.processContent();
      }
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });
class MoodScopeAnalyzer {
  constructor() {
    this.settings = {
      sensitivity: 0.5,
      mode: 'hybrid',
      language: 'en'
    };
    this.observer = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupObserver();
    this.setupMessageListener();
    this.analyzeVisibleContent();
  }

  async loadSettings() {
    return new Promise(resolve => {
      chrome.storage.local.get(['settings'], result => {
        if (result.settings) {
          this.settings = { ...this.settings, ...result.settings };
        }
        resolve();
      });
    });
  }

  setupObserver() {
    if (this.observer) this.observer.disconnect();
    
    this.observer = new MutationObserver(mutations => {
      this.analyzeVisibleContent();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  analyzeVisibleContent() {
    const elements = this.getVisibleTextElements();
    elements.forEach(element => {
      if (!element.dataset.moodscopeAnalyzed) {
        this.processElement(element);
      }
    });
  }

  getVisibleTextElements() {
    const selectors = [
      'p', 'span', 'div', 'article', 'section',
      '[role="article"]', '[data-testid="tweetText"]',
      '.userContent', '.comment', '.post'
    ].join(',');
    
    return Array.from(document.querySelectorAll(selectors))
      .filter(el => this.isElementVisible(el));
  }

  isElementVisible(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  async processElement(element) {
    const text = element.innerText.trim();
    if (!text || text.length < 10) return;
    
    element.dataset.moodscopeAnalyzed = true;
    
    try {
      const analysis = await this.analyzeText(text);
      this.displayResults(element, analysis);
      this.saveAnalysis(analysis);
    } catch (error) {
      console.error('Analysis error:', error);
    }
  }

  async analyzeText(text) {
    // Use the same enhanced analysis as in popup.js
    const response = await chrome.runtime.sendMessage({
      type: 'analyzeText',
      text,
      settings: this.settings
    });
    
    return response || {
      sentiment: { score: 0, label: 'neutral' },
      emotion: 'neutral'
    };
  }

  displayResults(element, analysis) {
    const widget = this.createResultWidget(analysis);
    element.parentNode.insertBefore(widget, element.nextSibling);
  }

  createResultWidget(analysis) {
    const widget = document.createElement('div');
    widget.className = `moodscope-widget ${analysis.sentiment.label.replace(' ', '-')}`;
    
    widget.innerHTML = `
      <div class="moodscope-result">
        <span class="sentiment-icon ${analysis.sentiment.label.replace(' ', '-')}">
          ${this.getSentimentIcon(analysis.sentiment.label)}
        </span>
        <span class="sentiment-score">${analysis.sentiment.score.toFixed(2)}</span>
        <span class="emotion-badge ${analysis.emotion}">
          ${analysis.emotion}
        </span>
      </div>
    `;
    
    return widget;
  }

  getSentimentIcon(label) {
    const icons = {
      'very-positive': 'sentiment_very_satisfied',
      'positive': 'sentiment_satisfied',
      'neutral': 'sentiment_neutral',
      'negative': 'sentiment_dissatisfied',
      'very-negative': 'sentiment_very_dissatisfied'
    };
    return `<span class="material-icons">${icons[label] || 'sentiment_neutral'}</span>`;
  }

  saveAnalysis(analysis) {
    chrome.runtime.sendMessage({
      type: 'saveAnalysis',
      analysis: {
        ...analysis,
        text: analysis.text.substring(0, 200),
        timestamp: Date.now(),
        url: window.location.href
      }
    });
  }

  // Listen for settings changes
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'settingsUpdate') {
        this.settings = { ...this.settings, ...message.settings };
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new MoodScopeAnalyzer());
} else {
  new MoodScopeAnalyzer();
}

class SentimentAnalyzer {
  constructor() {
    this.observer = null;
    this.settings = {
      enabled: true,
      mode: 'combined',
      language: 'en',
      sensitivity: 0.5,
      keywords: {
        positive: {},
        negative: {},
        neutral: {}
      }
    };
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupObserver();
    this.analyzePage();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        if (result.settings) {
          this.settings = { ...this.settings, ...result.settings };
        }
        resolve();
      });
    });
  }

  setupObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      if (this.settings.enabled) {
        this.analyzePage();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  analyzePage() {
    if (!this.settings.enabled) return;

    const textElements = this.findTextElements();
    textElements.forEach((element) => {
      if (element.dataset.moodscopeProcessed) return;
      
      const text = element.textContent.trim();
      if (!text) return;

      const analysis = this.analyzeText(text);
      this.displayResults(element, analysis);
      
      element.dataset.moodscopeProcessed = 'true';
    });
  }

  findTextElements() {
    // Improved element detection for different platforms
    const selectors = [
      'div[role="article"]', // Twitter
      'div[data-ad-comet-preview="message"]', // Facebook
      'div.feed-shared-update-v2__commentary', // LinkedIn
      '.comment .usertext-body', // Reddit
      'div._a9zs span', // Instagram
      'div#content ytd-comment-renderer', // YouTube
      'p, span, div, article, section' // Fallback
    ];

    return Array.from(document.querySelectorAll(selectors.join(',')));
  }

  analyzeText(text) {
    // Improved analysis logic
    let sentimentScore = 0;
    let emotion = 'neutral';
    const words = text.toLowerCase().split(/\s+/);
    
    // Sentiment analysis
    words.forEach((word) => {
      if (this.settings.keywords.positive[word]) {
        sentimentScore += this.settings.sensitivity;
      } else if (this.settings.keywords.negative[word]) {
        sentimentScore -= this.settings.sensitivity;
      }
    });

    // Normalize score
    sentimentScore = Math.min(Math.max(sentimentScore, -1), 1);

    // Emotion detection (simplified example)
    if (sentimentScore > 0.3) emotion = 'happy';
    else if (sentimentScore < -0.3) emotion = 'angry';
    else if (text.includes('!')) emotion = 'excited';
    else if (text.includes('?')) emotion = 'confused';

    return {
      sentiment: sentimentScore,
      emotion,
      words: words.length
    };
  }

  displayResults(element, analysis) {
    // Remove any existing widgets
    const existingWidget = element.parentElement.querySelector('.moodscope-widget');
    if (existingWidget) existingWidget.remove();

    // Create new widget
    const widget = document.createElement('div');
    widget.className = 'moodscope-widget';
    
    // Set widget content based on analysis mode
    if (this.settings.mode === 'sentiment') {
      widget.innerHTML = this.createSentimentWidget(analysis);
    } else if (this.settings.mode === 'emotion') {
      widget.innerHTML = this.createEmotionWidget(analysis);
    } else {
      widget.innerHTML = this.createCombinedWidget(analysis);
    }

    // Insert widget
    element.parentElement.insertBefore(widget, element.nextSibling);

    // Save analysis data
    this.saveAnalysisData(analysis, element.textContent);
  }

  createSentimentWidget(analysis) {
    const icon = analysis.sentiment > 0 ? 'sentiment_satisfied' : 
                analysis.sentiment < 0 ? 'sentiment_dissatisfied' : 'sentiment_neutral';
    const color = analysis.sentiment > 0 ? '#4caf50' : 
                  analysis.sentiment < 0 ? '#f44336' : '#9e9e9e';
    
    return `
      <div class="sentiment-badge" style="background-color: ${color}">
        <span class="material-icons">${icon}</span>
        <span>${analysis.sentiment.toFixed(2)}</span>
      </div>
    `;
  }

  // Additional widget creation methods...

  saveAnalysisData(analysis, text) {
    const data = {
      ...analysis,
      text: text.substring(0, 100),
      timestamp: Date.now(),
      url: window.location.href
    };

    chrome.storage.local.get(['analysisHistory'], (result) => {
      const history = result.analysisHistory || [];
      history.push(data);
      chrome.storage.local.set({ analysisHistory: history.slice(-1000) });
    });
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    document.querySelectorAll('.moodscope-widget').forEach(el => el.remove());
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const analyzer = new SentimentAnalyzer();

  // Listen for settings changes
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'settingsUpdate') {
      analyzer.settings = { ...analyzer.settings, ...message.settings };
      analyzer.cleanup();
      analyzer.init();
    }
  });
});

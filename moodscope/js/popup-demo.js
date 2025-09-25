/**
 * MoodScope Demo - Real Working Sentiment Analysis
 * Actual sentiment analysis with real-time processing
 */

class MoodScopeDemo {
  constructor() {
    this.analyzer = new SentimentAnalyzer();
    this.currentTab = 'analyzer';
    this.analysisHistory = [];
    this.settings = {
      realtime: true,
      sensitivity: 5,
      showConfidence: true
    };
    this.stats = { positive: 0, neutral: 0, negative: 0 };
    
    console.log('MoodScope Demo: Initializing with real sentiment analysis');
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.setupTabs();
    this.loadSettings();
    this.updateStats();
    
    console.log('MoodScope Demo: Ready for real-time analysis');
    this.showToast('Real-time sentiment analyzer ready!', 'success');
  }
  
  setupEventListeners() {
    // Text analyzer with real-time analysis
    const textAnalyzer = document.getElementById('textAnalyzer');
    if (textAnalyzer) {
      textAnalyzer.addEventListener('input', () => {
        if (this.settings.realtime) {
          this.analyzeText();
        }
      });
      
      textAnalyzer.addEventListener('paste', () => {
        setTimeout(() => this.analyzeText(), 10);
      });
    }

    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Settings toggles
    const realtimeToggle = document.getElementById('realtimeToggle');
    if (realtimeToggle) {
      realtimeToggle.addEventListener('click', () => this.toggleRealtime());
    }

    const confidenceToggle = document.getElementById('confidenceToggle');
    if (confidenceToggle) {
      confidenceToggle.addEventListener('click', () => this.toggleConfidence());
    }

    // Sensitivity slider
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    if (sensitivitySlider) {
      sensitivitySlider.addEventListener('input', () => this.updateSensitivity());
    }

    // Action buttons
    const clearHistory = document.getElementById('clearHistory');
    if (clearHistory) {
      clearHistory.addEventListener('click', () => this.clearHistory());
    }

    const exportData = document.getElementById('exportData');
    if (exportData) {
      exportData.addEventListener('click', () => this.exportData());
    }

    console.log('MoodScope Demo: Event listeners set up');
  }
  
  setupTabs() {
    // Tabs are handled by event listeners
  }
  
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.toggle('active', button.getAttribute('data-tab') === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tabName);
    });
    
    this.currentTab = tabName;
    console.log('MoodScope Demo: Switched to tab:', tabName);
  }
  
  loadSettings() {
    // Load from localStorage if available
    const saved = localStorage.getItem('moodscope-demo-settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (e) {
        console.log('Failed to load saved settings, using defaults');
      }
    }
    
    // Update UI
    const realtimeToggle = document.getElementById('realtimeToggle');
    if (realtimeToggle) {
      realtimeToggle.classList.toggle('active', this.settings.realtime);
    }
    
    const confidenceToggle = document.getElementById('confidenceToggle');
    if (confidenceToggle) {
      confidenceToggle.classList.toggle('active', this.settings.showConfidence);
    }
    
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    if (sensitivitySlider) {
      sensitivitySlider.value = this.settings.sensitivity;
    }
  }
  
  saveSettings() {
    localStorage.setItem('moodscope-demo-settings', JSON.stringify(this.settings));
  }
  
  analyzeText() {
    const textAnalyzer = document.getElementById('textAnalyzer');
    const sentimentResult = document.getElementById('sentimentResult');
    
    if (!textAnalyzer || !sentimentResult) return;
    
    const text = textAnalyzer.value.trim();
    
    if (text.length === 0) {
      sentimentResult.style.display = 'none';
      return;
    }
    
    // Perform real sentiment analysis
    console.log('Analyzing text:', text.substring(0, 50) + '...');
    const result = this.analyzer.analyze(text);
    
    // Add to history if it's substantial analysis
    if (text.length > 10) {
      this.addToHistory(text, result);
    }
    
    // Update display
    this.displayResult(result);
    
    console.log('Analysis result:', result);
  }
  
  displayResult(result) {
    const sentimentResult = document.getElementById('sentimentResult');
    const confidenceScore = document.getElementById('confidenceScore');
    const resultDetails = document.getElementById('resultDetails');
    
    if (!sentimentResult) return;
    
    sentimentResult.style.display = 'block';
    
    // Update confidence score
    if (confidenceScore && this.settings.showConfidence) {
      confidenceScore.innerHTML = `
        <div class="confidence-bar">
          <div class="confidence-fill" style="width: ${result.confidence}%"></div>
        </div>
        <span class="confidence-text">${result.confidence}% confidence</span>
      `;
      confidenceScore.style.display = 'block';
    } else if (confidenceScore) {
      confidenceScore.style.display = 'none';
    }
    
    // Update result details
    if (resultDetails) {
      const sentimentClass = result.sentiment;
      const sentimentIcon = this.getSentimentIcon(result.sentiment);
      const sentimentLabel = result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1);
      
      resultDetails.innerHTML = `
        <div class="sentiment-display">
          <div class="sentiment-main ${sentimentClass}">
            <span class="material-icons">${sentimentIcon}</span>
            <span class="sentiment-label">${sentimentLabel}</span>
            <span class="sentiment-score">(${result.score > 0 ? '+' : ''}${result.score.toFixed(1)})</span>
          </div>
        </div>
        
        <div class="breakdown-display">
          <div class="breakdown-item positive">
            <span class="breakdown-label">Positive:</span>
            <div class="breakdown-bar">
              <div class="breakdown-fill" style="width: ${result.breakdown.positive}%"></div>
            </div>
            <span class="breakdown-value">${result.breakdown.positive}%</span>
          </div>
          
          <div class="breakdown-item neutral">
            <span class="breakdown-label">Neutral:</span>
            <div class="breakdown-bar">
              <div class="breakdown-fill" style="width: ${result.breakdown.neutral}%"></div>
            </div>
            <span class="breakdown-value">${result.breakdown.neutral}%</span>
          </div>
          
          <div class="breakdown-item negative">
            <span class="breakdown-label">Negative:</span>
            <div class="breakdown-bar">
              <div class="breakdown-fill" style="width: ${result.breakdown.negative}%"></div>
            </div>
            <span class="breakdown-value">${result.breakdown.negative}%</span>
          </div>
        </div>
        
        ${this.generateWordAnalysis(result.words)}
        
        <div class="analysis-details">
          <small>${result.details}</small>
        </div>
      `;
    }
  }
  
  generateWordAnalysis(words) {
    let html = '<div class="word-analysis">';
    
    ['positive', 'negative', 'neutral'].forEach(type => {
      if (words[type].length > 0) {
        const typeClass = type;
        html += `
          <div class="word-group ${typeClass}">
            <span class="word-group-label">${type.charAt(0).toUpperCase() + type.slice(1)} words:</span>
            <div class="word-tags">
              ${words[type].map(word => `<span class="word-tag ${typeClass}">${word}</span>`).join('')}
            </div>
          </div>
        `;
      }
    });
    
    html += '</div>';
    return html;
  }
  
  getSentimentIcon(sentiment) {
    switch (sentiment) {
      case 'positive': return 'sentiment_satisfied';
      case 'negative': return 'sentiment_dissatisfied';
      default: return 'sentiment_neutral';
    }
  }
  
  addToHistory(text, result) {
    const historyItem = {
      id: Date.now(),
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      fullText: text,
      result: result,
      timestamp: new Date().toISOString()
    };
    
    this.analysisHistory.unshift(historyItem);
    
    // Keep only last 50 analyses
    if (this.analysisHistory.length > 50) {
      this.analysisHistory = this.analysisHistory.slice(0, 50);
    }
    
    // Update stats
    this.stats[result.sentiment]++;
    this.updateStats();
    this.updateHistoryDisplay();
  }
  
  updateStats() {
    const positiveCount = document.getElementById('positiveCount');
    const neutralCount = document.getElementById('neutralCount');
    const negativeCount = document.getElementById('negativeCount');
    
    if (positiveCount) positiveCount.textContent = this.stats.positive;
    if (neutralCount) neutralCount.textContent = this.stats.neutral;
    if (negativeCount) negativeCount.textContent = this.stats.negative;
  }
  
  updateHistoryDisplay() {
    const analysisHistory = document.getElementById('analysisHistory');
    if (!analysisHistory) return;
    
    if (this.analysisHistory.length === 0) {
      analysisHistory.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">history</span>
          <div class="empty-state-title">No Analyses Yet</div>
          <div class="empty-state-desc">Start analyzing text to see your history</div>
        </div>
      `;
      return;
    }
    
    analysisHistory.innerHTML = this.analysisHistory.slice(0, 10).map(item => `
      <div class="history-item">
        <div class="history-content">
          <div class="history-text">"${item.text}"</div>
          <div class="history-result">
            <span class="sentiment-badge ${item.result.sentiment}">
              <span class="material-icons">${this.getSentimentIcon(item.result.sentiment)}</span>
              ${item.result.sentiment}
            </span>
            <span class="history-confidence">${item.result.confidence}%</span>
          </div>
        </div>
        <div class="history-time">${new Date(item.timestamp).toLocaleTimeString()}</div>
      </div>
    `).join('');
  }
  
  analyzeSample(text) {
    const textAnalyzer = document.getElementById('textAnalyzer');
    if (textAnalyzer) {
      textAnalyzer.value = text;
      this.switchTab('analyzer');
      this.analyzeText();
      this.showToast('Sample text analyzed!', 'success');
    }
  }
  
  toggleRealtime() {
    this.settings.realtime = !this.settings.realtime;
    const toggle = document.getElementById('realtimeToggle');
    if (toggle) {
      toggle.classList.toggle('active', this.settings.realtime);
    }
    this.saveSettings();
    this.showToast(
      this.settings.realtime ? 'Real-time analysis enabled' : 'Real-time analysis disabled',
      'success'
    );
  }
  
  toggleConfidence() {
    this.settings.showConfidence = !this.settings.showConfidence;
    const toggle = document.getElementById('confidenceToggle');
    if (toggle) {
      toggle.classList.toggle('active', this.settings.showConfidence);
    }
    this.saveSettings();
    
    // Re-analyze current text to update display
    if (document.getElementById('textAnalyzer').value.trim()) {
      this.analyzeText();
    }
    
    this.showToast(
      this.settings.showConfidence ? 'Confidence scores shown' : 'Confidence scores hidden',
      'success'
    );
  }
  
  updateSensitivity() {
    const slider = document.getElementById('sensitivitySlider');
    if (slider) {
      this.settings.sensitivity = parseInt(slider.value);
      this.saveSettings();
      this.showToast('Sensitivity updated', 'success');
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
    this.showToast(
      document.body.classList.contains('dark-theme') ? 'Dark theme enabled' : 'Light theme enabled',
      'success'
    );
  }
  
  clearHistory() {
    this.analysisHistory = [];
    this.stats = { positive: 0, neutral: 0, negative: 0 };
    this.updateStats();
    this.updateHistoryDisplay();
    this.showToast('History cleared', 'success');
  }
  
  exportData() {
    const data = {
      timestamp: new Date().toISOString(),
      statistics: this.stats,
      settings: this.settings,
      history: this.analysisHistory,
      summary: {
        total_analyses: this.analysisHistory.length,
        average_confidence: this.analysisHistory.length > 0 
          ? Math.round(this.analysisHistory.reduce((sum, item) => sum + item.result.confidence, 0) / this.analysisHistory.length)
          : 0
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodscope-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('Analysis data exported!', 'success');
  }
  
  showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.demo-toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = 'demo-toast';
    toast.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      padding: 12px 16px;
      background: ${this.getToastColor(type)};
      color: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease-out;
      max-width: 280px;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  getToastColor(type) {
    switch(type) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'success': return '#10b981';
      default: return '#3b82f6';
    }
  }
}

// Add CSS for demo-specific styling
const demoStyle = document.createElement('style');
demoStyle.textContent = `
  /* Demo-specific styles */
  .sample-texts {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 16px;
  }
  
  .sample-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg-primary);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 14px;
  }
  
  .sample-btn:hover {
    border-color: var(--primary);
    background: var(--primary-50);
    transform: translateY(-1px);
  }
  
  .sample-btn.positive:hover { border-color: var(--success); background: var(--success-50); }
  .sample-btn.negative:hover { border-color: var(--error); background: var(--error-50); }
  .sample-btn.neutral:hover { border-color: var(--gray-400); background: var(--gray-50); }
  
  .sentiment-display {
    margin: 16px 0;
    padding: 16px;
    background: var(--gray-50);
    border-radius: 8px;
    text-align: center;
  }
  
  .sentiment-main {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
  }
  
  .sentiment-main.positive { color: var(--success); }
  .sentiment-main.negative { color: var(--error); }
  .sentiment-main.neutral { color: var(--gray-600); }
  
  .sentiment-score {
    font-size: 14px;
    opacity: 0.7;
  }
  
  .breakdown-display {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 16px 0;
  }
  
  .breakdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  
  .breakdown-label {
    min-width: 60px;
    font-weight: 500;
  }
  
  .breakdown-bar {
    flex: 1;
    height: 6px;
    background: var(--gray-200);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .breakdown-fill {
    height: 100%;
    transition: width 0.3s ease;
  }
  
  .breakdown-item.positive .breakdown-fill { background: var(--success); }
  .breakdown-item.negative .breakdown-fill { background: var(--error); }
  .breakdown-item.neutral .breakdown-fill { background: var(--gray-400); }
  
  .breakdown-value {
    min-width: 35px;
    text-align: right;
    font-weight: 500;
  }
  
  .confidence-bar {
    height: 8px;
    background: var(--gray-200);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 4px;
  }
  
  .confidence-fill {
    height: 100%;
    background: var(--primary);
    transition: width 0.3s ease;
    border-radius: 4px;
  }
  
  .confidence-text {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .word-analysis {
    margin: 16px 0;
    padding: 12px;
    background: var(--gray-50);
    border-radius: 6px;
  }
  
  .word-group {
    margin-bottom: 8px;
  }
  
  .word-group:last-child {
    margin-bottom: 0;
  }
  
  .word-group-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--text-secondary);
  }
  
  .word-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .word-tag {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }
  
  .word-tag.positive { background: var(--success-100); color: var(--success); }
  .word-tag.negative { background: var(--error-100); color: var(--error); }
  .word-tag.neutral { background: var(--gray-100); color: var(--gray-600); }
  
  .analysis-details {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border-light);
  }
  
  .analysis-details small {
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.4;
  }
  
  .history-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid var(--border-light);
    border-radius: 6px;
    margin-bottom: 8px;
    background: var(--bg-primary);
  }
  
  .history-content {
    flex: 1;
  }
  
  .history-text {
    font-size: 13px;
    color: var(--text-primary);
    margin-bottom: 6px;
    line-height: 1.4;
  }
  
  .history-result {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .sentiment-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }
  
  .sentiment-badge.positive { background: var(--success-100); color: var(--success); }
  .sentiment-badge.negative { background: var(--error-100); color: var(--error); }
  .sentiment-badge.neutral { background: var(--gray-100); color: var(--gray-600); }
  
  .sentiment-badge .material-icons {
    font-size: 14px;
  }
  
  .history-confidence {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 500;
  }
  
  .history-time {
    font-size: 11px;
    color: var(--text-muted);
    margin-left: 12px;
    white-space: nowrap;
  }
  
  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
  }
  
  .demo-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
  }
  
  .stat-label {
    color: var(--text-secondary);
  }
  
  .stat-value {
    font-weight: 500;
    color: var(--text-primary);
  }
`;
document.head.appendChild(demoStyle);

// Initialize the demo
document.addEventListener('DOMContentLoaded', () => {
  console.log('MoodScope Demo: DOM loaded, initializing real sentiment analysis');
  window.moodScope = new MoodScopeDemo();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
  console.log('MoodScope Demo: DOM ready, initializing immediately');
  window.moodScope = new MoodScopeDemo();
}
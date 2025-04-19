document.addEventListener('DOMContentLoaded', async function() {
  // DOM Elements
  const themeToggle = document.getElementById('themeToggle');
  const analysisMode = document.getElementById('analysisMode');
  const sensitivity = document.getElementById('sensitivity');
  const sensitivityValue = document.getElementById('sensitivityValue');
  const language = document.getElementById('language');
  const chartType = document.getElementById('chartType');
  const resultDisplay = document.getElementById('resultDisplay');
  const ctx = document.getElementById('sentimentChart').getContext('2d');

  // Initialize Chart
  let sentimentChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: getChartOptions()
  });

  // Load saved settings
  chrome.storage.local.get(['settings', 'analysisHistory'], function(result) {
    const settings = result.settings || {};
    const history = result.analysisHistory || [];
    
    // Apply settings
    if (settings.theme) {
      themeToggle.checked = settings.theme === 'dark';
      document.body.classList.toggle('dark-mode', settings.theme === 'dark');
    }
    
    if (settings.analysisMode) {
      analysisMode.value = settings.analysisMode;
    }
    
    if (settings.sensitivity) {
      sensitivity.value = settings.sensitivity;
      sensitivityValue.textContent = settings.sensitivity;
    }
    
    if (settings.language) {
      language.value = settings.language;
    }
    
    if (settings.chartType) {
      chartType.value = settings.chartType;
      updateChart(history, settings.chartType);
    }
    
    updateResultsDisplay(history);
  });

  // Theme Toggle
  themeToggle.addEventListener('change', function() {
    const isDark = this.checked;
    document.body.classList.toggle('dark-mode', isDark);
    saveSetting('theme', isDark ? 'dark' : 'light');
    updateChartOptions();
  });

  // Analysis Controls
  analysisMode.addEventListener('change', function() {
    saveSetting('analysisMode', this.value);
    analyzeCurrentTab();
  });

  sensitivity.addEventListener('input', function() {
    const value = parseFloat(this.value);
    sensitivityValue.textContent = value.toFixed(1);
    saveSetting('sensitivity', value);
  });

  language.addEventListener('change', function() {
    saveSetting('language', this.value);
    analyzeCurrentTab();
  });

  chartType.addEventListener('change', function() {
    saveSetting('chartType', this.value);
    chrome.storage.local.get(['analysisHistory'], function(result) {
      updateChart(result.analysisHistory || [], this.value);
    }.bind(this));
  });

  // Enhanced Sentiment Analysis
  async function analyzeText(text, mode = 'hybrid', lang = 'en') {
    try {
      // Initialize NLP with compromise
      const nlp = (await import('https://cdn.jsdelivr.net/npm/compromise')).default;
      let doc = nlp(text);
      
      // Enhanced sentiment analysis
      let sentimentScore = 0;
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      
      // Tokenize and analyze each sentence
      const sentences = doc.sentences().out('array');
      sentences.forEach(sentence => {
        const sentenceDoc = nlp(sentence);
        
        // Enhanced sentiment scoring
        const sentiment = analyzeSentence(sentenceDoc, lang);
        sentimentScore += sentiment.score;
        
        // Count sentiment types
        if (sentiment.score > 0.2) positiveCount++;
        else if (sentiment.score < -0.2) negativeCount++;
        else neutralCount++;
      });
      
      // Normalize score
      sentimentScore = sentimentScore / Math.max(sentences.length, 1);
      
      // Determine emotion
      const emotion = detectEmotion(text, sentimentScore, lang);
      
      return {
        sentiment: {
          score: parseFloat(sentimentScore.toFixed(2)),
          label: getSentimentLabel(sentimentScore),
          positive: positiveCount,
          negative: negativeCount,
          neutral: neutralCount
        },
        emotion,
        text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Analysis error:', error);
      return {
        sentiment: { score: 0, label: 'neutral' },
        emotion: 'neutral',
        text: '',
        timestamp: Date.now()
      };
    }
  }

  function analyzeSentence(doc, lang) {
    // Implement language-specific analysis rules
    let score = 0;
    
    // Positive terms
    const positiveTerms = {
      en: ['good', 'great', 'excellent', 'happy', 'love'],
      es: ['bueno', 'excelente', 'feliz', 'amor'],
      fr: ['bon', 'excellent', 'heureux', 'amour']
    };
    
    // Negative terms
    const negativeTerms = {
      en: ['bad', 'terrible', 'awful', 'hate', 'sad'],
      es: ['malo', 'terrible', 'odio', 'triste'],
      fr: ['mauvais', 'terrible', 'haine', 'triste']
    };
    
    // Analyze terms
    positiveTerms[lang].forEach(term => {
      if (doc.has(term)) score += 0.5;
    });
    
    negativeTerms[lang].forEach(term => {
      if (doc.has(term)) score -= 0.5;
    });
    
    // Analyze modifiers
    if (doc.has('very') || doc.has('really')) {
      score *= 1.5;
    }
    
    // Analyze negations
    if (doc.has('not') || doc.has('no'))) {
      score *= -0.8;
    }
    
    // Analyze punctuation
    if (doc.has('!')) score *= 1.2;
    if (doc.has('?')) score *= 0.8;
    
    return { score: Math.min(Math.max(score, -1), 1) };
  }

  function detectEmotion(text, sentimentScore, lang) {
    // Enhanced emotion detection
    const emotions = {
      en: {
        happy: ['happy', 'joy', 'excited', 'awesome'],
        angry: ['angry', 'mad', 'furious', 'hate'],
        sad: ['sad', 'depressed', 'unhappy', 'cry'],
        fearful: ['scared', 'fear', 'afraid', 'anxious'],
        surprised: ['surprise', 'wow', 'amazing', 'shocked']
      },
      // Add other languages...
    };
    
    const textLower = text.toLowerCase();
    let detectedEmotion = 'neutral';
    
    // Check for specific emotion words
    for (const [emotion, words] of Object.entries(emotions[lang])) {
      if (words.some(word => textLower.includes(word))) {
        detectedEmotion = emotion;
        break;
      }
    }
    
    // Fallback to sentiment-based emotion
    if (detectedEmotion === 'neutral') {
      if (sentimentScore > 0.5) detectedEmotion = 'happy';
      else if (sentimentScore < -0.5) detectedEmotion = 'angry';
      else if (sentimentScore < 0) detectedEmotion = 'sad';
    }
    
    return detectedEmotion;
  }

  function getSentimentLabel(score) {
    if (score > 0.5) return 'very positive';
    if (score > 0.2) return 'positive';
    if (score < -0.5) return 'very negative';
    if (score < -0.2) return 'negative';
    return 'neutral';
  }

  // Data Visualization
  function updateChart(history, type = 'line') {
    const labels = [];
    const sentimentData = [];
    const emotionCounts = {
      happy: 0,
      angry: 0,
      sad: 0,
      fearful: 0,
      surprised: 0,
      neutral: 0
    };
    
    // Process history data
    history.slice(-30).forEach((item, index) => {
      labels.push(new Date(item.timestamp).toLocaleTimeString());
      sentimentData.push(item.sentiment.score);
      
      if (item.emotion && emotionCounts.hasOwnProperty(item.emotion)) {
        emotionCounts[item.emotion]++;
      }
    });
    
    // Update chart based on type
    if (type === 'line') {
      sentimentChart.data.labels = labels;
      sentimentChart.data.datasets = [{
        label: 'Sentiment Score',
        data: sentimentData,
        borderColor: 'rgba(66, 133, 244, 1)',
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        fill: true
      }];
      sentimentChart.options.scales.y.min = -1;
      sentimentChart.options.scales.y.max = 1;
    } else if (type === 'bar') {
      sentimentChart.data.labels = ['Positive', 'Neutral', 'Negative'];
      sentimentChart.data.datasets = [{
        label: 'Sentiment Distribution',
        data: [
          history.filter(h => h.sentiment.score > 0.2).length,
          history.filter(h => h.sentiment.score >= -0.2 && h.sentiment.score <= 0.2).length,
          history.filter(h => h.sentiment.score < -0.2).length
        ],
        backgroundColor: [
          'rgba(52, 168, 83, 0.7)',
          'rgba(251, 188, 5, 0.7)',
          'rgba(234, 67, 53, 0.7)'
        ],
        borderColor: [
          'rgba(52, 168, 83, 1)',
          'rgba(251, 188, 5, 1)',
          'rgba(234, 67, 53, 1)'
        ],
        borderWidth: 1
      }];
    } else if (type === 'pie') {
      sentimentChart.data.labels = Object.keys(emotionCounts);
      sentimentChart.data.datasets = [{
        label: 'Emotion Breakdown',
        data: Object.values(emotionCounts),
        backgroundColor: [
          'rgba(52, 168, 83, 0.7)',
          'rgba(234, 67, 53, 0.7)',
          'rgba(66, 133, 244, 0.7)',
          'rgba(251, 188, 5, 0.7)',
          'rgba(171, 71, 188, 0.7)',
          'rgba(120, 144, 156, 0.7)'
        ],
        borderWidth: 1
      }];
    }
    
    sentimentChart.type = type;
    sentimentChart.update();
  }

  function getChartOptions() {
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#E8EAED' : '#202124';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: textColor }
        },
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor }
        }
      }
    };
  }

  function updateChartOptions() {
    sentimentChart.options = getChartOptions();
    sentimentChart.update();
  }

  // Results Display
  function updateResultsDisplay(history) {
    if (history.length === 0) {
      resultDisplay.innerHTML = `
        <div class="result-item">
          <p>No analysis results yet.</p>
          <p>Browse social media to see sentiment analysis.</p>
        </div>
      `;
      return;
    }
    
    const latest = history[history.length - 1];
    let html = `
      <div class="result-item sentiment-${latest.sentiment.label.replace(' ', '-')}">
        <h3>${capitalizeFirstLetter(latest.sentiment.label)} Sentiment</h3>
        <p>Score: <strong>${latest.sentiment.score}</strong></p>
        <p>Detected Emotion: <strong>${capitalizeFirstLetter(latest.emotion)}</strong></p>
        ${latest.text ? `<div class="text-sample"><p>${latest.text}</p></div>` : ''}
      </div>
    `;
    
    resultDisplay.innerHTML = html;
  }

  // Helper Functions
  function saveSetting(key, value) {
    chrome.storage.local.get(['settings'], function(result) {
      const settings = result.settings || {};
      settings[key] = value;
      chrome.storage.local.set({ settings });
    });
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Analyze current tab
  async function analyzeCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
      if (tabs[0]) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: getPageTextContent
        });
        
        if (results && results[0] && results[0].result) {
          const analysis = await analyzeText(
            results[0].result,
            analysisMode.value,
            language.value
          );
          
          chrome.storage.local.get(['analysisHistory'], function(result) {
            const history = result.analysisHistory || [];
            history.push(analysis);
            chrome.storage.local.set({ 
              analysisHistory: history.slice(-100),
              lastAnalysis: analysis
            });
            
            updateResultsDisplay(history);
            updateChart(history, chartType.value);
          });
        }
      }
    });
  }

  // Function to get page text content
  function getPageTextContent() {
    return document.body.innerText;
  }
});

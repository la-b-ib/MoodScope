// Enhanced background service worker for MoodScope Pro+
const ANALYSIS_HISTORY_LIMIT = 500;
const DATA_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  // Set default settings
  await chrome.storage.local.set({
    settings: {
      theme: 'light',
      analysisMode: 'hybrid',
      sensitivity: 0.5,
      language: 'en',
      chartType: 'line',
      highlightColor: 'gradient',
      fontSize: 'medium'
    },
    analysisHistory: [],
    customKeywords: {
      en: {
        positive: ['happy', 'good', 'great', 'excellent', 'love'],
        negative: ['sad', 'bad', 'terrible', 'awful', 'hate'],
        neutral: ['ok', 'maybe', 'possibly', 'perhaps']
      }
    }
  });

  // Create periodic cleanup alarm
  chrome.alarms.create('dataCleanup', {
    periodInMinutes: 24 * 60 // 24 hours
  });

  console.log('MoodScope Pro+ initialized');
});

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'analyzeText':
      handleTextAnalysis(request, sender, sendResponse);
      return true; // Required for async response

    case 'saveAnalysis':
      handleSaveAnalysis(request);
      break;

    case 'getHistory':
      handleGetHistory(request, sendResponse);
      return true;

    case 'exportData':
      handleDataExport(request, sendResponse);
      return true;

    case 'importData':
      handleDataImport(request, sendResponse);
      return true;

    case 'clearData':
      handleClearData(sendResponse);
      return true;

    default:
      console.warn('Unknown message type:', request.type);
  }
});

// Handle text analysis requests
async function handleTextAnalysis(request, sender, sendResponse) {
  try {
    const { text, settings } = request;
    const result = await performAnalysis(text, settings);
    sendResponse(result);
  } catch (error) {
    console.error('Analysis error:', error);
    sendResponse({
      sentiment: { score: 0, label: 'neutral' },
      emotion: 'neutral'
    });
  }
}

// Enhanced text analysis
async function performAnalysis(text, settings) {
  // Load NLP library dynamically
  const nlp = await import('https://cdn.jsdelivr.net/npm/compromise');
  const doc = nlp.default(text);
  
  // Get language-specific keywords
  const lang = settings?.language || 'en';
  const customKeywords = await getCustomKeywords(lang);

  // Enhanced sentiment analysis
  const sentiment = analyzeSentiment(doc, customKeywords, settings?.sensitivity);
  
  // Emotion detection
  const emotion = detectEmotion(doc, sentiment.score, lang);
  
  return {
    sentiment,
    emotion,
    text: text.substring(0, 200),
    timestamp: Date.now(),
    language: lang
  };
}

// Sentiment analysis algorithm
function analyzeSentiment(doc, keywords, sensitivity = 0.5) {
  let score = 0;
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  // Analyze each term
  doc.terms().forEach(term => {
    const text = term.text().toLowerCase();
    const { tags } = term;

    // Check custom keywords first
    if (keywords.positive.includes(text)) {
      score += 0.75 * sensitivity;
      positive++;
    } else if (keywords.negative.includes(text)) {
      score -= 0.75 * sensitivity;
      negative++;
    } else if (keywords.neutral.includes(text)) {
      neutral++;
    }
    // Add NLP-based analysis here...
  });

  // Normalize score
  score = Math.max(-1, Math.min(1, score));
  
  return {
    score: parseFloat(score.toFixed(2)),
    label: getSentimentLabel(score),
    positive,
    negative,
    neutral
  };
}

// Emotion detection
function detectEmotion(doc, sentimentScore, lang) {
  const emotions = {
    en: {
      happy: ['happy', 'joy', 'excited'],
      angry: ['angry', 'mad', 'furious'],
      sad: ['sad', 'depressed', 'unhappy'],
      fearful: ['scared', 'afraid', 'fear'],
      surprised: ['surprised', 'amazed', 'shocked']
    }
    // Add other languages...
  };

  const text = doc.text().toLowerCase();
  let detectedEmotion = 'neutral';

  // Check for emotion keywords
  for (const [emotion, words] of Object.entries(emotions[lang])) {
    if (words.some(word => text.includes(word))) {
      detectedEmotion = emotion;
      break;
    }
  }

  // Fallback to sentiment-based detection
  if (detectedEmotion === 'neutral') {
    if (sentimentScore > 0.6) return 'happy';
    if (sentimentScore > 0.3) return 'positive';
    if (sentimentScore < -0.6) return 'angry';
    if (sentimentScore < -0.3) return 'sad';
  }

  return detectedEmotion;
}

// Handle saving analysis results
async function handleSaveAnalysis(request) {
  const { analysis } = request;
  
  const { analysisHistory } = await chrome.storage.local.get('analysisHistory');
  const updatedHistory = [analysis, ...(analysisHistory || [])]
    .slice(0, ANALYSIS_HISTORY_LIMIT);
  
  await chrome.storage.local.set({
    analysisHistory: updatedHistory,
    lastAnalysis: analysis
  });

  // Notify UI about new analysis
  chrome.runtime.sendMessage({
    type: 'newAnalysis',
    analysis
  });
}

// Data export handler
async function handleDataExport(request, sendResponse) {
  try {
    const data = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    await chrome.downloads.download({
      url,
      filename: `moodscope_export_${new Date().toISOString().slice(0,10)}.json`,
      saveAs: true
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Export failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Data import handler
async function handleDataImport(request, sendResponse) {
  try {
    // Validate imported data
    if (!request.data || typeof request.data !== 'object') {
      throw new Error('Invalid data format');
    }
    
    // Only import known keys
    const validKeys = ['settings', 'analysisHistory', 'customKeywords'];
    const importData = {};
    
    for (const key of validKeys) {
      if (request.data[key]) {
        importData[key] = request.data[key];
      }
    }
    
    await chrome.storage.local.set(importData);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Import failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Data cleanup handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dataCleanup') {
    await cleanOldData();
  }
});

// Clean old data
async function cleanOldData() {
  const { analysisHistory } = await chrome.storage.local.get('analysisHistory');
  if (!analysisHistory) return;

  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const filtered = analysisHistory.filter(item => item.timestamp > oneWeekAgo);

  await chrome.storage.local.set({ analysisHistory: filtered });
  console.log('Data cleanup completed. Removed', analysisHistory.length - filtered.length, 'old entries');
}

// Helper functions
function getSentimentLabel(score) {
  if (score > 0.75) return 'very positive';
  if (score > 0.25) return 'positive';
  if (score < -0.75) return 'very negative';
  if (score < -0.25) return 'negative';
  return 'neutral';
}

async function getCustomKeywords(lang) {
  const { customKeywords } = await chrome.storage.local.get('customKeywords');
  return {
    positive: [...new Set([...customKeywords[lang].positive])],
    negative: [...new Set([...customKeywords[lang].negative])],
    neutral: [...new Set([...customKeywords[lang].neutral])]
  };
}

// Handle history requests
async function handleGetHistory(request, sendResponse) {
  const { analysisHistory } = await chrome.storage.local.get('analysisHistory');
  sendResponse(analysisHistory || []);
}

// Handle data clearing
async function handleClearData(sendResponse) {
  try {
    await chrome.storage.local.clear();
    await chrome.storage.local.set({
      settings: {
        theme: 'light',
        analysisMode: 'hybrid',
        sensitivity: 0.5,
        language: 'en'
      },
      analysisHistory: []
    });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Clear data failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('MoodScope Pro+ service worker started');
});

setInterval(() => {
  // Keep-alive ping
}, 30 * 1000);

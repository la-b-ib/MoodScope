/**
 * MoodScope Sentiment Analysis Engine
 * Client-side sentiment analysis for social media content
 * Author: Labib Bin Shahed
 */

class SentimentEngine {
  constructor() {
    this.sensitivity = 0.5; // Default sensitivity (0-1)
    this.customKeywords = {
      positive: [],
      negative: [],
      neutral: []
    };
    this.alertKeywords = [];
    
    // Pre-defined sentiment lexicon
    this.lexicon = {
      positive: [
        'amazing', 'awesome', 'brilliant', 'excellent', 'fantastic', 'great', 'incredible',
        'love', 'wonderful', 'perfect', 'outstanding', 'superb', 'magnificent', 'beautiful',
        'happy', 'joy', 'excited', 'thrilled', 'delighted', 'pleased', 'satisfied',
        'good', 'nice', 'cool', 'sweet', 'fun', 'enjoy', 'like', 'best', 'favorite',
        'thank', 'thanks', 'grateful', 'appreciate', 'blessed', 'lucky', 'proud',
        'success', 'win', 'victory', 'achieve', 'accomplish', 'triumph', 'celebrate'
      ],
      negative: [
        'awful', 'terrible', 'horrible', 'disgusting', 'hate', 'worst', 'bad',
        'disappointing', 'frustrating', 'annoying', 'stupid', 'ridiculous', 'pathetic',
        'sad', 'angry', 'mad', 'furious', 'upset', 'depressed', 'miserable',
        'fail', 'failure', 'lose', 'lost', 'broken', 'wrong', 'problem', 'issue',
        'disaster', 'crisis', 'nightmare', 'chaos', 'mess', 'trouble', 'worry',
        'sick', 'tired', 'exhausted', 'stressed', 'overwhelmed', 'confused',
        'sorry', 'apologize', 'regret', 'mistake', 'error', 'fault', 'blame'
      ],
      neutral: [
        'okay', 'fine', 'normal', 'average', 'standard', 'regular', 'typical',
        'maybe', 'perhaps', 'possibly', 'probably', 'might', 'could', 'would',
        'think', 'believe', 'consider', 'suppose', 'assume', 'guess', 'wonder'
      ]
    };
    
    this.intensifiers = {
      high: ['very', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely', 'really', 'so', 'super'],
      medium: ['quite', 'rather', 'pretty', 'fairly', 'somewhat', 'kind of', 'sort of'],
      low: ['a bit', 'slightly', 'little', 'barely', 'hardly']
    };
    
    this.negators = ['not', 'no', 'never', 'nothing', 'nobody', 'nowhere', 'neither', 'nor', "don't", "won't", "can't", "shouldn't"];
    
    this.loadSettings();
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'moodscope_sensitivity',
        'moodscope_custom_keywords',
        'moodscope_alert_keywords'
      ]);
      
      if (result.moodscope_sensitivity !== undefined) {
        this.sensitivity = result.moodscope_sensitivity;
      }
      
      if (result.moodscope_custom_keywords) {
        this.customKeywords = result.moodscope_custom_keywords;
      }
      
      if (result.moodscope_alert_keywords) {
        this.alertKeywords = result.moodscope_alert_keywords;
      }
    } catch (error) {
      console.log('MoodScope: Using default settings');
    }
  }
  
  preprocessText(text) {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  tokenize(text) {
    return this.preprocessText(text).split(' ').filter(word => word.length > 0);
  }
  
  analyzeSentiment(text) {
    if (!text || text.trim().length === 0) {
      return { sentiment: 'neutral', score: 0, confidence: 0 };
    }
    
    const tokens = this.tokenize(text);
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;
    let totalWords = 0;
    
    for (let i = 0; i < tokens.length; i++) {
      const word = tokens[i];
      let wordScore = 0;
      let sentiment = null;
      
      // Check custom keywords first
      if (this.customKeywords.positive.includes(word)) {
        wordScore = 1;
        sentiment = 'positive';
      } else if (this.customKeywords.negative.includes(word)) {
        wordScore = 1;
        sentiment = 'negative';
      } else if (this.customKeywords.neutral.includes(word)) {
        wordScore = 1;
        sentiment = 'neutral';
      }
      // Check built-in lexicon
      else if (this.lexicon.positive.includes(word)) {
        wordScore = 1;
        sentiment = 'positive';
      } else if (this.lexicon.negative.includes(word)) {
        wordScore = 1;
        sentiment = 'negative';
      } else if (this.lexicon.neutral.includes(word)) {
        wordScore = 1;
        sentiment = 'neutral';
      }
      
      if (sentiment) {
        // Check for intensifiers
        let intensifier = 1;
        if (i > 0) {
          const prevWord = tokens[i - 1];
          if (this.intensifiers.high.includes(prevWord)) intensifier = 1.5;
          else if (this.intensifiers.medium.includes(prevWord)) intensifier = 1.25;
          else if (this.intensifiers.low.includes(prevWord)) intensifier = 0.75;
        }
        
        // Check for negation
        let isNegated = false;
        for (let j = Math.max(0, i - 3); j < i; j++) {
          if (this.negators.includes(tokens[j])) {
            isNegated = true;
            break;
          }
        }
        
        const adjustedScore = wordScore * intensifier;
        
        if (isNegated) {
          // Flip sentiment if negated
          if (sentiment === 'positive') {
            negativeScore += adjustedScore;
          } else if (sentiment === 'negative') {
            positiveScore += adjustedScore;
          } else {
            neutralScore += adjustedScore;
          }
        } else {
          if (sentiment === 'positive') {
            positiveScore += adjustedScore;
          } else if (sentiment === 'negative') {
            negativeScore += adjustedScore;
          } else {
            neutralScore += adjustedScore;
          }
        }
        
        totalWords++;
      }
    }
    
    // Calculate final sentiment
    const totalScore = positiveScore + negativeScore + neutralScore;
    
    if (totalScore === 0) {
      return { sentiment: 'neutral', score: 0, confidence: 0 };
    }
    
    const positiveRatio = positiveScore / totalScore;
    const negativeRatio = negativeScore / totalScore;
    const neutralRatio = neutralScore / totalScore;
    
    // Apply sensitivity threshold
    const threshold = this.sensitivity;
    let finalSentiment = 'neutral';
    let score = 0;
    let confidence = 0;
    
    if (positiveRatio > negativeRatio && positiveRatio > neutralRatio) {
      if (positiveRatio >= threshold) {
        finalSentiment = 'positive';
        score = positiveRatio;
        confidence = Math.min(positiveRatio / threshold, 1);
      }
    } else if (negativeRatio > positiveRatio && negativeRatio > neutralRatio) {
      if (negativeRatio >= threshold) {
        finalSentiment = 'negative';
        score = -negativeRatio;
        confidence = Math.min(negativeRatio / threshold, 1);
      }
    }
    
    if (finalSentiment === 'neutral') {
      score = positiveRatio - negativeRatio;
      confidence = neutralRatio;
    }
    
    return {
      sentiment: finalSentiment,
      score: score,
      confidence: confidence,
      breakdown: {
        positive: positiveRatio,
        negative: negativeRatio,
        neutral: neutralRatio
      }
    };
  }
  
  checkAlertKeywords(text) {
    if (this.alertKeywords.length === 0) return [];
    
    const lowerText = text.toLowerCase();
    const foundKeywords = [];
    
    for (const keyword of this.alertKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    }
    
    return foundKeywords;
  }
  
  setSensitivity(sensitivity) {
    this.sensitivity = Math.max(0, Math.min(1, sensitivity));
    chrome.storage.sync.set({ moodscope_sensitivity: this.sensitivity });
  }
  
  addCustomKeyword(word, sentiment) {
    if (!this.customKeywords[sentiment]) return false;
    
    const lowerWord = word.toLowerCase();
    if (!this.customKeywords[sentiment].includes(lowerWord)) {
      this.customKeywords[sentiment].push(lowerWord);
      chrome.storage.sync.set({ moodscope_custom_keywords: this.customKeywords });
      return true;
    }
    return false;
  }
  
  removeCustomKeyword(word, sentiment) {
    if (!this.customKeywords[sentiment]) return false;
    
    const lowerWord = word.toLowerCase();
    const index = this.customKeywords[sentiment].indexOf(lowerWord);
    if (index > -1) {
      this.customKeywords[sentiment].splice(index, 1);
      chrome.storage.sync.set({ moodscope_custom_keywords: this.customKeywords });
      return true;
    }
    return false;
  }
  
  addAlertKeyword(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    if (!this.alertKeywords.includes(lowerKeyword)) {
      this.alertKeywords.push(lowerKeyword);
      chrome.storage.sync.set({ moodscope_alert_keywords: this.alertKeywords });
      return true;
    }
    return false;
  }
  
  removeAlertKeyword(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    const index = this.alertKeywords.indexOf(lowerKeyword);
    if (index > -1) {
      this.alertKeywords.splice(index, 1);
      chrome.storage.sync.set({ moodscope_alert_keywords: this.alertKeywords });
      return true;
    }
    return false;
  }
}

// Global instance
window.MoodScopeSentiment = new SentimentEngine();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SentimentEngine;
}
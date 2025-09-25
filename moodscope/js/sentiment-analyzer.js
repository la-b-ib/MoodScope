/**
 * Real-Time Sentiment Analysis Engine
 * Actual working sentiment analysis with lexicon-based approach
 */

class SentimentAnalyzer {
  constructor() {
    this.positiveWords = [
      'amazing', 'awesome', 'excellent', 'fantastic', 'great', 'wonderful', 'brilliant',
      'outstanding', 'superb', 'magnificent', 'incredible', 'marvelous', 'spectacular',
      'love', 'adore', 'like', 'enjoy', 'appreciate', 'cherish', 'treasure',
      'happy', 'joy', 'delighted', 'thrilled', 'excited', 'cheerful', 'elated',
      'good', 'nice', 'pleasant', 'beautiful', 'perfect', 'best', 'better',
      'success', 'win', 'victory', 'achieve', 'accomplish', 'triumph', 'succeed',
      'positive', 'optimistic', 'confident', 'hopeful', 'inspiring', 'uplifting',
      'satisfying', 'pleased', 'grateful', 'thankful', 'blessed', 'fortunate',
      'impressive', 'remarkable', 'extraordinary', 'phenomenal', 'terrific',
      'fabulous', 'gorgeous', 'stunning', 'breathtaking', 'incredible'
    ];

    this.negativeWords = [
      'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'despise', 'loathe',
      'bad', 'worst', 'worse', 'nasty', 'ugly', 'stupid', 'dumb', 'idiotic',
      'angry', 'mad', 'furious', 'rage', 'annoyed', 'irritated', 'frustrated',
      'sad', 'depressed', 'miserable', 'unhappy', 'disappointed', 'devastated',
      'fail', 'failure', 'lose', 'loss', 'defeat', 'disaster', 'catastrophe',
      'wrong', 'mistake', 'error', 'problem', 'issue', 'trouble', 'difficult',
      'impossible', 'hopeless', 'useless', 'worthless', 'pathetic', 'ridiculous',
      'boring', 'dull', 'tedious', 'annoying', 'irritating', 'frustrating',
      'disgusted', 'repulsed', 'revolting', 'sickening', 'appalling', 'shocking',
      'outrageous', 'unacceptable', 'intolerable', 'unbearable', 'devastating'
    ];

    this.neutralWords = [
      'okay', 'ok', 'fine', 'average', 'normal', 'regular', 'typical', 'standard',
      'moderate', 'medium', 'middle', 'ordinary', 'common', 'usual', 'general',
      'acceptable', 'adequate', 'sufficient', 'reasonable', 'fair', 'decent'
    ];

    this.intensifiers = {
      'very': 1.5, 'really': 1.4, 'extremely': 1.8, 'incredibly': 1.7, 'absolutely': 1.6,
      'completely': 1.5, 'totally': 1.5, 'utterly': 1.6, 'quite': 1.2, 'rather': 1.1,
      'pretty': 1.1, 'fairly': 1.1, 'somewhat': 0.8, 'slightly': 0.7, 'barely': 0.5,
      'hardly': 0.4, 'scarcely': 0.4, 'almost': 0.9, 'nearly': 0.9, 'too': 1.3,
      'so': 1.2, 'such': 1.2, 'super': 1.4, 'ultra': 1.5, 'mega': 1.4, 'insanely': 1.6
    };

    this.negationWords = ['not', 'no', 'never', 'none', 'nobody', 'nothing', 'neither', 'nowhere', "n't", 'cannot', "can't", "won't", "shouldn't", "wouldn't", "couldn't", "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't"];
    
    this.punctuationMultipliers = {
      '!': 1.2,
      '!!': 1.4,
      '!!!': 1.6,
      '?': 1.1,
      '??': 1.2,
      '???': 1.3
    };
  }

  analyze(text) {
    if (!text || text.trim().length === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        breakdown: { positive: 0, negative: 0, neutral: 0 },
        words: { positive: [], negative: [], neutral: [] },
        details: 'No text to analyze'
      };
    }

    // Clean and tokenize text
    const cleanText = text.toLowerCase().trim();
    const words = cleanText.split(/\s+/).map(word => 
      word.replace(/[^\w\s']/g, '').trim()
    ).filter(word => word.length > 0);

    if (words.length === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        breakdown: { positive: 0, negative: 0, neutral: 0 },
        words: { positive: [], negative: [], neutral: [] },
        details: 'No meaningful words found'
      };
    }

    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    const foundWords = {
      positive: [],
      negative: [],
      neutral: []
    };

    // Analyze each word with context
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let wordScore = 0;
      let wordType = null;

      // Check for sentiment words
      if (this.positiveWords.includes(word)) {
        wordScore = 1;
        wordType = 'positive';
        foundWords.positive.push(word);
      } else if (this.negativeWords.includes(word)) {
        wordScore = -1;
        wordType = 'negative';
        foundWords.negative.push(word);
      } else if (this.neutralWords.includes(word)) {
        wordScore = 0;
        wordType = 'neutral';
        foundWords.neutral.push(word);
      } else {
        continue; // Skip non-sentiment words
      }

      // Apply intensifiers
      const prevWord = i > 0 ? words[i - 1] : null;
      if (prevWord && this.intensifiers[prevWord]) {
        wordScore *= this.intensifiers[prevWord];
      }

      // Apply negation (check 1-2 words before)
      const negationRange = Math.max(0, i - 2);
      let isNegated = false;
      for (let j = negationRange; j < i; j++) {
        if (this.negationWords.includes(words[j])) {
          isNegated = true;
          break;
        }
      }

      if (isNegated) {
        wordScore *= -0.8; // Flip and reduce intensity
      }

      // Add to total scores
      if (wordScore > 0) {
        positiveScore += wordScore;
      } else if (wordScore < 0) {
        negativeScore += Math.abs(wordScore);
      } else {
        neutralScore += 0.5;
      }
    }

    // Apply punctuation multipliers
    const punctuationMatch = text.match(/[!?]+/g);
    let punctuationMultiplier = 1;
    if (punctuationMatch) {
      for (const punct of punctuationMatch) {
        if (this.punctuationMultipliers[punct]) {
          punctuationMultiplier *= this.punctuationMultipliers[punct];
        }
      }
    }

    positiveScore *= punctuationMultiplier;
    negativeScore *= punctuationMultiplier;

    // Calculate final sentiment
    const totalScore = positiveScore + negativeScore + neutralScore;
    const normalizedPositive = totalScore > 0 ? positiveScore / totalScore : 0;
    const normalizedNegative = totalScore > 0 ? negativeScore / totalScore : 0;
    const normalizedNeutral = totalScore > 0 ? neutralScore / totalScore : 0;

    // Determine dominant sentiment
    let sentiment = 'neutral';
    let confidence = 0;
    let finalScore = 0;

    const threshold = 0.1; // Minimum difference to avoid neutral

    if (normalizedPositive > normalizedNegative + threshold && normalizedPositive > normalizedNeutral + threshold) {
      sentiment = 'positive';
      confidence = normalizedPositive;
      finalScore = positiveScore - negativeScore;
    } else if (normalizedNegative > normalizedPositive + threshold && normalizedNegative > normalizedNeutral + threshold) {
      sentiment = 'negative';
      confidence = normalizedNegative;
      finalScore = negativeScore - positiveScore;
    } else {
      sentiment = 'neutral';
      confidence = Math.max(normalizedNeutral, 1 - Math.abs(normalizedPositive - normalizedNegative));
      finalScore = 0;
    }

    // Adjust confidence based on text length and word count
    const lengthFactor = Math.min(words.length / 10, 1); // More words = higher confidence
    confidence = Math.min(confidence * (0.5 + lengthFactor * 0.5), 1);

    return {
      sentiment: sentiment,
      score: finalScore,
      confidence: Math.round(confidence * 100),
      breakdown: {
        positive: Math.round(normalizedPositive * 100),
        negative: Math.round(normalizedNegative * 100),
        neutral: Math.round(normalizedNeutral * 100)
      },
      words: foundWords,
      details: this.generateDetails(sentiment, confidence, foundWords, words.length)
    };
  }

  generateDetails(sentiment, confidence, foundWords, wordCount) {
    const totalWords = foundWords.positive.length + foundWords.negative.length + foundWords.neutral.length;
    
    let details = `Analyzed ${wordCount} words, found ${totalWords} sentiment indicators. `;
    
    if (sentiment === 'positive') {
      details += `Primarily positive sentiment detected`;
      if (foundWords.positive.length > 0) {
        details += ` (key words: ${foundWords.positive.slice(0, 3).join(', ')})`;
      }
    } else if (sentiment === 'negative') {
      details += `Primarily negative sentiment detected`;
      if (foundWords.negative.length > 0) {
        details += ` (key words: ${foundWords.negative.slice(0, 3).join(', ')})`;
      }
    } else {
      details += `Neutral or mixed sentiment detected`;
    }

    if (confidence < 0.3) {
      details += '. Low confidence - text may be ambiguous or lack clear sentiment indicators.';
    } else if (confidence > 0.7) {
      details += '. High confidence analysis.';
    }

    return details;
  }

  // Batch analyze multiple texts
  batchAnalyze(texts) {
    return texts.map(text => this.analyze(text));
  }

  // Get sentiment statistics from multiple analyses
  getStatistics(results) {
    const stats = {
      total: results.length,
      positive: 0,
      negative: 0,
      neutral: 0,
      averageConfidence: 0,
      commonWords: { positive: {}, negative: {}, neutral: {} }
    };

    let totalConfidence = 0;

    results.forEach(result => {
      stats[result.sentiment]++;
      totalConfidence += result.confidence;

      // Count common words
      ['positive', 'negative', 'neutral'].forEach(type => {
        result.words[type].forEach(word => {
          stats.commonWords[type][word] = (stats.commonWords[type][word] || 0) + 1;
        });
      });
    });

    stats.averageConfidence = results.length > 0 ? Math.round(totalConfidence / results.length) : 0;

    return stats;
  }
}
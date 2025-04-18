// English keywords only
const keywords = {
    positive: { great: 1, awesome: 1.2, love: 1.5, good: 0.8, happy: 1, excellent: 1.3, very: 1.5 },
    negative: { bad: -1, awful: -1.5, hate: -1.8, terrible: -1.4, sad: -1.2, stupid: -1.3, not: -0.5 }
  };
  
  let sentimentData = [];
  let sensitivity = 0.5;
  let isEnabled = false;
  let observer = null;
  
  function analyzeSentiment(text, customKeywords = { positive: {}, negative: {} }) {
    try {
      const dict = { ...keywords.positive, ...customKeywords.positive };
      const negDict = { ...keywords.negative, ...customKeywords.negative };
      const words = text.toLowerCase().split(/\s+/).filter((w) => w);
      let score = 0;
      let lastWord = "";
  
      words.forEach((word) => {
        if (dict[word]) {
          score += dict[word] * (lastWord === dict.very ? 1.5 : lastWord === negDict.not ? -0.5 : 1);
        } else if (negDict[word]) {
          score += negDict[word] * (lastWord === dict.very ? 1.5 : lastWord === negDict.not ? -0.5 : 1);
        }
        lastWord = word;
      });
  
      score *= sensitivity;
      return Math.abs(score) < 0.5
        ? { label: "Neutral", score: score.toFixed(2) }
        : score > 0
          ? { label: "Positive", score: score.toFixed(2) }
          : { label: "Negative", score: score.toFixed(2) };
    } catch (err) {
      console.error("Sentiment analysis error:", err);
      return { label: "Neutral", score: "0.00" };
    }
  }
  
  function injectSentimentWidgets(settings) {
    try {
      const selectors = {
        x: "div[role='article'] p",
        facebook: "div[dir='auto'][data-ad-comet-preview='message']",
        linkedin: "div.feed-shared-update-v2__commentary",
        reddit: ".comment .usertext-body",
        instagram: "div._a9zs span",
        youtube: "div#content ytd-comment-renderer"
      };
  
      let comments = [];
      Object.values(selectors).forEach((sel) => {
        const nodes = document.querySelectorAll(sel);
        if (nodes.length) comments = [...comments, ...nodes];
      });
  
      if (!comments.length) return;
  
      document.querySelectorAll(".sentiment-widget").forEach((w) => w.remove());
  
      sentimentData = [];
      comments.forEach((comment, index) => {
        if (comment.dataset.sentimentProcessed) return;
        comment.dataset.sentimentProcessed = "true";
  
        const text = comment.textContent || "";
        if (!text.trim()) return;
  
        const sentiment = analyzeSentiment(text, settings.customKeywords);
        sentimentData.push({ ...sentiment, timestamp: Date.now() });
  
        if (settings.filter !== "all" && sentiment.label.toLowerCase() !== settings.filter) {
          comment.parentNode.style.display = "none";
          return;
        }
        comment.parentNode.style.display = "";
  
        if (settings.highlight) {
          comment.style.backgroundColor =
            sentiment.label === "Positive" ? "rgba(212, 237, 218, 0.3)" :
            sentiment.label === "Negative" ? "rgba(248, 215, 218, 0.3)" : "transparent";
          comment.style.transition = "background-color 0.3s";
        } else {
          comment.style.backgroundColor = "transparent";
        }
  
        const widget = document.createElement("span");
        widget.className = "sentiment-widget animate-in";
        widget.innerHTML = `
          <span class="material-icons">${
            sentiment.label === "Positive" ? "sentiment_satisfied" :
            sentiment.label === "Negative" ? "sentiment_dissatisfied" : "sentiment_neutral"
          }</span>
          <span title="Score: ${sentiment.score}">${sentiment.label}</span>
        `;
        widget.dataset.index = index;
        comment.parentNode.appendChild(widget);
      });
  
      if (settings.alerts && sentimentData.length) {
        const negativeRatio = sentimentData.filter((s) => s.label === "Negative").length / sentimentData.length;
        if (negativeRatio > 0.5) {
          const alertDiv = document.createElement("div");
          alertDiv.className = "sentiment-alert animate-in";
          alertDiv.textContent = "Warning: High negative sentiment detected.";
          document.body.prepend(alertDiv);
          setTimeout(() => alertDiv.classList.add("animate-out"), 4000);
          setTimeout(() => alertDiv.remove(), 4500);
        }
      }
  
      chrome.storage.local.set({ sentimentData });
    } catch (err) {
      console.error("Widget injection error:", err);
    }
  }
  
  function clearWidgets() {
    document.querySelectorAll(".sentiment-widget, .sentiment-alert").forEach((w) => w.remove());
    document.querySelectorAll("[data-sentiment-processed]").forEach((c) => {
      c.parentNode.style.display = "";
      c.style.backgroundColor = "transparent";
    });
    if (observer) observer.disconnect();
  }
  
  let timeout;
  function throttledInject(settings) {
    clearTimeout(timeout);
    timeout = setTimeout(() => injectSentimentWidgets(settings), 500);
  }
  
  chrome.storage.local.get(
    ["enabled", "filter", "customKeywords", "highlight", "alerts", "sensitivity"],
    (data) => {
      const settings = {
        enabled: data.enabled !== false,
        filter: data.filter || "all",
        customKeywords: data.customKeywords || { positive: {}, negative: {} },
        highlight: data.highlight || false,
        alerts: data.alerts || false,
        sensitivity: data.sensitivity || 0.5
      };
      sensitivity = settings.sensitivity;
      isEnabled = settings.enabled;
  
      if (isEnabled) {
        injectSentimentWidgets(settings);
        observer = new MutationObserver(() => throttledInject(settings));
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  );
  
  chrome.runtime.onMessage.addListener((message) => {
    try {
      const settings = {
        filter: message.filter || "all",
        customKeywords: message.customKeywords || { positive: {}, negative: {} },
        highlight: message.highlight ?? false,
        alerts: message.alerts ?? false,
        sensitivity: message.sensitivity || 0.5
      };
      sensitivity = settings.sensitivity;
  
      if (message.toggle !== undefined) {
        isEnabled = message.toggle;
        if (isEnabled) {
          injectSentimentWidgets(settings);
          observer = new MutationObserver(() => throttledInject(settings));
          observer.observe(document.body, { childList: true, subtree: true });
        } else {
          clearWidgets();
        }
      } else {
        if (isEnabled) injectSentimentWidgets(settings);
      }
    } catch (err) {
      console.error("Message handler error:", err);
    }
  });
  
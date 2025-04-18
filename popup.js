function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("toggle");
    const filter = document.getElementById("filter");
    const sensitivity = document.getElementById("sensitivity");
    const sensitivityValue = document.getElementById("sensitivity-value");
    const customPositive = document.getElementById("customPositive");
    const customNegative = document.getElementById("customNegative");
    const addKeywords = document.getElementById("addKeywords");
    const keywordList = document.getElementById("keywordList");
    const highlight = document.getElementById("highlight");
    const alerts = document.getElementById("alerts");
    const exportBtn = document.getElementById("export");
    const importBtn = document.getElementById("importBtn");
    const importInput = document.getElementById("import");
    const chartType = document.getElementById("chartType");
    const theme = document.getElementById("theme");
    const ctx = document.getElementById("sentimentChart").getContext("2d");
  
    let chart;
  
    chrome.storage.local.get(
      [
        "enabled",
        "filter",
        "customKeywords",
        "highlight",
        "alerts",
        "sensitivity",
        "sentimentHistory",
        "theme"
      ],
      (data) => {
        try {
          toggle.checked = data.enabled !== false;
          filter.value = data.filter || "all";
          sensitivity.value = data.sensitivity || 0.5;
          sensitivityValue.textContent = parseFloat(sensitivity.value).toFixed(1);
          highlight.checked = data.highlight || false;
          alerts.checked = data.alerts || false;
          theme.value = data.theme || "auto";
          updateKeywordList(data.customKeywords || { positive: {}, negative: {} });
          updateChart(data.sentimentHistory || [], chartType.value);
          updateTheme(data.theme || "auto");
        } catch (err) {
          console.error("Settings load error:", err);
        }
      }
    );
  
    document.querySelectorAll(".toggle-section").forEach((header) => {
      header.addEventListener("click", () => {
        const section = header.parentElement;
        section.classList.toggle("active");
      });
    });
  
    function updateTheme(themeValue) {
      document.body.classList.remove("light-mode", "dark-mode");
      if (themeValue === "auto") {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.body.classList.add("dark-mode");
        }
      } else if (themeValue === "dark") {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.add("light-mode");
      }
      if (chart) {
        chart.options.plugins.legend.labels.color = document.body.classList.contains("dark-mode") ? "#e0e0e0" : "#333";
        chart.update();
      }
    }
  
    theme.addEventListener("change", () => {
      const themeValue = theme.value;
      chrome.storage.local.set({ theme: themeValue });
      updateTheme(themeValue);
    });
  
    toggle.addEventListener("change", debounce(() => {
      const enabled = toggle.checked;
      chrome.storage.local.set({ enabled });
      sendMessage({ toggle: enabled });
    }, 200));
  
    filter.addEventListener("change", debounce(() => {
      const filterValue = filter.value;
      chrome.storage.local.set({ filter: filterValue });
      sendMessage({ filter: filterValue });
    }, 200));
  
    sensitivity.addEventListener("input", () => {
      const sensValue = parseFloat(sensitivity.value);
      sensitivityValue.textContent = sensValue.toFixed(1);
      chrome.storage.local.set({ sensitivity: sensValue });
      sendMessage({ sensitivity: sensValue });
    });
  
    highlight.addEventListener("change", debounce(() => {
      const highlightValue = highlight.checked;
      chrome.storage.local.set({ highlight: highlightValue });
      sendMessage({ highlight: highlightValue });
    }, 200));
  
    alerts.addEventListener("change", debounce(() => {
      const alertsValue = alerts.checked;
      chrome.storage.local.set({ alerts: alertsValue });
      sendMessage({ alerts: alertsValue });
    }, 200));
  
    addKeywords.addEventListener("click", () => {
      const pos = customPositive.value.trim().toLowerCase();
      const neg = customNegative.value.trim().toLowerCase();
      if (!pos && !neg) {
        alert("Please enter at least one keyword.");
        return;
      }
      try {
        chrome.storage.local.get("customKeywords", (data) => {
          const current = data.customKeywords || { positive: {}, negative: {} };
          if (pos && !/^[a-z]+$/.test(pos)) {
            alert("Positive keyword must contain only letters.");
            return;
          }
          if (neg && !/^[a-z]+$/.test(neg)) {
            alert("Negative keyword must contain only letters.");
            return;
          }
          if (pos) current.positive[pos] = 1;
          if (neg) current.negative[neg] = -1;
          chrome.storage.local.set({ customKeywords: current }, () => {
            updateKeywordList(current);
            customPositive.value = "";
            customNegative.value = "";
            sendMessage({ customKeywords: current });
          });
        });
      } catch (err) {
        console.error("Keyword add error:", err);
        alert("Failed to add keywords.");
      }
    });
  
    keywordList.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-keyword")) {
        try {
          const word = e.target.dataset.word;
          const type = e.target.dataset.type;
          chrome.storage.local.get("customKeywords", (data) => {
            const current = data.customKeywords || { positive: {}, negative: {} };
            delete current[type][word];
            chrome.storage.local.set({ customKeywords: current }, () => {
              updateKeywordList(current);
              sendMessage({ customKeywords: current });
            });
          });
        } catch (err) {
          console.error("Keyword remove error:", err);
          alert("Failed to remove keyword.");
        }
      }
    });
  
    exportBtn.addEventListener("click", () => {
      try {
        chrome.storage.local.get(
          ["filter", "customKeywords", "highlight", "alerts", "sensitivity", "sentimentHistory", "theme"],
          (data) => {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            chrome.downloads.download({
              url,
              filename: "moodscope_settings.json",
              saveAs: true
            });
          }
        );
      } catch (err) {
        console.error("Export error:", err);
        alert("Failed to export settings.");
      }
    });
  
    importBtn.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", () => {
      try {
        const file = importInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (!data.filter) throw new Error("Invalid JSON structure");
            chrome.storage.local.set(data, () => {
              location.reload();
            });
          } catch (err) {
            console.error("Import error:", err);
            alert("Invalid or corrupted JSON file.");
          }
        };
        reader.readAsText(file);
      } catch (err) {
        console.error("File read error:", err);
        alert("Failed to read file.");
      }
    });
  
    chartType.addEventListener("change", () => {
      chrome.storage.local.get("sentimentHistory", (data) => {
        updateChart(data.sentimentHistory || [], chartType.value);
      });
    });
  
    function updateKeywordList(customKeywords) {
      try {
        keywordList.innerHTML = "";
        for (const [word, score] of Object.entries(customKeywords.positive)) {
          const li = document.createElement("li");
          li.innerHTML = `<span title="Positive keyword">${word} (Positive)</span> <button class="remove-keyword" data-word="${word}" data-type="positive">Remove</button>`;
          keywordList.appendChild(li);
        }
        for (const [word, score] of Object.entries(customKeywords.negative)) {
          const li = document.createElement("li");
          li.innerHTML = `<span title="Negative keyword">${word} (Negative)</span> <button class="remove-keyword" data-word="${word}" data-type="negative">Remove</button>`;
          keywordList.appendChild(li);
        }
      } catch (err) {
        console.error("Keyword list update error:", err);
      }
    }
  
    function updateChart(history = [], type = "bar") {
      try {
        history = history.slice(-500);
        const counts = {};
        const dates = {};
  
        history.forEach((s) => {
          const date = new Date(s.timestamp).toLocaleDateString();
          counts[s.label] = (counts[s.label] || 0) + 1;
          dates[date] = dates[date] || { Positive: 0, Negative: 0, Neutral: 0 };
          dates[date][s.label]++;
        });
  
        const labels = type === "bar" ? Object.keys(dates).slice(-7) : ["Positive", "Negative", "Neutral"];
        const datasets =
          type === "bar"
            ? [
                {
                  label: "Positive",
                  data: labels.map((d) => dates[d].Positive || 0),
                  backgroundColor: "#d4edda"
                },
                {
                  label: "Negative",
                  data: labels.map((d) => dates[d].Negative || 0),
                  backgroundColor: "#f8d7da"
                },
                {
                  label: "Neutral",
                  data: labels.map((d) => dates[d].Neutral || 0),
                  backgroundColor: "#e9ecef"
                }
              ]
            : [
                {
                  data: [
                    counts.Positive || 0,
                    counts.Negative || 0,
                    counts.Neutral || 0
                  ],
                  backgroundColor: ["#d4edda", "#f8d7da", "#e9ecef"]
                }
              ];
  
        if (chart) chart.destroy();
        chart = new Chart(ctx, {
          type,
          data: {
            labels,
            datasets
          },
          options: {
            responsive: true,
            animation: { duration: 500 },
            plugins: {
              legend: {
                position: "bottom",
                labels: { color: document.body.classList.contains("dark-mode") ? "#e0e0e0" : "#333" }
              },
              tooltip: { enabled: true }
            },
            scales: type === "bar" ? {
              x: { title: { display: true, text: "Date" } },
              y: { title: { display: true, text: "Count" }, beginAtZero: true }
            } : {}
          }
        });
      } catch (err) {
        console.error("Chart update error:", err);
      }
    }
  
    const sendMessage = debounce((message) => {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (!tabs[0]) return;
          chrome.tabs.sendMessage(tabs[0].id, message, () => {
            if (chrome.runtime.lastError) {
              console.warn("Message send error:", chrome.runtime.lastError);
            }
            chrome.storage.local.get("sentimentHistory", (data) => {
              updateChart(data.sentimentHistory || [], chartType.value);
            });
          });
        });
      } catch (err) {
        console.error("Send message error:", err);
      }
    }, 200);
  
    chrome.storage.local.get("sentimentData", (data) => {
      try {
        if (data.sentimentData && data.sentimentData.length) {
          chrome.storage.local.get("sentimentHistory", (hist) => {
            const history = [...(hist.sentimentHistory || []), ...data.sentimentData].slice(-500);
            chrome.storage.local.set({ sentimentHistory: history }, () => {
              updateChart(history, chartType.value);
            });
          });
        }
      } catch (err) {
        console.error("History update error:", err);
      }
    });
  });
  
/**
 * MoodScope Theme Manager
 * Handles light/dark mode support and translucent UI styling
 * Author: Labib Bin Shahed
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.systemTheme = 'light';
    this.autoMode = false;
    
    this.themes = {
      light: {
        name: 'Light',
        colors: {
          primary: '#1976D2',
          primaryVariant: '#1565C0',
          secondary: '#03DAC6',
          secondaryVariant: '#018786',
          background: '#FFFFFF',
          surface: '#FFFFFF',
          error: '#B00020',
          onPrimary: '#FFFFFF',
          onSecondary: '#000000',
          onBackground: '#000000',
          onSurface: '#000000',
          onError: '#FFFFFF',
          
          // Sentiment colors
          positive: '#4CAF50',
          neutral: '#FF9800',
          negative: '#F44336',
          
          // UI elements
          border: '#E0E0E0',
          divider: '#E0E0E0',
          disabled: '#9E9E9E',
          placeholder: '#757575',
          
          // Translucent overlays
          overlay: 'rgba(255, 255, 255, 0.9)',
          backdrop: 'rgba(0, 0, 0, 0.5)',
          
          // Sentiment highlights
          positiveHighlight: 'rgba(76, 175, 80, 0.1)',
          neutralHighlight: 'rgba(255, 152, 0, 0.1)',
          negativeHighlight: 'rgba(244, 67, 54, 0.1)'
        },
        shadows: {
          elevation1: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
          elevation2: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
          elevation3: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
          elevation4: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
          elevation5: '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)'
        }
      },
      
      dark: {
        name: 'Dark',
        colors: {
          primary: '#BB86FC',
          primaryVariant: '#3700B3',
          secondary: '#03DAC6',
          secondaryVariant: '#03DAC6',
          background: '#121212',
          surface: '#1E1E1E',
          error: '#CF6679',
          onPrimary: '#000000',
          onSecondary: '#000000',
          onBackground: '#FFFFFF',
          onSurface: '#FFFFFF',
          onError: '#000000',
          
          // Sentiment colors (adjusted for dark theme)
          positive: '#66BB6A',
          neutral: '#FFB74D',
          negative: '#EF5350',
          
          // UI elements
          border: '#404040',
          divider: '#404040',
          disabled: '#616161',
          placeholder: '#9E9E9E',
          
          // Translucent overlays
          overlay: 'rgba(30, 30, 30, 0.9)',
          backdrop: 'rgba(0, 0, 0, 0.7)',
          
          // Sentiment highlights
          positiveHighlight: 'rgba(102, 187, 106, 0.15)',
          neutralHighlight: 'rgba(255, 183, 77, 0.15)',
          negativeHighlight: 'rgba(239, 83, 80, 0.15)'
        },
        shadows: {
          elevation1: '0 1px 3px rgba(0, 0, 0, 0.24), 0 1px 2px rgba(0, 0, 0, 0.48)',
          elevation2: '0 3px 6px rgba(0, 0, 0, 0.32), 0 3px 6px rgba(0, 0, 0, 0.46)',
          elevation3: '0 10px 20px rgba(0, 0, 0, 0.38), 0 6px 6px rgba(0, 0, 0, 0.46)',
          elevation4: '0 14px 28px rgba(0, 0, 0, 0.50), 0 10px 10px rgba(0, 0, 0, 0.44)',
          elevation5: '0 19px 38px rgba(0, 0, 0, 0.60), 0 15px 12px rgba(0, 0, 0, 0.44)'
        }
      }
    };
    
    this.init();
  }
  
  async init() {
    await this.loadThemeSettings();
    this.detectSystemTheme();
    this.setupSystemThemeListener();
    this.setupMessageListener();
    this.applyTheme();
    
    console.log('MoodScope: Theme manager initialized');
  }
  
  /**
   * Load theme settings from storage
   */
  async loadThemeSettings() {
    try {
      const result = await chrome.storage.sync.get(['moodscope_theme']);
      const savedTheme = result.moodscope_theme || 'light';
      
      if (savedTheme === 'auto') {
        this.autoMode = true;
        this.currentTheme = this.systemTheme;
      } else {
        this.autoMode = false;
        this.currentTheme = savedTheme;
      }
      
    } catch (error) {
      console.error('MoodScope: Failed to load theme settings:', error);
      this.currentTheme = 'light';
      this.autoMode = false;
    }
  }
  
  /**
   * Save theme settings to storage
   */
  async saveThemeSettings() {
    try {
      const themeToSave = this.autoMode ? 'auto' : this.currentTheme;
      await chrome.storage.sync.set({ moodscope_theme: themeToSave });
    } catch (error) {
      console.error('MoodScope: Failed to save theme settings:', error);
    }
  }
  
  /**
   * Detect system theme preference
   */
  detectSystemTheme() {
    if (window.matchMedia) {
      this.systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      this.systemTheme = 'light';
    }
  }
  
  /**
   * Setup system theme change listener
   */
  setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      mediaQuery.addEventListener('change', (e) => {
        this.systemTheme = e.matches ? 'dark' : 'light';
        
        if (this.autoMode) {
          this.currentTheme = this.systemTheme;
          this.applyTheme();
          this.broadcastThemeChange();
        }
      });
    }
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'GET_THEME':
          sendResponse({
            current: this.currentTheme,
            auto: this.autoMode,
            system: this.systemTheme,
            available: Object.keys(this.themes)
          });
          break;
          
        case 'SET_THEME':
          this.setTheme(message.theme, message.auto).then(() => {
            sendResponse({ success: true });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
          
        case 'TOGGLE_THEME':
          this.toggleTheme().then(() => {
            sendResponse({ success: true, theme: this.currentTheme });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
          
        case 'GET_THEME_COLORS':
          sendResponse(this.getCurrentThemeColors());
          break;
      }
    });
  }
  
  /**
   * Set theme
   */
  async setTheme(theme, auto = false) {
    if (auto) {
      this.autoMode = true;
      this.currentTheme = this.systemTheme;
    } else {
      if (!this.themes[theme]) {
        throw new Error(`Theme '${theme}' not found`);
      }
      
      this.autoMode = false;
      this.currentTheme = theme;
    }
    
    await this.saveThemeSettings();
    this.applyTheme();
    this.broadcastThemeChange();
  }
  
  /**
   * Toggle between light and dark themes
   */
  async toggleTheme() {
    if (this.autoMode) {
      // If in auto mode, switch to manual mode with opposite of current
      const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      await this.setTheme(newTheme, false);
    } else {
      // Toggle between light and dark
      const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      await this.setTheme(newTheme, false);
    }
  }
  
  /**
   * Apply current theme to the page
   */
  applyTheme() {
    const theme = this.themes[this.currentTheme];
    if (!theme) return;
    
    // Apply CSS custom properties
    this.applyCSSVariables(theme);
    
    // Apply theme class to body
    document.body.classList.remove('moodscope-light', 'moodscope-dark');
    document.body.classList.add(`moodscope-${this.currentTheme}`);
    
    // Apply theme to MoodScope elements
    this.applyThemeToElements(theme);
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme.colors.primary);
  }
  
  /**
   * Apply CSS custom properties
   */
  applyCSSVariables(theme) {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--moodscope-${this.camelToKebab(key)}`, value);
    });
    
    // Apply shadow variables
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--moodscope-${this.camelToKebab(key)}`, value);
    });
    
    // Apply theme-specific variables
    root.style.setProperty('--moodscope-theme', this.currentTheme);
    root.style.setProperty('--moodscope-is-dark', this.currentTheme === 'dark' ? '1' : '0');
  }
  
  /**
   * Apply theme to MoodScope UI elements
   */
  applyThemeToElements(theme) {
    // Update popup if it exists
    const popup = document.getElementById('moodscope-popup');
    if (popup) {
      popup.style.backgroundColor = theme.colors.surface;
      popup.style.color = theme.colors.onSurface;
      popup.style.boxShadow = theme.shadows.elevation3;
    }
    
    // Update filter FAB if it exists
    const fab = document.getElementById('moodscope-filter-fab');
    if (fab) {
      fab.style.backgroundColor = theme.colors.primary;
      fab.style.color = theme.colors.onPrimary;
      fab.style.boxShadow = theme.shadows.elevation2;
    }
    
    // Update filter menu if it exists
    const menu = document.getElementById('moodscope-filter-menu');
    if (menu) {
      menu.style.backgroundColor = theme.colors.surface;
      menu.style.color = theme.colors.onSurface;
      menu.style.boxShadow = theme.shadows.elevation4;
    }
    
    // Update sentiment highlights
    this.updateSentimentHighlights(theme);
  }
  
  /**
   * Update sentiment highlight colors
   */
  updateSentimentHighlights(theme) {
    const style = document.getElementById('moodscope-dynamic-styles') || document.createElement('style');
    style.id = 'moodscope-dynamic-styles';
    
    style.textContent = `
      .moodscope-sentiment-positive {
        background-color: ${theme.colors.positiveHighlight} !important;
        border-left: 3px solid ${theme.colors.positive} !important;
      }
      
      .moodscope-sentiment-neutral {
        background-color: ${theme.colors.neutralHighlight} !important;
        border-left: 3px solid ${theme.colors.neutral} !important;
      }
      
      .moodscope-sentiment-negative {
        background-color: ${theme.colors.negativeHighlight} !important;
        border-left: 3px solid ${theme.colors.negative} !important;
      }
      
      .moodscope-sentiment-indicator {
        background-color: ${theme.colors.overlay} !important;
        color: ${theme.colors.onSurface} !important;
        box-shadow: ${theme.shadows.elevation1} !important;
      }
      
      .moodscope-sentiment-indicator.positive {
        border-color: ${theme.colors.positive} !important;
      }
      
      .moodscope-sentiment-indicator.neutral {
        border-color: ${theme.colors.neutral} !important;
      }
      
      .moodscope-sentiment-indicator.negative {
        border-color: ${theme.colors.negative} !important;
      }
    `;
    
    if (!document.head.contains(style)) {
      document.head.appendChild(style);
    }
  }
  
  /**
   * Update meta theme-color for mobile browsers
   */
  updateMetaThemeColor(color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.content = color;
  }
  
  /**
   * Broadcast theme change to other parts of the extension
   */
  async broadcastThemeChange() {
    try {
      // Send message to background script
      await chrome.runtime.sendMessage({
        type: 'THEME_CHANGED',
        theme: this.currentTheme,
        auto: this.autoMode
      });
      
      // Send message to all tabs
      const tabs = await chrome.tabs.query({});
      const message = {
        type: 'THEME_CHANGED',
        theme: this.currentTheme,
        auto: this.autoMode,
        colors: this.getCurrentThemeColors()
      };
      
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Tab might not have content script, ignore
        }
      }
      
    } catch (error) {
      console.error('MoodScope: Failed to broadcast theme change:', error);
    }
  }
  
  /**
   * Get current theme colors
   */
  getCurrentThemeColors() {
    return this.themes[this.currentTheme]?.colors || this.themes.light.colors;
  }
  
  /**
   * Get current theme shadows
   */
  getCurrentThemeShadows() {
    return this.themes[this.currentTheme]?.shadows || this.themes.light.shadows;
  }
  
  /**
   * Get theme info
   */
  getThemeInfo() {
    return {
      current: this.currentTheme,
      auto: this.autoMode,
      system: this.systemTheme,
      available: Object.keys(this.themes),
      colors: this.getCurrentThemeColors(),
      shadows: this.getCurrentThemeShadows()
    };
  }
  
  /**
   * Create custom theme
   */
  createCustomTheme(name, baseTheme, customColors = {}) {
    if (this.themes[name]) {
      throw new Error(`Theme '${name}' already exists`);
    }
    
    const base = this.themes[baseTheme] || this.themes.light;
    
    this.themes[name] = {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      colors: { ...base.colors, ...customColors },
      shadows: { ...base.shadows }
    };
  }
  
  /**
   * Remove custom theme
   */
  removeCustomTheme(name) {
    if (name === 'light' || name === 'dark') {
      throw new Error('Cannot remove built-in themes');
    }
    
    if (this.currentTheme === name) {
      this.setTheme('light');
    }
    
    delete this.themes[name];
  }
  
  /**
   * Export theme
   */
  exportTheme(name) {
    const theme = this.themes[name];
    if (!theme) {
      throw new Error(`Theme '${name}' not found`);
    }
    
    return {
      name,
      theme,
      version: '1.0',
      timestamp: Date.now()
    };
  }
  
  /**
   * Import theme
   */
  importTheme(themeData) {
    if (!themeData.name || !themeData.theme) {
      throw new Error('Invalid theme data');
    }
    
    this.themes[themeData.name] = themeData.theme;
  }
  
  /**
   * Generate theme preview
   */
  generateThemePreview(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return null;
    
    const preview = document.createElement('div');
    preview.className = 'moodscope-theme-preview';
    preview.style.cssText = `
      display: flex;
      flex-direction: column;
      width: 200px;
      height: 120px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: ${theme.shadows.elevation2};
      background: ${theme.colors.background};
      color: ${theme.colors.onBackground};
    `;
    
    preview.innerHTML = `
      <div style="
        background: ${theme.colors.primary};
        color: ${theme.colors.onPrimary};
        padding: 8px;
        font-size: 12px;
        font-weight: 500;
      ">${theme.name}</div>
      
      <div style="padding: 8px; flex: 1;">
        <div style="
          background: ${theme.colors.positiveHighlight};
          border-left: 3px solid ${theme.colors.positive};
          padding: 4px;
          margin: 2px 0;
          font-size: 10px;
        ">Positive</div>
        
        <div style="
          background: ${theme.colors.neutralHighlight};
          border-left: 3px solid ${theme.colors.neutral};
          padding: 4px;
          margin: 2px 0;
          font-size: 10px;
        ">Neutral</div>
        
        <div style="
          background: ${theme.colors.negativeHighlight};
          border-left: 3px solid ${theme.colors.negative};
          padding: 4px;
          margin: 2px 0;
          font-size: 10px;
        ">Negative</div>
      </div>
    `;
    
    return preview;
  }
  
  /**
   * Utility: Convert camelCase to kebab-case
   */
  camelToKebab(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  /**
   * Utility: Convert kebab-case to camelCase
   */
  kebabToCamel(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
} else {
  window.ThemeManager = ThemeManager;
}
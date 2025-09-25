/**
 * MoodScope Filter System
 * Handles comment filtering by sentiment type across platforms
 * Author: Labib Bin Shahed
 */

class FilterSystem {
  constructor() {
    this.activeFilters = {
      positive: true,
      neutral: true,
      negative: true
    };
    this.filterMode = 'show'; // 'show' or 'hide'
    this.isActive = false;
    this.filteredElements = new Map(); // Track filtered elements
    
    this.init();
  }
  
  init() {
    this.loadFilterSettings();
    this.setupMessageListener();
    this.createFilterUI();
    console.log('MoodScope: Filter system initialized');
  }
  
  async loadFilterSettings() {
    try {
      const result = await chrome.storage.local.get([
        'moodscope_filter_settings',
        'moodscope_filter_active'
      ]);
      
      if (result.moodscope_filter_settings) {
        this.activeFilters = result.moodscope_filter_settings.filters || this.activeFilters;
        this.filterMode = result.moodscope_filter_settings.mode || this.filterMode;
      }
      
      this.isActive = result.moodscope_filter_active || false;
      
    } catch (error) {
      console.error('MoodScope: Failed to load filter settings:', error);
    }
  }
  
  async saveFilterSettings() {
    try {
      await chrome.storage.local.set({
        moodscope_filter_settings: {
          filters: this.activeFilters,
          mode: this.filterMode
        },
        moodscope_filter_active: this.isActive
      });
    } catch (error) {
      console.error('MoodScope: Failed to save filter settings:', error);
    }
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'TOGGLE_FILTER':
          this.toggleFilter(message.sentiment);
          break;
          
        case 'SET_FILTER_MODE':
          this.setFilterMode(message.mode);
          break;
          
        case 'TOGGLE_FILTER_SYSTEM':
          this.toggleFilterSystem();
          break;
          
        case 'GET_FILTER_STATUS':
          sendResponse({
            active: this.isActive,
            filters: this.activeFilters,
            mode: this.filterMode
          });
          break;
          
        case 'APPLY_FILTERS':
          this.applyFilters();
          break;
          
        case 'CLEAR_FILTERS':
          this.clearFilters();
          break;
      }
    });
  }
  
  /**
   * Create floating filter UI
   */
  createFilterUI() {
    // Check if UI already exists
    if (document.getElementById('moodscope-filter-fab')) {
      return;
    }
    
    // Create floating action button
    const fab = document.createElement('div');
    fab.id = 'moodscope-filter-fab';
    fab.className = 'moodscope-filter-fab';
    fab.innerHTML = `
      <span class="material-icons">filter_list</span>
    `;
    
    // Create filter menu
    const menu = document.createElement('div');
    menu.id = 'moodscope-filter-menu';
    menu.className = 'moodscope-filter-menu';
    menu.innerHTML = `
      <div class="moodscope-filter-header">
        <span class="material-icons">tune</span>
        <span>Sentiment Filter</span>
        <button class="moodscope-filter-close">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="moodscope-filter-content">
        <div class="moodscope-filter-mode">
          <label>
            <input type="radio" name="filter-mode" value="show" ${this.filterMode === 'show' ? 'checked' : ''}>
            <span>Show only</span>
          </label>
          <label>
            <input type="radio" name="filter-mode" value="hide" ${this.filterMode === 'hide' ? 'checked' : ''}>
            <span>Hide</span>
          </label>
        </div>
        
        <div class="moodscope-filter-options">
          <label class="moodscope-filter-option positive">
            <input type="checkbox" data-sentiment="positive" ${this.activeFilters.positive ? 'checked' : ''}>
            <span class="material-icons">sentiment_very_satisfied</span>
            <span>Positive</span>
          </label>
          
          <label class="moodscope-filter-option neutral">
            <input type="checkbox" data-sentiment="neutral" ${this.activeFilters.neutral ? 'checked' : ''}>
            <span class="material-icons">sentiment_neutral</span>
            <span>Neutral</span>
          </label>
          
          <label class="moodscope-filter-option negative">
            <input type="checkbox" data-sentiment="negative" ${this.activeFilters.negative ? 'checked' : ''}>
            <span class="material-icons">sentiment_very_dissatisfied</span>
            <span>Negative</span>
          </label>
        </div>
        
        <div class="moodscope-filter-actions">
          <button class="moodscope-filter-apply">Apply Filters</button>
          <button class="moodscope-filter-clear">Clear All</button>
        </div>
        
        <div class="moodscope-filter-stats">
          <span id="moodscope-filter-count">0 items filtered</span>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(fab);
    document.body.appendChild(menu);
    
    // Setup event listeners
    this.setupFilterUIEvents(fab, menu);
  }
  
  setupFilterUIEvents(fab, menu) {
    // FAB click to toggle menu
    fab.addEventListener('click', () => {
      menu.classList.toggle('active');
      fab.classList.toggle('active');
    });
    
    // Close button
    menu.querySelector('.moodscope-filter-close').addEventListener('click', () => {
      menu.classList.remove('active');
      fab.classList.remove('active');
    });
    
    // Filter mode change
    menu.querySelectorAll('input[name="filter-mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.setFilterMode(e.target.value);
      });
    });
    
    // Sentiment filter toggles
    menu.querySelectorAll('input[data-sentiment]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.toggleFilter(e.target.dataset.sentiment);
      });
    });
    
    // Apply filters button
    menu.querySelector('.moodscope-filter-apply').addEventListener('click', () => {
      this.applyFilters();
      this.updateFilterStats();
    });
    
    // Clear filters button
    menu.querySelector('.moodscope-filter-clear').addEventListener('click', () => {
      this.clearFilters();
      this.updateFilterUI();
      this.updateFilterStats();
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!fab.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('active');
        fab.classList.remove('active');
      }
    });
  }
  
  /**
   * Toggle specific sentiment filter
   */
  toggleFilter(sentiment) {
    if (this.activeFilters.hasOwnProperty(sentiment)) {
      this.activeFilters[sentiment] = !this.activeFilters[sentiment];
      this.saveFilterSettings();
      this.updateFilterUI();
    }
  }
  
  /**
   * Set filter mode (show/hide)
   */
  setFilterMode(mode) {
    if (mode === 'show' || mode === 'hide') {
      this.filterMode = mode;
      this.saveFilterSettings();
      this.updateFilterUI();
    }
  }
  
  /**
   * Toggle entire filter system
   */
  toggleFilterSystem() {
    this.isActive = !this.isActive;
    this.saveFilterSettings();
    
    if (this.isActive) {
      this.applyFilters();
    } else {
      this.clearFilters();
    }
    
    this.updateFilterUI();
  }
  
  /**
   * Apply filters to all sentiment-analyzed elements
   */
  applyFilters() {
    if (!this.isActive) {
      return;
    }
    
    const sentimentElements = document.querySelectorAll('[data-moodscope-sentiment]');
    let filteredCount = 0;
    
    sentimentElements.forEach(element => {
      const sentiment = element.dataset.moodscopeSentiment;
      const shouldShow = this.shouldShowElement(sentiment);
      
      if (shouldShow) {
        this.showElement(element);
      } else {
        this.hideElement(element);
        filteredCount++;
      }
    });
    
    this.updateFilterStats(filteredCount);
  }
  
  /**
   * Determine if element should be shown based on current filters
   */
  shouldShowElement(sentiment) {
    const isFilterActive = this.activeFilters[sentiment];
    
    if (this.filterMode === 'show') {
      return isFilterActive;
    } else { // hide mode
      return !isFilterActive;
    }
  }
  
  /**
   * Hide element with animation
   */
  hideElement(element) {
    if (this.filteredElements.has(element)) {
      return; // Already hidden
    }
    
    // Store original display style
    const originalDisplay = element.style.display || getComputedStyle(element).display;
    this.filteredElements.set(element, originalDisplay);
    
    // Add filter class and hide
    element.classList.add('moodscope-filtered');
    element.style.display = 'none';
    
    // Also hide parent containers if they become empty
    this.hideEmptyParents(element);
  }
  
  /**
   * Show element with animation
   */
  showElement(element) {
    if (!this.filteredElements.has(element)) {
      return; // Not hidden
    }
    
    // Restore original display style
    const originalDisplay = this.filteredElements.get(element);
    element.style.display = originalDisplay === 'none' ? '' : originalDisplay;
    
    // Remove filter class
    element.classList.remove('moodscope-filtered');
    this.filteredElements.delete(element);
    
    // Show parent containers
    this.showParents(element);
  }
  
  /**
   * Hide empty parent containers
   */
  hideEmptyParents(element) {
    let parent = element.parentElement;
    
    while (parent && parent !== document.body) {
      const visibleChildren = Array.from(parent.children).filter(child => 
        !child.classList.contains('moodscope-filtered') && 
        getComputedStyle(child).display !== 'none'
      );
      
      if (visibleChildren.length === 0) {
        parent.classList.add('moodscope-empty-parent');
        parent.style.display = 'none';
      }
      
      parent = parent.parentElement;
    }
  }
  
  /**
   * Show parent containers
   */
  showParents(element) {
    let parent = element.parentElement;
    
    while (parent && parent !== document.body) {
      if (parent.classList.contains('moodscope-empty-parent')) {
        parent.classList.remove('moodscope-empty-parent');
        parent.style.display = '';
      }
      
      parent = parent.parentElement;
    }
  }
  
  /**
   * Clear all filters
   */
  clearFilters() {
    // Show all hidden elements
    this.filteredElements.forEach((originalDisplay, element) => {
      element.style.display = originalDisplay === 'none' ? '' : originalDisplay;
      element.classList.remove('moodscope-filtered');
    });
    
    // Show all empty parents
    document.querySelectorAll('.moodscope-empty-parent').forEach(parent => {
      parent.classList.remove('moodscope-empty-parent');
      parent.style.display = '';
    });
    
    this.filteredElements.clear();
    this.updateFilterStats(0);
  }
  
  /**
   * Update filter UI to reflect current state
   */
  updateFilterUI() {
    const menu = document.getElementById('moodscope-filter-menu');
    if (!menu) return;
    
    // Update mode radio buttons
    menu.querySelectorAll('input[name="filter-mode"]').forEach(radio => {
      radio.checked = radio.value === this.filterMode;
    });
    
    // Update sentiment checkboxes
    menu.querySelectorAll('input[data-sentiment]').forEach(checkbox => {
      const sentiment = checkbox.dataset.sentiment;
      checkbox.checked = this.activeFilters[sentiment];
    });
    
    // Update FAB appearance
    const fab = document.getElementById('moodscope-filter-fab');
    if (fab) {
      fab.classList.toggle('has-filters', this.hasActiveFilters());
    }
  }
  
  /**
   * Update filter statistics display
   */
  updateFilterStats(count = null) {
    const statsElement = document.getElementById('moodscope-filter-count');
    if (!statsElement) return;
    
    if (count === null) {
      count = this.filteredElements.size;
    }
    
    statsElement.textContent = `${count} item${count !== 1 ? 's' : ''} filtered`;
  }
  
  /**
   * Check if any filters are active
   */
  hasActiveFilters() {
    if (this.filterMode === 'show') {
      return !Object.values(this.activeFilters).every(active => active);
    } else {
      return Object.values(this.activeFilters).some(active => active);
    }
  }
  
  /**
   * Filter newly added elements
   */
  filterNewElement(element) {
    if (!this.isActive || !element.dataset.moodscopeSentiment) {
      return;
    }
    
    const sentiment = element.dataset.moodscopeSentiment;
    const shouldShow = this.shouldShowElement(sentiment);
    
    if (!shouldShow) {
      this.hideElement(element);
      this.updateFilterStats();
    }
  }
  
  /**
   * Get filter statistics
   */
  getFilterStats() {
    const totalElements = document.querySelectorAll('[data-moodscope-sentiment]').length;
    const filteredElements = this.filteredElements.size;
    
    const sentimentCounts = {
      positive: document.querySelectorAll('[data-moodscope-sentiment="positive"]').length,
      neutral: document.querySelectorAll('[data-moodscope-sentiment="neutral"]').length,
      negative: document.querySelectorAll('[data-moodscope-sentiment="negative"]').length
    };
    
    return {
      total: totalElements,
      filtered: filteredElements,
      visible: totalElements - filteredElements,
      sentimentCounts,
      activeFilters: this.activeFilters,
      filterMode: this.filterMode,
      isActive: this.isActive
    };
  }
  
  /**
   * Export filter settings
   */
  exportSettings() {
    return {
      activeFilters: this.activeFilters,
      filterMode: this.filterMode,
      isActive: this.isActive
    };
  }
  
  /**
   * Import filter settings
   */
  importSettings(settings) {
    if (settings.activeFilters) {
      this.activeFilters = settings.activeFilters;
    }
    
    if (settings.filterMode) {
      this.filterMode = settings.filterMode;
    }
    
    if (typeof settings.isActive === 'boolean') {
      this.isActive = settings.isActive;
    }
    
    this.saveFilterSettings();
    this.updateFilterUI();
    
    if (this.isActive) {
      this.applyFilters();
    } else {
      this.clearFilters();
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FilterSystem;
} else {
  window.FilterSystem = FilterSystem;
}
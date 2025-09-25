# MoodScope <a href=""><img align="right" width="150" height="150" src="https://raw.githubusercontent.com/la-b-ib/MoodScope/main/preview/gif/bar-chart.gif"></a>

**MoodScope** is an industry-standard Chrome extension that provides real-time sentiment analysis across major social media platforms with advanced analytics, customizable notifications, and comprehensive data management.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
<hr>
 

## Core Functionality

- **Real-time Sentiment Analysis**: Advanced sentiment detection across 6 major social platforms
- **Multi-Platform Integration**: Twitter/X, Facebook, Instagram, LinkedIn, Reddit, YouTube
- **Professional Dashboard**: 4-tab interface with comprehensive analytics
- **Advanced Analytics**: Historical data, trend analysis, and platform-specific statistics
- **Data Export System**: JSON export for analytics, history, and complete backups
- **Theme System**: Dark/Light mode with persistent preferences
- **Notification System**: Smart alerts with keyword monitoring and sentiment thresholds
<hr>
  
## Professional Features

1. **Auto-Analysis Mode** - Background processing with 30-second intervals
2. **Keyword Tracking** - Custom keyword monitoring and alerts
3. **Settings Management** - Comprehensive configuration options
4. **History Management** - Analysis history with timestamps and metadata
5. **Data Persistence** - LocalStorage with automatic sync
6. **Notification System** - Smart alerts with customizable thresholds
7. **Advanced Statistics** - Weekly averages, positivity metrics, site-specific data
8. **Real Site Detection** - Chrome tabs API integration
9. **Performance Optimization** - Efficient memory usage and background processing

<hr>

## Technical Architecture

#### Manifest V3 Structure
```
moodscope/
├── manifest.json              # Extension configuration and permissions
├── popup.html                # Main UI interface (420x600px)
├── js/
│   ├── popup.js              # Main application logic (MoodScopePro class)
│   ├── background.js         # Service worker for background processing
│   ├── sentiment-engine.js   # Core sentiment analysis algorithms
│   ├── notification-system.js # Alert and notification management
│   ├── chart-utils.js        # Data visualization utilities
│   ├── filter-system.js      # Content filtering and processing
│   ├── settings-manager.js   # User preferences and configuration
│   ├── theme-manager.js      # UI theme management
│   └── content-scripts/      # Platform-specific integrations
│       ├── twitter.js        # Twitter/X sentiment analysis
│       ├── facebook.js       # Facebook content processing
│       ├── instagram.js      # Instagram integration
│       ├── linkedin.js       # LinkedIn professional content
│       ├── reddit.js         # Reddit community analysis
│       └── youtube.js        # YouTube comment sentiment
├── css/
│   ├── popup.css            # Main UI styles (739 lines)
│   └── content.css          # Injected styles for content scripts (591 lines)
└── icons/                   # Extension icons (16, 32, 48, 128px)
```

<hr>

#### SentimentEngine (sentiment-engine.js)
```javascript
class SentimentEngine {
    constructor() {
        this.lexicon = {
            positive: [...],   // 40+ positive sentiment words
            negative: [...],   // 45+ negative sentiment words
            neutral: [...]     // 20+ neutral sentiment words
        };
        this.intensifiers = {}; // Sentiment amplifiers
        this.negators = [];     // Sentiment negation detection
    }
}
```
<hr>

## **Analysis Features:**
- Lexicon-based sentiment scoring
- Context-aware intensity detection
- Negation handling and phrase analysis
- Custom keyword integration
- Confidence scoring (0-100)

<hr>

## Data Architecture

#### Storage Strategy
- **Local Storage**: Real-time analysis data, user preferences
- **Chrome Storage Sync**: Cross-device settings synchronization
- **Session Storage**: Temporary analysis state
<hr>
  
#### Data Models
```javascript
// Analysis Entry
{
    id: timestamp,
    timestamp: Date,
    sentiment: { score: number, label: string, color: string },
    site: string,
    keywords: string[]
}

// Statistics Object
{
    today: number,
    weekAvg: number,
    positivePercent: number,
    siteStats: { facebook: 0, twitter: 0, instagram: 0, reddit: 0 }
}
```
<hr>

## 🔧 Development Setup

#### Prerequisites
- Chrome Browser (v88+)
- Node.js (optional, for development tools)
- Git
<hr>

#### Installation
```bash
# Clone repository
git clone https://github.com/username/moodscope.git
cd moodscope

# Load extension in Chrome
1. Open Chrome Extensions (chrome://extensions/)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the moodscope directory
```
<hr>

#### Development Workflow
```bash
# Make changes to source files
# Reload extension in Chrome
chrome://extensions/ → Click "Reload" button

# Test on supported platforms
# Navigate to Twitter, Facebook, Instagram, LinkedIn, Reddit, YouTube
# Open extension popup to verify functionality
```
<hr>

##  Platform Integration


| Platform | Status | Content Scripts | Features |
|----------|--------|----------------|----------|
| Twitter/X | ✅ Full | `twitter.js` | Timeline, tweets, replies |
| Facebook | ✅ Full | `facebook.js` | Posts, comments, news feed |
| Instagram | ✅ Full | `instagram.js` | Posts, stories, comments |
| LinkedIn | ✅ Full | `linkedin.js` | Professional posts, articles |
| Reddit | ✅ Full | `reddit.js` | Posts, comments, threads |
| YouTube | ✅ Full | `youtube.js` | Video comments, descriptions |
<hr>

## Content Script Architecture
Each platform implements:
- **DOM Monitoring**: MutationObserver for dynamic content
- **Element Detection**: Platform-specific selectors
- **Sentiment Processing**: Text extraction and analysis
- **UI Integration**: Non-intrusive sentiment indicators
- **Performance Optimization**: Debounced processing and memory management

<hr>

## Analytics & Reporting

#### Available Analytics
- **Daily Analysis Count**: Today's sentiment analyses
- **Weekly Average**: 7-day sentiment trend
- **Positivity Percentage**: Ratio of positive vs negative sentiment
- **Platform Distribution**: Per-site analysis statistics
- **Historical Trends**: Time-series sentiment data
<hr>

#### Export Options
1. **Analytics Export**: Statistics and metadata (JSON)
2. **History Export**: Complete analysis history (JSON)
3. **Full Backup**: All user data and settings (JSON)

<hr>

#### Data Format Example
```json
{
  "stats": {
    "today": 15,
    "weekAvg": 73,
    "positivePercent": 68,
    "siteStats": {
      "twitter": 8,
      "facebook": 4,
      "reddit": 3
    }
  },
  "exportDate": "2025-09-25T10:30:00.000Z",
  "totalAnalyses": 127
}
```
<hr>

#### Notification Configuration
```javascript
notifications: {
    enabled: boolean,
    criticalOnly: boolean,
    keywordAlerts: boolean
}
```
<hr>

##  Performance Optimizations

#### Background Processing
- **Service Worker**: Efficient background task management
- **Debounced Analysis**: Prevents excessive API calls
- **Memory Management**: Automatic cleanup of processed content
- **Storage Optimization**: Compressed data structures

<hr>

#### Content Script Efficiency
- **Intersection Observer**: Lazy-load analysis for visible content
- **Mutation Observer**: Efficient DOM change detection  
- **Set-based Deduplication**: Prevents duplicate processing
- **Throttled Execution**: Rate-limited analysis to prevent performance issues

<hr>

## Security & Privacy

#### Data Handling
- **Local Storage Only**: No external data transmission
- **User Consent**: Explicit permission for all features
- **Minimal Permissions**: Only required Chrome APIs
- **Content Isolation**: Sandboxed content script execution

<hr>

#### Permissions Explained
```json
{
  "permissions": [
    "activeTab",      
    "storage",       
    "notifications", 
    "scripting",      
    "tabs"          
  ]
}
```
<hr>

##  Testing & Quality Assurance

#### Manual Testing Checklist
- [ ] Extension loads without errors
- [ ] All 15+ features function correctly
- [ ] Material Icons display properly
- [ ] Theme switching works
- [ ] Data export generates valid JSON
- [ ] Settings persist across sessions
- [ ] Content scripts work on all platforms
- [ ] Performance remains smooth during analysis

<hr>

#### Browser Compatibility
- Chrome 88+ (Manifest V3 support)
- Edge 88+ (Chromium-based)
- Other Chromium browsers

<hr>

## Configuration Files

#### manifest.json
```json
{
  "manifest_version": 3,
  "name": "MoodScope",
  "version": "1.0.0",
  "permissions": ["activeTab", "storage", "notifications", "scripting", "tabs"],
  "host_permissions": ["https://twitter.com/*", "https://facebook.com/*", ...],
  "content_scripts": [...],
  "action": { "default_popup": "popup.html" },
  "background": { "service_worker": "js/background.js" }
}
```

<hr>

##  API Reference

#### Chrome Extension APIs Used
- `chrome.storage.local` - Local data persistence  
- `chrome.storage.sync` - Cross-device settings sync
- `chrome.tabs` - Real site detection and tab management
- `chrome.notifications` - System notification display
- `chrome.runtime` - Message passing between components

<hr>

#### Internal APIs
- `MoodScopePro.analyzePage()` - Trigger sentiment analysis
- `SentimentEngine.analyzeSentiment(text)` - Core analysis function
- `NotificationSystem.showAlert(type, message)` - Display notifications

<hr>

## Future Roadmap

#### Planned Features
- [ ] Machine learning sentiment model integration
- [ ] Real-time sentiment trend visualization
- [ ] Multi-language sentiment support
- [ ] Advanced keyword pattern matching
- [ ] Sentiment comparison across platforms
- [ ] Data visualization dashboard
- [ ] Custom notification webhooks
- [ ] Sentiment history export to CSV

#### Performance Improvements
- [ ] WebAssembly sentiment engine
- [ ] IndexedDB for large datasets
- [ ] Background sync optimization
- [ ] Reduced memory footprint



---

**MoodScope represents a production-ready Chrome extension with enterprise-level features, comprehensive social media integration, and professional UI/UX design. The codebase demonstrates advanced Chrome extension development techniques, efficient data management, and scalable architecture suitable for commercial deployment.**
<hr>

# MoodScope <a href=""><img align="right" width="150" height="150" src="https://raw.githubusercontent.com/la-b-ib/MoodScope/main/preview/gif/bar-chart.gif"></a>

**MoodScope** is an industry-standard Chrome extension that provides real-time sentiment analysis across major social media platforms with advanced analytics, customizable notifications, and comprehensive data management.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
<hr>
 

## 🚀 Features Overview

### Core Functionality
- **Real-time Sentiment Analysis**: Advanced sentiment detection across 6 major social platforms
- **Multi-Platform Integration**: Twitter/X, Facebook, Instagram, LinkedIn, Reddit, YouTube
- **Professional Dashboard**: 4-tab interface with comprehensive analytics
- **Advanced Analytics**: Historical data, trend analysis, and platform-specific statistics
- **Data Export System**: JSON export for analytics, history, and complete backups
- **Theme System**: Dark/Light mode with persistent preferences
- **Notification System**: Smart alerts with keyword monitoring and sentiment thresholds

### Professional Features (15+)
1. **Tab Navigation System** - Professional multi-tab interface
2. **Advanced Sentiment Analysis** - Real-time content analysis with confidence scoring
3. **Auto-Analysis Mode** - Background processing with 30-second intervals
4. **Keyword Tracking** - Custom keyword monitoring and alerts
5. **Analytics Dashboard** - Comprehensive statistics and visualizations
6. **Data Export System** - Multiple export formats (analytics, history, backup)
7. **Theme Toggle** - Dark/Light mode switching
8. **Settings Management** - Comprehensive configuration options
9. **History Management** - Analysis history with timestamps and metadata
10. **Data Persistence** - LocalStorage with automatic sync
11. **Notification System** - Smart alerts with customizable thresholds
12. **Advanced Statistics** - Weekly averages, positivity metrics, site-specific data
13. **Real Site Detection** - Chrome tabs API integration
14. **Material Design UI** - Google Material Icons and modern styling
15. **Performance Optimization** - Efficient memory usage and background processing

## 🏗️ Technical Architecture

### Manifest V3 Structure
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

### Core Classes

#### MoodScopePro (popup.js)
```javascript
class MoodScopePro {
    constructor() {
        this.data = {
            analyses: [],      // Historical analysis data
            keywords: [],      // User-defined keywords
            settings: {},      // User preferences
            stats: {}          // Analytics and statistics
        };
    }
}
```

**Key Methods:**
- `analyzePage()` - Advanced sentiment analysis with 2s processing
- `toggleAutoAnalysis()` - Background analysis management
- `exportData(type)` - JSON data export (analytics/history/backup)
- `updateAnalytics()` - Real-time statistics calculation
- `getCurrentSite()` - Chrome tabs API integration

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

**Analysis Features:**
- Lexicon-based sentiment scoring
- Context-aware intensity detection
- Negation handling and phrase analysis
- Custom keyword integration
- Confidence scoring (0-100)

#### Platform Content Scripts
Each social media platform has dedicated content scripts:

**TwitterMoodScope** (`twitter.js`)
- Tweet and reply sentiment analysis
- Real-time timeline monitoring
- Thread sentiment aggregation
- 373 lines of Twitter-specific logic

**FacebookMoodScope** (`facebook.js`)
- Post and comment analysis
- Facebook-specific DOM handling
- News feed sentiment tracking
- 470 lines of Facebook integration

## 📊 Data Architecture

### Storage Strategy
- **Local Storage**: Real-time analysis data, user preferences
- **Chrome Storage Sync**: Cross-device settings synchronization
- **Session Storage**: Temporary analysis state

### Data Models
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

## 🎨 UI/UX Design

### Design System
- **Typography**: Bungee font family for consistent branding
- **Icons**: Google Material Icons with proper font-feature-settings
- **Spacing**: 8px base unit scaling system
- **Colors**: Professional gradient backgrounds with semantic color coding
- **Layout**: 420x600px popup with responsive 4-tab navigation

### Theme System
```css
:root {
    --space-2: 8px;    /* Base spacing unit */
    --space-4: 16px;   /* Component spacing */
    --space-6: 24px;   /* Section spacing */
    --primary: #2563eb;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
}
```

### Material Icons Integration
Special CSS handling to prevent font conflicts:
```css
.material-icons {
    font-family: 'Material Icons' !important;
    font-feature-settings: 'liga' !important;
    -webkit-font-smoothing: antialiased !important;
}
```

## 🔧 Development Setup

### Prerequisites
- Chrome Browser (v88+)
- Node.js (optional, for development tools)
- Git

### Installation
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

### Development Workflow
```bash
# Make changes to source files
# Reload extension in Chrome
chrome://extensions/ → Click "Reload" button

# Test on supported platforms
# Navigate to Twitter, Facebook, Instagram, LinkedIn, Reddit, YouTube
# Open extension popup to verify functionality
```

## 🌐 Platform Integration

### Supported Platforms
| Platform | Status | Content Scripts | Features |
|----------|--------|----------------|----------|
| Twitter/X | ✅ Full | `twitter.js` | Timeline, tweets, replies |
| Facebook | ✅ Full | `facebook.js` | Posts, comments, news feed |
| Instagram | ✅ Full | `instagram.js` | Posts, stories, comments |
| LinkedIn | ✅ Full | `linkedin.js` | Professional posts, articles |
| Reddit | ✅ Full | `reddit.js` | Posts, comments, threads |
| YouTube | ✅ Full | `youtube.js` | Video comments, descriptions |

### Content Script Architecture
Each platform implements:
- **DOM Monitoring**: MutationObserver for dynamic content
- **Element Detection**: Platform-specific selectors
- **Sentiment Processing**: Text extraction and analysis
- **UI Integration**: Non-intrusive sentiment indicators
- **Performance Optimization**: Debounced processing and memory management

## 📈 Analytics & Reporting

### Available Analytics
- **Daily Analysis Count**: Today's sentiment analyses
- **Weekly Average**: 7-day sentiment trend
- **Positivity Percentage**: Ratio of positive vs negative sentiment
- **Platform Distribution**: Per-site analysis statistics
- **Historical Trends**: Time-series sentiment data

### Export Options
1. **Analytics Export**: Statistics and metadata (JSON)
2. **History Export**: Complete analysis history (JSON)
3. **Full Backup**: All user data and settings (JSON)

### Data Format Example
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

## 🔔 Notification System

### Alert Types
- **Sentiment Threshold**: Negative sentiment detection
- **Keyword Alerts**: Custom keyword monitoring  
- **Analysis Complete**: Real-time processing notifications
- **System Status**: Extension state changes

### Notification Configuration
```javascript
notifications: {
    enabled: boolean,
    criticalOnly: boolean,
    keywordAlerts: boolean
}
```

## ⚡ Performance Optimizations

### Background Processing
- **Service Worker**: Efficient background task management
- **Debounced Analysis**: Prevents excessive API calls
- **Memory Management**: Automatic cleanup of processed content
- **Storage Optimization**: Compressed data structures

### Content Script Efficiency
- **Intersection Observer**: Lazy-load analysis for visible content
- **Mutation Observer**: Efficient DOM change detection  
- **Set-based Deduplication**: Prevents duplicate processing
- **Throttled Execution**: Rate-limited analysis to prevent performance issues

## 🛡️ Security & Privacy

### Data Handling
- **Local Storage Only**: No external data transmission
- **User Consent**: Explicit permission for all features
- **Minimal Permissions**: Only required Chrome APIs
- **Content Isolation**: Sandboxed content script execution

### Permissions Explained
```json
{
  "permissions": [
    "activeTab",      // Access current tab for analysis
    "storage",        // Save user preferences and data
    "notifications",  // Display system notifications
    "scripting",      // Inject content scripts
    "tabs"           // Real site detection
  ]
}
```

## 🧪 Testing & Quality Assurance

### Manual Testing Checklist
- [ ] Extension loads without errors
- [ ] All 15+ features function correctly
- [ ] Material Icons display properly
- [ ] Theme switching works
- [ ] Data export generates valid JSON
- [ ] Settings persist across sessions
- [ ] Content scripts work on all platforms
- [ ] Performance remains smooth during analysis

### Browser Compatibility
- Chrome 88+ (Manifest V3 support)
- Edge 88+ (Chromium-based)
- Other Chromium browsers

## 📝 Configuration Files

### manifest.json
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

## 🚦 API Reference

### Chrome Extension APIs Used
- `chrome.storage.local` - Local data persistence  
- `chrome.storage.sync` - Cross-device settings sync
- `chrome.tabs` - Real site detection and tab management
- `chrome.notifications` - System notification display
- `chrome.runtime` - Message passing between components

### Internal APIs
- `MoodScopePro.analyzePage()` - Trigger sentiment analysis
- `SentimentEngine.analyzeSentiment(text)` - Core analysis function
- `NotificationSystem.showAlert(type, message)` - Display notifications

## 🎯 Future Roadmap

### Planned Features
- [ ] Machine learning sentiment model integration
- [ ] Real-time sentiment trend visualization
- [ ] Multi-language sentiment support
- [ ] Advanced keyword pattern matching
- [ ] Sentiment comparison across platforms
- [ ] Data visualization dashboard
- [ ] Custom notification webhooks
- [ ] Sentiment history export to CSV

### Performance Improvements
- [ ] WebAssembly sentiment engine
- [ ] IndexedDB for large datasets
- [ ] Background sync optimization
- [ ] Reduced memory footprint

## 🤝 Contributing

### Development Guidelines
1. Follow existing code structure and naming conventions
2. Maintain Manifest V3 compatibility
3. Ensure Material Icons display correctly
4. Test across all supported platforms
5. Update documentation for new features

### Code Style
- **JavaScript**: ES6+ classes and async/await
- **CSS**: BEM methodology with custom properties
- **HTML**: Semantic markup with accessibility considerations

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 👨‍💻 Author

**Labib Bin Shahed**
- Professional Chrome Extension Developer
- Sentiment Analysis Specialist
- UI/UX Designer

---

*MoodScope represents a production-ready Chrome extension with enterprise-level features, comprehensive social media integration, and professional UI/UX design. The codebase demonstrates advanced Chrome extension development techniques, efficient data management, and scalable architecture suitable for commercial deployment.*

# MoodScope <a href=""><img align="right" width="150" height="150" src="https://raw.githubusercontent.com/la-b-ib/MoodScope/main/preview/gif/bar-chart.gif"></a>

**MoodScope** is an industry-standard Chrome extension that provides real-time sentiment analysis across major social media platforms with advanced analytics, customizable notifications, and comprehensive data management.



## Core Functionality <a href=""><img align="right" width="150" height="150" src="https://raw.githubusercontent.com/la-b-ib/MoodScope/main/preview/gif/idea.gif"></a> 


<hr>
  
## Professional Features <a href=""><img align="right" width="150" height="150" src="https://raw.githubusercontent.com/la-b-ib/MoodScope/main/preview/gif/hands-holding-signs.gif"></a> 


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


## **Analysis Features:**
- Lexicon-based sentiment scoring
- Context-aware intensity detection
- Negation handling and phrase analysis
- Custom keyword integration
- Confidence scoring (0-100)

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




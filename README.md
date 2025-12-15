# MoodScope <a href=""><img align="right" width="150" height="150" src="https://raw.githubusercontent.com/la-b-ib/MoodScope/main/preview/gif/bar-chart.gif"></a>

**MoodScope** is an industry-standard Chrome extension that provides real-time sentiment analysis across major social media platforms with advanced analytics, customizable notifications, and comprehensive data management.




  
## Professional Features 

* **Auto-analysis (30s), keyword tracking, settings/history management, localStorage sync, smart alerts, site detection, optimized performance.**
* Sentiment analysis with lexicon scoring, intensity detection, negation/phrase handling, custom keywords, and confidence scoring.
* Supported platforms run with full integration: Twitter/X (`twitter.js`) for timelines, tweets, and replies; Facebook (`facebook.js`) for posts, comments, and news feeds; Instagram (`instagram.js`) for posts, stories, and comments; LinkedIn (`linkedin.js`) for professional posts and articles; Reddit (`reddit.js`) for posts, comments, and threads; and YouTube (`youtube.js`) for video comments and descriptions.
* Each platform implements DOM monitoring via MutationObserver, element detection with platform-specific selectors, sentiment processing through text extraction and analysis, UI integration with non-intrusive indicators, and performance optimization using debounced processing and memory management.
* Provides sentiment analytics including daily counts, weekly averages, positivity ratios, platform distribution, and historical trends, with export options for analytics, history, and full backups in JSON.
* 






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




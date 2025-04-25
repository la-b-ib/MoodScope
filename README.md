
# MoodScope   
MoodScope is a powerful Chrome extension that delivers real-time sentiment analysis across X, Facebook, LinkedIn, Reddit, Instagram, and YouTube, helping you gauge online emotions at a glance. Its sleek, translucent UI (with light/dark modes) features interactive sentiment widgets, dynamic bar/pie charts, and customizable filters to highlight positive, neutral, or negative comments. Set custom keyword alerts, adjust sensitivity with a slider, and receive instant notifications for critical sentiment shifts—optimized for macOS, Linux, and Windows. Ideal for brands, researchers, and social media users, MoodScope turns raw reactions into actionable insights, empowering risk mitigation, engagement strategies, and data-driven decisions. Just pin, browse, and analyze—your sentiment dashboard awaits!


---

##  Features  
- **Sentiment Analysis**: Real-time scoring (positive/neutral/negative).  
- **Custom Alerts**: Keyword tracking & sensitivity control via slider.  
- **Interactive UI**:  
  - Translucent light/dark modes.  
  - Filter/highlight comments by sentiment (color-coded).  
- **Charts**: Trends (bar) and snapshot (pie) views.  
- **Cross-Platform**: Optimized for Windows, macOS, Linux.  
- **Data Portability**: Export/import settings.  

---

##  Installation  
1. **Clone**:  
   ```bash  
   git clone https://github.com/la-b-ib/moodscope-extension.git  
   ```  
2. **Load in Chrome**:  
   - Go to `chrome://extensions/`.  
   - Enable **Developer mode** → **Load unpacked** → Select the cloned folder.  

---

##  Usage  
1. Pin MoodScope to your toolbar.  
2. Browse supported platforms → Click the extension icon to:  
   - View sentiment charts.  
   - Set keyword alerts.  
   - Adjust UI/analysis settings.  

*Note: Works automatically on supported sites—no manual activation needed.*  

---

##  Supported Platforms  
| Platform       | Notes                          |  
|----------------|--------------------------------|  
| X (Twitter)    | Full comment analysis.         |  
| Facebook       | Posts & public comments.       |  
| LinkedIn       | Articles and engagements.      |  
| Reddit         | Threads and replies.           |  
| Instagram      | Captions and comments.         |  
| YouTube        | Video comments.                |  

---

##  Development  
###  Project Structure  
```  
moodscope-extension/  
├── src/                # Core code  
├── assets/             # Icons, styles  
├── manifest.json       # Extension config  
└── README.md  
```  

###  Build & Test  
1. Run locally: Load unpacked in Chrome (see [Installation](#-installation)).  
2. Debug: Use Chrome’s extension dev tools (`chrome://extensions/`).  

---

##  Contributing  
We welcome contributions! Please follow:  
1. **Fork** → **Branch** (`feat/` or `fix/` prefix).  
2. Test changes thoroughly.  
3. Submit a **Pull Request** with a clear description.  

*See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

##  Code of Conduct  
Be respectful and inclusive. Report unacceptable behavior to [labib.45x@gmail.com ].  
 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)  

---




##  FAQ  
**Q: Does MoodScope store my data?**  
A: No—all analysis happens locally in your browser.  

**Q: Can I suggest a new platform?**  
A: Yes! Open an [Issue](issues) with the platform details.  


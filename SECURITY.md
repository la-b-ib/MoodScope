
# MoodScope Security Policy 

## ⚠ Reporting Vulnerabilities

**If you discover any security issue, please report it responsibly:**

1. **Do not** create public issues for security vulnerabilities
2. Email me at: [labib.45x@gmail.com ](labib.45x@gmail.com)  
   *(Response within 48 hours)*
3. Include:
   - Detailed description
   - Steps to reproduce
   - Impact assessment
   - Suggested fixes (if known)

**Rewards**: Qualified reports may receive acknowledgement in release notes (bug bounty program coming soon).

---

##  Security Practices

### Data Protection
- **No data collection**: All sentiment analysis occurs locally in your browser
- **No tracking**: Zero analytics or user behavior monitoring
- **Storage**: Uses Chrome's `chrome.storage.local` with encryption for settings

### Code Safety
- **Dependencies**: Regularly audited via `npm audit`
- **Permissions**: Minimal Chrome API access:
  ```json
  "permissions": [
    "storage",
    "activeTab",
    "https://*.twitter.com/*"
  ]
  ```
- **Content Security Policy (CSP)**:
  ```json
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
  ```

### Review Process
- All pull requests require:
  - Security review by maintainers
  - Static analysis using [ESLint Security Rules](https://github.com/nodesecurity/eslint-plugin-security)
  - Manual inspection for:
    - XSS vulnerabilities
    - Injection risks
    - Permission escalations

---

##  Known Risks & Mitigations

| Risk | Protection |
|------|------------|
| Malicious social media scripts | Sandboxed content scripts |
| API token leakage | OAuth token rotation |
| DOM-based XSS | DOMPurify for dynamic content |
| Man-in-the-middle attacks | HTTPS enforcement for all requests |

---

##  Update Policy
- Critical fixes: Released within 72 hours of discovery
- Regular updates: Monthly security patches
- Supported versions: Latest 2 major releases

---

##  User Security Tips
1. Keep Chrome updated
2. Review extension permissions periodically
3. Report suspicious behavior immediately

**Last Updated**: 2025-04-25  

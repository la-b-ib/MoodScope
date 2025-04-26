
# Contributing to MoodScope 

We welcome contributions from everyone! Whether you're fixing bugs, improving docs, or suggesting features, your help makes MoodScope better for all users.

##  How to Contribute

### 1. Report Bugs
- **Check existing issues** to avoid duplicates
- Use the [Bug Report template](ISSUE_TEMPLATE/bug_report.md) (if available)
- Include:
  - Steps to reproduce
  - Expected vs. actual behavior
  - Screenshots (if applicable)
  - Browser/OS version

### 2. Suggest Enhancements
- Use the [Feature Request template](ISSUE_TEMPLATE/feature_request.md)
- Explain:
  - The problem it solves
  - Proposed solution
  - Alternatives considered

### 3. Code Contributions
#### Setup:
```bash
git clone https://github.com/la-b-ib/moodscope-extension.git
cd moodscope-extension
npm install  # or yarn
```

#### Workflow:
1. **Fork** the repository
2. Create a **branch** (use prefixes):
   - `feat/`: New features
   - `fix/`: Bug fixes
   - `docs/`: Documentation
   - `chore/`: Maintenance
3. **Test changes** locally:
   ```bash
   npm test
   npm run lint  # Ensure code style consistency
   ```
4. **Commit** with descriptive messages:
   ```bash
   git commit -m "feat: add sentiment analysis for TikTok"
   ```
5. **Push** to your fork
6. Open a **Pull Request** against `main`

##  Testing Guidelines
- All new features require tests
- Verify changes on:
  - Chrome (latest version)
  - At least 2 supported platforms (X, Reddit, etc.)
- Update snapshots if needed:
  ```bash
  npm test -- -u
  ```

##  Code Standards
- **JavaScript**: Follow [Airbnb Style Guide](https://github.com/airbnb/javascript)
- **Comments**: JSDoc for complex functions
- **Accessibility**:
  - WCAG 2.1 AA compliant
  - Test with screen readers (VoiceOver/NVDA)
- **Performance**:
  - No memory leaks
  - Chrome DevTools Audit ≥ 90

##  Pull Request Process
1. Ensure all tests pass
2. Update documentation (README/docs)
3. Include screenshots/GIFs for UI changes
4. Allow maintainers to modify your PR

## Project Documentation

<div style="display: flex; gap: 10px; margin: 15px 0; align-items: center; flex-wrap: wrap;">

[![License](https://img.shields.io/badge/License-See_FILE-007EC7?style=for-the-badge&logo=creativecommons)](LICENSE)
[![Security](https://img.shields.io/badge/Security-Policy_%7C_Reporting-FF6D00?style=for-the-badge&logo=owasp)](SECURITY.md)
[![Contributing](https://img.shields.io/badge/Contributing-Guidelines-2E8B57?style=for-the-badge&logo=git)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code_of_Conduct-Community_Standards-FF0000?style=for-the-badge&logo=opensourceinitiative)](CODE_OF_CONDUCT.md)

</div>

## Contact Information



  
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:labib.45x@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/la-b-ib)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/la-b-ib/)
[![Portfolio](https://img.shields.io/badge/Website-0A5C78?style=for-the-badge&logo=internet-explorer&logoColor=white)](https://la-b-ib.github.io/)
[![X](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=twitter&logoColor=white)](https://x.com/la_b_ib_)






---


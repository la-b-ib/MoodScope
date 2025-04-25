
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

##  Need Help?
- Join our [Discussions](https://github.com/la-b-ib/moodscope-extension/discussions)
- Email: [labib.45x@gmail.com ](mailto:labib.45x@gmail.com )

##  Thank You!
Your contributions will be acknowledged in our:
- Release notes
- Contributors list
- Project documentation

*By contributing, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).*

# Deployment Checklist

Complete these items before deploying to production.

## Backend Deployment

### Critical (Must Do)

- [ ] **⚠️ MOVE OPENAI API KEY TO ENVIRONMENT VARIABLE**
  - Currently hardcoded in `cv_parser.py` line 7
  - Currently hardcoded in `answer_generator.py` line 5
  - Use `os.getenv('OPENAI_API_KEY')` instead
  - Set in Railway environment variables

- [ ] Update CORS settings in `main.py`
  - Change from `allow_origins=["*"]` to specific extension ID
  - Example: `allow_origins=["chrome-extension://YOUR_EXTENSION_ID"]`

- [ ] Add rate limiting
  - Prevent API abuse
  - Consider per-user or per-IP limits

### Recommended

- [ ] Add logging and error tracking (e.g., Sentry)
- [ ] Add request validation and better error messages
- [ ] Set up health monitoring
- [ ] Add API key rotation strategy
- [ ] Consider caching for repeated questions
- [ ] Add request timeout handling

## Extension Deployment

### Critical (Must Do)

- [ ] Create extension icons
  - 16x16 px
  - 48x48 px
  - 128x128 px
  - Update `manifest.json` with file paths

- [ ] Update default API URL
  - Change from `localhost:8000` to your Railway URL
  - In `extension/src/sidepanel/api.ts` line 6

- [ ] Test on multiple job boards
  - Greenhouse
  - Lever
  - Workday
  - LinkedIn Easy Apply
  - Indeed

### Recommended

- [ ] Add privacy policy URL to manifest
- [ ] Add detailed description for Chrome Web Store
- [ ] Create promotional images/screenshots
- [ ] Add analytics (optional, with user consent)
- [ ] Add feedback mechanism
- [ ] Consider error reporting tool

## Testing

- [ ] Test CV upload with various formats
- [ ] Test answer generation with different styles
- [ ] Test on at least 5 different job application sites
- [ ] Test extension update flow
- [ ] Test with slow network conditions
- [ ] Test error scenarios (backend down, API key invalid, etc.)

## Legal & Compliance

- [ ] Create privacy policy
- [ ] Add terms of service
- [ ] Ensure GDPR compliance if targeting EU users
- [ ] Add data deletion mechanism
- [ ] Consider terms of service for job boards (automation policies)

## Documentation

- [ ] Update README with production URLs
- [ ] Add troubleshooting section
- [ ] Create user guide with screenshots
- [ ] Document API endpoints
- [ ] Add contributing guidelines

## Security

- [ ] Review permissions in manifest.json
- [ ] Audit for XSS vulnerabilities
- [ ] Ensure no sensitive data in logs
- [ ] Add CSP headers
- [ ] Review third-party dependencies for vulnerabilities

## Performance

- [ ] Optimize bundle size
- [ ] Test with large CVs (10+ pages)
- [ ] Test with forms containing 50+ fields
- [ ] Monitor API response times
- [ ] Consider lazy loading for React components

---

## Quick Commands

### Update API key to environment variable:

**backend/cv_parser.py:**
```python
import os
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable not set")
```

**backend/answer_generator.py:**
```python
import os
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable not set")
```

### Set in Railway:
```
OPENAI_API_KEY=sk-...your-key-here
```

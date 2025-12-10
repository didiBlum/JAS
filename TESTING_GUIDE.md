# Testing Guide

Complete guide to test SubmitMe end-to-end.

## Prerequisites

- OpenAI API key added to backend code
- Backend running on `localhost:8000`
- Extension built and loaded in Chrome

## Step-by-Step Testing

### 1. Test Backend API (Standalone)

First, verify the backend works independently:

```bash
# Start backend
cd backend
python main.py
```

**Test health endpoint:**
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"submitme-api"}
```

**Test CV upload:**
```bash
# Prepare a test CV (PDF or DOCX)
curl -X POST http://localhost:8000/upload_cv \
  -F "file=@/path/to/your/test-cv.pdf"
```

Expected response: JSON with parsed CV data (name, experience, skills, etc.)

**Test answer generation:**
```bash
curl -X POST http://localhost:8000/generate_answer \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Why do you want this role?",
    "cv_data": {
      "name": "Test User",
      "summary": "Software engineer with 5 years experience",
      "experience": [],
      "skills": ["Python", "JavaScript"],
      "projects": [],
      "education": []
    },
    "style": {
      "voice_tone": "confident",
      "length": "medium",
      "personality": "balanced"
    }
  }'
```

Expected response: JSON with generated answer.

---

### 2. Build & Load Extension

```bash
# Build extension
cd extension
npm install
npm run build
```

**Load in Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Navigate to `submitme/extension/dist` and select it
5. Extension should appear in your toolbar

**Check for errors:**
- Look for any red error messages in the extensions page
- Click "Inspect views: service worker" to check background script console

---

### 3. Test Extension Flow

#### A. Upload CV

1. Click the SubmitMe extension icon in your toolbar
2. Side panel should open with "Welcome to SubmitMe" screen
3. Drag & drop or click to upload a test CV (PDF or DOCX)
4. Watch the console for any errors:
   - Right-click in side panel → "Inspect"
   - Check Console tab
5. CV should parse and you should see the "Questions" tab

**Expected behavior:**
- Loading spinner while parsing
- Success: Redirects to Questions view
- Error: Shows error message in red box

#### B. Test with Sample Form

1. Open the test form: `file:///path/to/submitme/test/sample-application-form.html`
2. With the side panel still open, click "Scan Page"
3. You should see 6 detected fields (the textareas, not the short name/email fields)

**Expected behavior:**
- Fields list appears with questions
- Each field shows type (textarea) and question text
- No short fields (<50 chars) should be detected

#### C. Generate Answers

1. Click on a field to expand it
2. Click "Generate Answer"
3. Wait 2-5 seconds
4. Answer should appear in the textarea

**Expected behavior:**
- Button shows "Generating..."
- Answer appears based on your CV
- You can edit the answer
- Field gets a green "✓ Generated" badge

**Try different question types:**
- Motivation: "Why do you want to work at TechCorp?"
- Experience: "Describe a challenging project..."
- Skills: "What technical skills..."
- Behavioral: "Tell us about a time you had a conflict..."

#### D. Fill Fields

1. After generating an answer, click "Fill Field"
2. The answer should appear in the form on the page
3. Check that the textarea on the page is actually filled

**Alternative: Bulk Operations**

1. Click "Generate All" to generate all answers at once
2. Wait for all to complete
3. Click "Fill All" to fill all fields at once
4. Verify all textareas on the page are filled

#### E. Test Style Customization

1. Go to "Settings" tab
2. Change writing style:
   - Try "Formal" tone
   - Try "Short" length
   - Try "Technical" personality
3. Go back to "Questions" tab
4. Regenerate an answer
5. Verify the style changed

---

### 4. Test Real Job Boards

Try with actual job application sites:

**Greenhouse:**
- Find any company using Greenhouse (e.g., search "greenhouse apply")
- Example: https://boards.greenhouse.io/

**Lever:**
- Find any company using Lever
- Example: https://jobs.lever.co/

**Workday:**
- Many large companies use Workday
- Usually at `company.wd1.myworkdayjobs.com`

**Test on each:**
1. Navigate to application form
2. Scan page
3. Generate answers
4. Fill fields
5. Verify fields are actually filled

---

### 5. Edge Cases to Test

#### Test Different CV Formats
- [ ] PDF with text
- [ ] PDF with images (scanned CV)
- [ ] DOCX file
- [ ] Large CV (10+ pages)
- [ ] CV with special characters

#### Test Error Scenarios
- [ ] Upload non-PDF/DOCX file (should reject)
- [ ] Stop backend, try to generate answer (should show error)
- [ ] Try on page with no forms (should show "no fields detected")
- [ ] Try with very long question (500+ characters)

#### Test Form Types
- [ ] Multi-page forms (wizards)
- [ ] Forms with dynamically loaded fields
- [ ] Forms with rich text editors (TinyMCE, Quill)
- [ ] Forms inside iframes

#### Test Storage
- [ ] Close extension, reopen → CV should persist
- [ ] Change style settings → should persist after reload
- [ ] Upload new CV → should replace old one

---

## Common Issues & Solutions

### Backend Issues

**"Connection refused" error:**
- Backend not running
- Solution: `cd backend && python main.py`

**"Failed to parse CV" error:**
- OpenAI API key not set or invalid
- Solution: Check `cv_parser.py` and `answer_generator.py` for correct key

**CORS error in browser console:**
- Extension can't reach backend
- Solution: Check `host_permissions` in `manifest.json`

### Extension Issues

**Side panel doesn't open:**
- Check Chrome version (needs 114+)
- Try right-click icon → "Open side panel"
- Check background script errors

**No fields detected:**
- Page has no suitable form fields
- All fields are too short (<50 chars)
- Fields are in shadow DOM or iframe
- Solution: Try a different page

**Fields don't fill:**
- Content script not injected
- Solution: Reload the page and try again

**"Backend not reachable" error:**
- API URL wrong in Settings
- Backend not running
- Solution: Check Settings → API URL (should be `http://localhost:8000`)

---

## Debugging Tips

### Backend Logs
Watch terminal running `python main.py` for logs:
- CV upload logs
- Answer generation logs
- Error messages

### Extension Console
**Background script:**
- `chrome://extensions/` → Click "Inspect views: service worker"

**Content script:**
- On any webpage → F12 → Console
- Look for "SubmitMe content script loaded"

**Side panel:**
- Right-click in side panel → "Inspect"
- Check Network tab for API calls
- Check Console for errors

### Network Inspection
Check API calls:
1. Open side panel inspector
2. Go to Network tab
3. Try uploading CV or generating answer
4. Check request/response details

---

## Success Criteria

Your test is successful if you can:

- ✅ Upload a CV and see parsed data
- ✅ Scan a form and detect fields
- ✅ Generate answers for different question types
- ✅ Answers reflect your CV content
- ✅ Fill individual fields
- ✅ Fill all fields at once
- ✅ Style changes affect answer generation
- ✅ CV persists after closing extension
- ✅ Works on at least one real job board

---

## Quick Test Script

Here's a quick 2-minute test:

```bash
# Terminal 1: Start backend
cd backend && python main.py

# Terminal 2: Build extension
cd extension && npm run build

# Browser:
# 1. Load extension at chrome://extensions/
# 2. Open test/sample-application-form.html
# 3. Click extension icon
# 4. Upload a CV
# 5. Click "Scan Page"
# 6. Click "Generate All"
# 7. Click "Fill All"
# 8. Check if form is filled ✅
```

If this works, your MVP is functional!

# Quick Start Guide

Get SubmitMe running in 5 minutes!

## Step 1: Backend Setup (2 minutes)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Add your OpenAI API key
# Edit cv_parser.py line 7: OPENAI_API_KEY = "your-key-here"
# Edit answer_generator.py line 5: OPENAI_API_KEY = "your-key-here"

# Run server
python main.py
```

Server running at `http://localhost:8000` ✅

## Step 2: Extension Setup (2 minutes)

```bash
cd extension

# Install dependencies
npm install

# Build extension
npm run build
```

## Step 3: Load Extension in Chrome (1 minute)

1. Open Chrome → `chrome://extensions/`
2. Toggle "Developer mode" ON (top-right)
3. Click "Load unpacked"
4. Select `submitme/extension/dist` folder
5. Pin the extension to your toolbar

## Step 4: Test It Out!

1. Click the SubmitMe extension icon
2. Upload a test CV (PDF or DOCX)
3. Go to any job application form (try Greenhouse, Lever, or Workday)
4. Click "Scan Page" in the extension
5. Click "Generate Answer" for any question
6. Review the answer and click "Fill Field"

Done! 🎉

## Troubleshooting

**Extension doesn't load:**
- Make sure you built with `npm run build`
- Check Chrome console for errors
- Reload extension at `chrome://extensions/`

**Backend errors:**
- Check OpenAI API key is correct
- Make sure you have Python 3.9+
- Check server logs for errors

**No fields detected:**
- Make sure you're on a page with a form
- Try a different job application site
- Check browser console for content script errors

**Generation fails:**
- Make sure backend is running at `localhost:8000`
- Check API URL in extension Settings
- Verify OpenAI API key is valid and has credits

## Next Steps

- Customize writing style in Settings
- Test on different job boards
- Deploy backend to Railway for production use
- Create proper extension icons

## Important Reminders

⚠️ **Before deploying to production:**
1. Move OpenAI API key to environment variable
2. Update CORS settings
3. Add rate limiting
4. Create extension icons
5. Test thoroughly on multiple sites

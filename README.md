# SubmitMe - AI Job Application Autofill

An AI-powered Chrome extension that automatically fills job application forms with personalized, high-quality answers based on your CV.

## Project Overview

SubmitMe helps job seekers save time and submit better applications by:
- Automatically parsing job application forms
- Generating tailored answers using AI based on your CV
- Maintaining your unique writing style and tone
- Filling forms with one click

## Architecture

```
submitme/
├── backend/              # FastAPI backend
│   ├── main.py          # API endpoints
│   ├── cv_parser.py     # CV parsing with OpenAI
│   ├── answer_generator.py  # Answer generation
│   └── models.py        # Data models
│
└── extension/           # Chrome extension
    ├── src/
    │   ├── background/  # Service worker
    │   ├── content/     # Form detection
    │   └── sidepanel/   # React UI
    └── manifest.json
```

## Tech Stack

**Backend:**
- FastAPI (Python)
- OpenAI API (GPT-4o for parsing and generation)
- pypdf, python-docx for CV parsing

**Extension:**
- TypeScript
- React
- Vite
- Tailwind CSS
- Chrome Extension Manifest V3

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API key
- Chrome browser

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. **IMPORTANT:** Add your OpenAI API key:
   - Open `cv_parser.py` and replace `"your-openai-api-key-here"`
   - Open `answer_generator.py` and replace `"your-openai-api-key-here"`
   - ⚠️ **TODO:** Move to environment variable before going live!

4. Run the server:
```bash
python main.py
# or
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`

### Extension Setup

1. Navigate to extension directory:
```bash
cd extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `extension/dist` folder

## Usage

1. **Upload CV**: Click extension icon, upload your CV (PDF or DOCX)
2. **Scan Form**: Navigate to a job application page, click "Scan Page"
3. **Generate Answers**: Click "Generate Answer" for each question
4. **Review & Edit**: Review generated answers and make edits
5. **Fill Form**: Click "Fill Field" or "Fill All" to autofill the form

## Deployment

### Backend (Railway)

1. Connect your GitHub repo to Railway
2. Add environment variable: `OPENAI_API_KEY=your-key-here`
3. Railway will auto-deploy using `railway.json` config
4. Update extension's API URL in Settings to your Railway URL

### Extension (Chrome Web Store)

1. Create icons (16x16, 48x48, 128x128)
2. Build production version: `npm run build`
3. Zip the `dist` folder
4. Upload to Chrome Web Store Developer Dashboard

## Configuration

**Backend:**
- API runs on port 8000 (configurable via `PORT` env var)
- OpenAI API key in environment variable

**Extension:**
- CV stored locally in `chrome.storage.local`
- API URL configurable in Settings (default: `localhost:8000`)
- Writing style preferences stored locally

## Features Roadmap

### MVP v1 (Current)
- ✅ Upload & parse CV (PDF/DOCX)
- ✅ Scan form fields
- ✅ Generate answers with style customization
- ✅ Manual fill button per field

### MVP v2
- [ ] Auto-fill all fields
- [ ] LinkedIn profile import
- [ ] Save application history
- [ ] Improved question classification

### MVP v3 (Premium)
- [ ] Company-specific tailoring using job description
- [ ] Long-form essay generation
- [ ] Rewrite user-provided drafts
- [ ] CV insights and suggestions

## Security & Privacy

- CV data stored locally on user's device only
- CV sent to backend only when generating answers
- No persistent storage of CVs on server
- All API calls over HTTPS (in production)

## Important Notes

⚠️ **BEFORE GOING LIVE:**
1. **Move hardcoded OpenAI API key to environment variable!**
2. Update CORS settings to restrict to extension only
3. Add rate limiting to prevent abuse
4. Create proper extension icons
5. Add error tracking and logging
6. Test on multiple job application sites

## API Endpoints

### `POST /upload_cv`
Upload and parse a CV file.

### `POST /generate_answer`
Generate an answer for a question.
```json
{
  "question": "Why do you want this role?",
  "cv_data": { ... },
  "style": {
    "voice_tone": "confident",
    "length": "medium",
    "personality": "balanced"
  }
}
```

### `GET /health`
Health check endpoint.

## Contributing

This is an MVP. Future improvements welcome:
- Better form detection (multi-page forms, rich text editors)
- Vector search for CV context retrieval
- Better question classification
- Support for more file formats
- LinkedIn OAuth integration

## License

MIT

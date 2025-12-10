# SubmitMe Chrome Extension

AI-powered job application autofill Chrome extension built with React, TypeScript, and Vite.

## Features

- Parse CVs (PDF/DOCX) and store locally
- Automatically detect form fields on job application pages
- Generate personalized answers using AI based on your CV
- Customize writing style (tone, length, personality)
- Fill individual fields or all fields at once
- Side panel UI for easy access

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

For development with auto-reload:
```bash
npm run dev
```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/dist` folder

## Project Structure

```
extension/
├── src/
│   ├── background/         # Service worker
│   ├── content/            # Content script (form detection)
│   ├── sidepanel/          # React UI
│   │   ├── components/     # React components
│   │   ├── App.tsx         # Main app component
│   │   ├── api.ts          # API calls to backend
│   │   └── storage.ts      # Chrome storage utilities
│   └── types.ts            # TypeScript types
├── manifest.json           # Extension manifest
└── package.json
```

## Usage

1. Click the SubmitMe extension icon to open the side panel
2. Upload your CV (PDF or DOCX)
3. Navigate to a job application form
4. Click "Scan Page" to detect form fields
5. Click "Generate Answer" for each question (or "Generate All")
6. Review and edit answers as needed
7. Click "Fill Field" to autofill (or "Fill All")

## Configuration

- **API URL**: Set in Settings tab (default: `http://localhost:8000`)
- **Writing Style**: Customize tone, length, and personality in Settings

## Notes

- CV data is stored locally using `chrome.storage.local`
- Requires backend API to be running for CV parsing and answer generation
- Works on any webpage with text input fields or textareas

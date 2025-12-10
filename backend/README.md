# SubmitMe Backend API

FastAPI backend for the SubmitMe Chrome extension.

## Features

- CV parsing (PDF/DOCX) with OpenAI structured extraction
- AI-powered answer generation for job application questions
- Question classification (motivation, experience, skills, behavioral)
- Style customization (tone, length, personality)

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set your OpenAI API key:
```bash
# Currently hardcoded in cv_parser.py and answer_generator.py
# TODO: Move to environment variable before deployment
```

3. Run locally:
```bash
python main.py
# or
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`

## API Endpoints

### `GET /health`
Health check endpoint.

### `POST /upload_cv`
Upload and parse a CV file (PDF or DOCX).

**Request:** `multipart/form-data` with file
**Response:** Structured CV data (JSON)

### `POST /generate_answer`
Generate a tailored answer to an application question.

**Request body:**
```json
{
  "question": "Why do you want this role?",
  "cv_data": { ... },
  "style": {
    "voice_tone": "confident",
    "length": "medium",
    "personality": "balanced"
  },
  "job_description": "Optional job description text"
}
```

**Response:**
```json
{
  "answer": "Generated answer text...",
  "question_type": "motivation"
}
```

## Deployment (Railway)

1. Connect your GitHub repo to Railway
2. Add environment variable: `OPENAI_API_KEY`
3. Railway will auto-detect and deploy using `railway.json` config

## TODO Before Going Live

- [ ] **CRITICAL:** Move hardcoded OpenAI API key to environment variable
- [ ] Update CORS origins to restrict to extension only
- [ ] Add rate limiting
- [ ] Add request validation and better error handling
- [ ] Consider caching for repeated questions

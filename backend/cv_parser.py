import io
import os
from typing import BinaryIO
from openai import OpenAI
from pypdf import PdfReader
from docx import Document
from models import ParsedCV
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable not set")

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_text_from_pdf(file: BinaryIO) -> str:
    """Extract text from PDF file."""
    reader = PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text


def extract_text_from_docx(file: BinaryIO) -> str:
    """Extract text from DOCX file."""
    doc = Document(file)
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text


def parse_cv_with_openai(text: str) -> ParsedCV:
    """
    Parse CV text using OpenAI structured extraction.
    Uses function calling to enforce structured output.
    """

    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": """You are a flexible CV/resume parser that can handle various CV formats and styles.

Your task is to extract structured information from any CV format, including:
- Traditional chronological CVs
- Functional/skills-based CVs
- Creative/modern formats
- Academic CVs
- CVs in different languages or cultural styles

Guidelines:
- Extract the candidate's full name (check headers, top of page, signature lines)
- Where possible, also extract first and last name separately using the CV wording (do not invent new names)
- Find contact info: email, phone, LinkedIn URL, and personal website/portfolio URL (look anywhere in the document)
- Capture current location/country if present (city/state is okay but prioritize country)
- IMPORTANT: Look for LinkedIn profile URLs (linkedin.com/in/...) - they may be in headers, footers, contact sections, or as hyperlinks
- Create a brief professional summary (synthesize from objective, about me, profile sections, or opening paragraphs)
- List work experience: company names, job titles, dates if available, and key achievements/responsibilities
- Extract all skills: technical skills, soft skills, tools, languages, certifications
- Identify projects: personal projects, academic projects, portfolio work with descriptions
- Extract education: degrees, institutions, dates, relevant coursework

Be flexible and adaptive:
- If a section is missing or unclear, use null for nullable fields or empty arrays
- Infer information from context when explicit labels are absent
- Handle various date formats and job title variations
- Extract achievements from bullet points, paragraphs, or narrative text
- Look for alternative section names (e.g., "Professional Experience" vs "Work History")
- LinkedIn URLs may appear as: full URLs, shortened URLs, or just the username portion

Output valid data even for minimal or poorly formatted CVs."""
            },
            {
                "role": "user",
                "content": f"Parse this CV:\n\n{text}"
            }
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "parsed_cv",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "first_name": {"type": ["string", "null"]},
                        "last_name": {"type": ["string", "null"]},
                        "email": {"type": ["string", "null"]},
                        "phone": {"type": ["string", "null"]},
                        "linkedin_url": {"type": ["string", "null"]},
                        "website": {"type": ["string", "null"]},
                        "country": {"type": ["string", "null"]},
                        "summary": {"type": "string"},
                        "experience": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "company": {"type": "string"},
                                    "role": {"type": "string"},
                                    "duration": {"type": ["string", "null"]},
                                    "achievements": {
                                        "type": "array",
                                        "items": {"type": "string"}
                                    }
                                },
                                "required": ["company", "role", "duration", "achievements"],
                                "additionalProperties": False
                            }
                        },
                        "skills": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "projects": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "description": {"type": "string"},
                                    "technologies": {
                                        "type": "array",
                                        "items": {"type": "string"}
                                    }
                                },
                                "required": ["name", "description", "technologies"],
                                "additionalProperties": False
                            }
                        },
                        "education": {
                            "type": "array",
                            "items": {"type": "string"}
                        }
                    },
                    "required": ["name", "email", "phone", "linkedin_url", "website", "country", "summary", "experience", "skills", "projects", "education"],
                    "additionalProperties": False
                }
            }
        }
    )

    import json
    parsed_data = json.loads(completion.choices[0].message.content)
    return ParsedCV(**parsed_data)


async def parse_cv_file(file_content: bytes, filename: str) -> ParsedCV:
    """
    Main entry point for CV parsing.
    Detects file type and extracts structured data.
    """
    file_io = io.BytesIO(file_content)

    # Extract text based on file type
    if filename.lower().endswith('.pdf'):
        text = extract_text_from_pdf(file_io)
    elif filename.lower().endswith('.docx'):
        text = extract_text_from_docx(file_io)
    else:
        raise ValueError("Unsupported file format. Please upload PDF or DOCX.")

# Parse with OpenAI
    return parse_cv_with_openai(text)

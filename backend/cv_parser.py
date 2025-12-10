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
                "content": """You are a CV/resume parser. Extract structured information from the provided CV text.

Guidelines:
- Extract the candidate's name, contact info, professional summary
- List work experience with company names, roles, and key achievements
- Extract skills (technical and soft skills)
- Identify projects with descriptions and technologies used
- Extract education details

Be thorough and accurate. If information is not available, use empty arrays/strings."""
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
                        "email": {"type": ["string", "null"]},
                        "phone": {"type": ["string", "null"]},
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
                                "required": ["company", "role", "achievements"],
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
                    "required": ["name", "summary", "experience", "skills", "projects", "education"],
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

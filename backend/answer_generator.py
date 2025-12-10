import logging
import os
import re
from typing import Optional, List
from openai import OpenAI
from models import ParsedCV, StylePreferences, GenerateAnswerResponse
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable not set")

client = OpenAI(api_key=OPENAI_API_KEY)


def classify_question(question: str) -> str:
    """
    Classify the type of question being asked.
    """
    question_lower = question.lower()

    if any(word in question_lower for word in ["why", "motivation", "interested", "want to join"]):
        return "motivation"
    elif any(word in question_lower for word in ["project", "experience", "worked on", "tell us about"]):
        return "experience"
    elif any(word in question_lower for word in ["skill", "knowledge", "proficient", "familiar with"]):
        return "skills"
    elif any(word in question_lower for word in ["challenge", "conflict", "difficult", "problem", "situation"]):
        return "behavioral"
    else:
        return "general"


def _derive_name_parts(cv_data: ParsedCV) -> tuple[Optional[str], Optional[str]]:
    """
    Get first and last name from the parsed CV without inventing new values.
    """
    if getattr(cv_data, "first_name", None) or getattr(cv_data, "last_name", None):
        return cv_data.first_name, cv_data.last_name

    if cv_data.name:
        parts = cv_data.name.strip().split()
        if parts:
            first = parts[0]
            last = parts[-1] if len(parts) > 1 else None
            return first, last

    return None, None


def answer_basic_field(question: str, cv_data: ParsedCV) -> Optional[GenerateAnswerResponse]:
    """
    For simple identity/contact questions, respond directly with CV data
    without using the LLM.
    """
    q = question.lower()
    first_name, last_name = _derive_name_parts(cv_data)

    field_value = None
    options: List[str] = []

    def _extract_options(raw_question: str) -> List[str]:
        """
        Try to extract dropdown options from the question text, e.g.:
        - "Options: USA, Canada, UK"
        - "[USA, Canada, UK]"
        """
        raw_lower = raw_question.lower()
        collected = []

        bracketed = re.findall(r"\[([^\]]+)\]", raw_question)
        for group in bracketed:
            collected.extend(group.split(","))

        options_match = re.search(r"options?:\s*(.+)", raw_question, flags=re.IGNORECASE)
        if options_match:
            collected.extend(options_match.group(1).split(","))

        # Normalize and dedupe
        normalized = []
        seen = set()
        for opt in collected:
            clean = opt.strip()
            if clean and clean.lower() not in seen:
                seen.add(clean.lower())
                normalized.append(clean)

        return normalized
    if "first name" in q:
        field_value = first_name
    elif "last name" in q or "surname" in q or "family name" in q:
        field_value = last_name
    elif "full name" in q or ("your name" in q) or q.strip() in {"name", "what is your name"}:
        field_value = cv_data.name
    elif "email" in q or "e-mail" in q:
        field_value = cv_data.email
    elif "phone" in q or "phone number" in q or "mobile" in q or "contact number" in q:
        field_value = cv_data.phone
    elif "linkedin" in q:
        field_value = cv_data.linkedin_url
    elif "website" in q or "portfolio" in q or "site" in q:
        # If website not present in CV, return empty answer
        field_value = cv_data.website or ""
    elif "country" in q or "location" in q:
        options = _extract_options(question)
        if options and cv_data.country:
            match = next((opt for opt in options if opt.lower() == cv_data.country.lower()), None)
            if not match:
                match = next((opt for opt in options if cv_data.country.lower() in opt.lower() or opt.lower() in cv_data.country.lower()), None)
            field_value = match or ""
        elif cv_data.country:
            field_value = cv_data.country

    if field_value:
        return GenerateAnswerResponse(answer=str(field_value), question_type="basic_info")

    return None


def build_cv_context(cv_data: ParsedCV) -> str:
    """
    Convert structured CV data into a narrative context for the LLM.
    """
    context = f"Candidate Name: {cv_data.name}\n\n"

    if cv_data.country:
        context += f"Location/Country: {cv_data.country}\n\n"

    if cv_data.summary:
        context += f"Professional Summary:\n{cv_data.summary}\n\n"

    if cv_data.experience:
        context += "Work Experience:\n"
        for exp in cv_data.experience:
            context += f"- {exp.role} at {exp.company}"
            if exp.duration:
                context += f" ({exp.duration})"
            context += "\n"
            for achievement in exp.achievements:
                context += f"  • {achievement}\n"
        context += "\n"

    if cv_data.skills:
        context += f"Skills: {', '.join(cv_data.skills)}\n\n"

    if cv_data.projects:
        context += "Projects:\n"
        for project in cv_data.projects:
            context += f"- {project.name}: {project.description}\n"
            if project.technologies:
                context += f"  Technologies: {', '.join(project.technologies)}\n"
        context += "\n"

    if cv_data.education:
        context += f"Education:\n"
        for edu in cv_data.education:
            context += f"- {edu}\n"

    return context


def get_style_instructions(style: StylePreferences) -> str:
    """
    Convert style preferences into instructions for the LLM.
    """
    instructions = []

    # Voice tone
    tone_map = {
        "formal": "Use professional, formal language. Avoid contractions.",
        "friendly": "Use warm, approachable language. Be conversational.",
        "confident": "Write with confidence and assertiveness. Highlight strengths directly.",
        "humble": "Be modest and balanced. Emphasize learning and growth."
    }
    instructions.append(tone_map[style.voice_tone])

    # Length
    length_map = {
        "short": "Keep answers concise, 2-3 sentences maximum.",
        "medium": "Provide moderate detail, 3-5 sentences.",
        "long": "Give comprehensive answers with examples, 5-8 sentences."
    }
    instructions.append(length_map[style.length])

    # Personality
    personality_map = {
        "technical": "Focus on technical details, tools, and methodologies.",
        "storytelling": "Use narrative structure with context, action, and results.",
        "balanced": "Balance technical details with the human impact and outcomes."
    }
    instructions.append(personality_map[style.personality])

    return " ".join(instructions)


async def generate_answer(
    question: str,
    cv_data: ParsedCV,
    style: StylePreferences,
    job_description: Optional[str] = None
) -> GenerateAnswerResponse:
    """
    Generate a tailored answer to an application question.
    """
    logger.info("Generating answer | question=%s", question)

    # Return direct CV fields for simple identity/contact questions
    direct_response = answer_basic_field(question, cv_data)
    if direct_response:
        logger.info("Direct basic info response | question=%s | answer=%s", question, direct_response.answer)
        return direct_response

    question_type = classify_question(question)
    cv_context = build_cv_context(cv_data)
    style_instructions = get_style_instructions(style)

    # Parse job context from job_description parameter
    import json
    company_context = ""
    try:
        if job_description:
            context_data = json.loads(job_description)
            if context_data.get('companyName'):
                company_context += f"Company: {context_data['companyName']}\n"
            if context_data.get('jobTitle'):
                company_context += f"Position: {context_data['jobTitle']}\n"
            if context_data.get('jobDescription'):
                company_context += f"Job Description:\n{context_data['jobDescription']}\n"
            if context_data.get('companyValues'):
                company_context += f"Company Values/Culture:\n{context_data['companyValues']}\n"
    except:
        # If not JSON, treat as raw job description
        if job_description:
            company_context = f"Job Context:\n{job_description}\n"

    # Build enhanced prompt
    system_prompt = f"""You are an expert career advisor and recruiter helping a job candidate craft compelling, authentic application responses.

YOUR MISSION:
Analyze the candidate's background strategically and select the MOST RELEVANT experiences that align with the target role. Think like a recruiter matching candidates to positions.

CRITICAL RULES:
1. ONLY use facts from the candidate's CV - NEVER fabricate experiences or achievements
2. ALWAYS use the ACTUAL company name provided - NEVER use placeholders like [Company Name] or [Role]
3. STRATEGICALLY SELECT which experiences to highlight based on relevance
4. Write in first person as the candidate
5. Be authentic - if the CV lacks relevant experience, acknowledge it briefly and pivot to transferable skills

STRATEGIC EXPERIENCE MATCHING:
When selecting which experiences to mention, consider:
- Industry alignment (e.g., if target is cyber security, prioritize cyber/security experience)
- Job title similarity (e.g., backend engineer → highlight backend roles)
- Work arrangement matches (e.g., if remote role, mention remote experience)
- Technology/skill overlap (e.g., if they want Python, highlight Python projects)
- Company type/size similarity (startup experience for startups, enterprise for enterprise)
- Relevant achievements that solve similar problems they're facing

For each experience on the CV, ask yourself: "How does this relate to what they're looking for?" Then emphasize the most relevant ones.

{company_context if company_context else "Note: No company information provided. Focus solely on the candidate's qualifications."}

Style Instructions: {style_instructions}

Candidate's CV:
{cv_context}
"""

    user_prompt = f"""Question: {question}

STRATEGIC ANSWERING APPROACH:

Step 1 - ANALYZE RELEVANCE:
Look at the job description and company context. What are they looking for? What industry? What skills? Remote or onsite?

Step 2 - SELECT BEST MATCHES:
From the candidate's CV, identify which experiences/projects/skills are MOST relevant to this specific role.
- Don't just list everything - be selective
- Prioritize experiences that directly relate to their needs
- If they mention cyber security and the candidate has cyber experience, LEAD with that
- If it's a remote role and candidate has remote experience, mention it
- If there's technology overlap, highlight it

Step 3 - CRAFT ANSWER:
Write a compelling answer that:
- Uses the actual company name (never placeholders)
- Highlights the MOST RELEVANT 1-2 experiences (not all of them)
- Shows clear connection between past experience and target role
- Explains WHY this specific experience makes them a great fit for THIS role
- Is specific and authentic

Example thought process:
"They're looking for a backend engineer at a cyber company. The candidate worked at a cyber startup doing backend work. PERFECT - I'll lead with that experience and explain how it directly prepares them for this role."

Now generate your answer following this strategic approach."""

    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=500
    )

    answer = completion.choices[0].message.content.strip()

    logger.info(
        "LLM answer generated | question_type=%s | question=%s | answer_preview=%s",
        question_type,
        question,
        answer[:300]
    )

    return GenerateAnswerResponse(
        answer=answer,
        question_type=question_type
    )

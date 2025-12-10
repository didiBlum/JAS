import os
from typing import Optional
from openai import OpenAI
from models import ParsedCV, StylePreferences, GenerateAnswerResponse
from dotenv import load_dotenv

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


def build_cv_context(cv_data: ParsedCV) -> str:
    """
    Convert structured CV data into a narrative context for the LLM.
    """
    context = f"Candidate Name: {cv_data.name}\n\n"

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
    system_prompt = f"""You are an expert career advisor helping a job candidate craft compelling, authentic application responses.

YOUR MISSION:
Create highly tailored answers that demonstrate clear alignment between the candidate's background and this specific company/role.

CRITICAL RULES:
1. ONLY use facts from the candidate's CV - NEVER fabricate experiences or achievements
2. ALWAYS reference the company name, role, and their values/mission when relevant
3. Show specific connections between the candidate's experience and what the company is looking for
4. Write in first person as the candidate
5. Be authentic - if the CV lacks relevant experience, acknowledge it briefly and pivot to transferable skills

{company_context}

Style Instructions: {style_instructions}

Candidate's CV:
{cv_context}
"""

    user_prompt = f"""Question: {question}

INSTRUCTIONS FOR ANSWERING:
1. If this is about motivation/interest: Explain WHY this specific company and role appeals based on their values, mission, or work
2. If this is about experience: Select the MOST relevant project/achievement from the CV that relates to their needs
3. If this is about skills: Highlight skills from the CV that directly match what they're looking for
4. Always tie your answer back to what you know about the company/role

Generate a compelling, authentic answer that shows you've researched this company and understand what they're about."""

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

    return GenerateAnswerResponse(
        answer=answer,
        question_type=question_type
    )

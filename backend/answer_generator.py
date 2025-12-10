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

    # Build the prompt
    system_prompt = f"""You are helping a job candidate answer application questions.

CRITICAL RULES:
1. Only use facts from the candidate's CV - DO NOT make up experiences or achievements
2. If the CV doesn't contain relevant information, write a brief honest answer acknowledging the gap
3. Write in first person as the candidate
4. Follow the style instructions carefully

Style Instructions: {style_instructions}

Candidate's CV:
{cv_context}
"""

    user_prompt = f"Question: {question}"

    if job_description:
        user_prompt += f"\n\nJob Description Context:\n{job_description}"

    user_prompt += "\n\nGenerate a tailored answer based only on the CV information provided."

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

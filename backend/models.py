from pydantic import BaseModel
from typing import List, Optional, Literal


class Experience(BaseModel):
    company: str
    role: str
    duration: Optional[str] = None
    achievements: List[str] = []


class Project(BaseModel):
    name: str
    description: str
    technologies: List[str] = []


class ParsedCV(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    summary: str
    experience: List[Experience] = []
    skills: List[str] = []
    projects: List[Project] = []
    education: List[str] = []


class StylePreferences(BaseModel):
    voice_tone: Literal["formal", "friendly", "confident", "humble"] = "confident"
    length: Literal["short", "medium", "long"] = "medium"
    personality: Literal["technical", "storytelling", "balanced"] = "balanced"


class GenerateAnswerRequest(BaseModel):
    question: str
    cv_data: ParsedCV
    style: StylePreferences
    job_description: Optional[str] = None


class GenerateAnswerResponse(BaseModel):
    answer: str
    question_type: str

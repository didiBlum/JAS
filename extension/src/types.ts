export interface Experience {
  company: string;
  role: string;
  duration?: string;
  achievements: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
}

export interface ParsedCV {
  name: string;
  email?: string;
  phone?: string;
  summary: string;
  experience: Experience[];
  skills: string[];
  projects: Project[];
  education: string[];
}

export type VoiceTone = 'formal' | 'friendly' | 'confident' | 'humble';
export type AnswerLength = 'short' | 'medium' | 'long';
export type Personality = 'technical' | 'storytelling' | 'balanced';

export interface StylePreferences {
  voice_tone: VoiceTone;
  length: AnswerLength;
  personality: Personality;
}

export interface FormField {
  id: string;
  element: HTMLInputElement | HTMLTextAreaElement;
  question: string;
  type: 'text' | 'textarea';
  answer?: string;
}

export interface GenerateAnswerRequest {
  question: string;
  cv_data: ParsedCV;
  style: StylePreferences;
  job_description?: string;
}

export interface GenerateAnswerResponse {
  answer: string;
  question_type: string;
}

export interface StorageData {
  cvData?: ParsedCV;
  stylePreferences?: StylePreferences;
  apiUrl?: string;
}

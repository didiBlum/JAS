import {
  ParsedCV,
  GenerateAnswerRequest,
  GenerateAnswerResponse,
} from '../types';

const DEFAULT_API_URL = 'http://localhost:8000';

/**
 * Get the configured API URL from storage.
 */
async function getApiUrl(): Promise<string> {
  const result = await chrome.storage.local.get('apiUrl');
  return result.apiUrl || DEFAULT_API_URL;
}

/**
 * Upload and parse a CV file.
 */
export async function uploadCV(file: File): Promise<ParsedCV> {
  const apiUrl = await getApiUrl();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${apiUrl}/upload_cv`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to parse CV');
  }

  return response.json();
}

/**
 * Generate an answer for a specific question.
 */
export async function generateAnswer(
  request: GenerateAnswerRequest
): Promise<GenerateAnswerResponse> {
  const apiUrl = await getApiUrl();

  const response = await fetch(`${apiUrl}/generate_answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate answer');
  }

  return response.json();
}

/**
 * Check if the backend is healthy.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

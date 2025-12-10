import { ParsedCV, StylePreferences } from '../types';

/**
 * Storage utilities for chrome.storage.local
 */

export async function saveCVData(cvData: ParsedCV): Promise<void> {
  await chrome.storage.local.set({ cvData });
}

export async function getCVData(): Promise<ParsedCV | null> {
  const result = await chrome.storage.local.get('cvData');
  return result.cvData || null;
}

export async function saveStylePreferences(style: StylePreferences): Promise<void> {
  await chrome.storage.local.set({ stylePreferences: style });
}

export async function getStylePreferences(): Promise<StylePreferences> {
  const result = await chrome.storage.local.get('stylePreferences');
  return result.stylePreferences || {
    voice_tone: 'confident',
    length: 'medium',
    personality: 'balanced',
  };
}

export async function saveApiUrl(apiUrl: string): Promise<void> {
  await chrome.storage.local.set({ apiUrl });
}

export async function getApiUrl(): Promise<string> {
  const result = await chrome.storage.local.get('apiUrl');
  return result.apiUrl || 'http://localhost:8000';
}

export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear();
}

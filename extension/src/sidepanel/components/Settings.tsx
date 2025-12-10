import { useState } from 'react';
import { ParsedCV, StylePreferences } from '../../types';
import { saveStylePreferences, saveCVData, getApiUrl, saveApiUrl } from '../storage';
import { uploadCV } from '../api';

interface SettingsProps {
  cvData: ParsedCV | null;
  stylePreferences: StylePreferences;
  onStyleChanged: (style: StylePreferences) => void;
  onCVReuploaded: (cv: ParsedCV) => void;
}

function Settings({ cvData, stylePreferences, onStyleChanged, onCVReuploaded }: SettingsProps) {
  const [localStyle, setLocalStyle] = useState(stylePreferences);
  const [apiUrl, setApiUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load API URL on mount
  useState(() => {
    getApiUrl().then(setApiUrl);
  });

  const handleStyleChange = async (updates: Partial<StylePreferences>) => {
    const newStyle = { ...localStyle, ...updates };
    setLocalStyle(newStyle);
    await saveStylePreferences(newStyle);
    onStyleChanged(newStyle);
  };

  const handleApiUrlSave = async () => {
    await saveApiUrl(apiUrl);
    alert('API URL saved successfully');
  };

  const handleCVReupload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const parsedCV = await uploadCV(file);
      await saveCVData(parsedCV);
      onCVReuploaded(parsedCV);
      alert('CV updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CV');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

      {/* CV Info */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your CV</h3>
        {cvData && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <p className="font-medium">{cvData.name}</p>
            {cvData.email && <p className="text-sm text-gray-600">{cvData.email}</p>}
            <p className="text-sm text-gray-500 mt-2">
              {cvData.experience.length} experiences • {cvData.skills.length} skills
            </p>
          </div>
        )}

        <label className="block">
          <div className="border-2 border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 cursor-pointer transition">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleCVReupload}
              className="hidden"
              disabled={isUploading}
            />
            <p className="text-sm font-medium text-gray-700">
              {isUploading ? 'Uploading...' : 'Upload New CV'}
            </p>
          </div>
        </label>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </section>

      {/* Writing Style */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Writing Style</h3>

        <div className="space-y-4">
          {/* Voice Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Voice Tone</label>
            <select
              value={localStyle.voice_tone}
              onChange={(e) => handleStyleChange({ voice_tone: e.target.value as any })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="formal">Formal - Professional and polished</option>
              <option value="friendly">Friendly - Warm and approachable</option>
              <option value="confident">Confident - Assertive and direct</option>
              <option value="humble">Humble - Modest and balanced</option>
            </select>
          </div>

          {/* Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Answer Length</label>
            <select
              value={localStyle.length}
              onChange={(e) => handleStyleChange({ length: e.target.value as any })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="short">Short - 2-3 sentences</option>
              <option value="medium">Medium - 3-5 sentences</option>
              <option value="long">Long - 5-8 sentences</option>
            </select>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personality</label>
            <select
              value={localStyle.personality}
              onChange={(e) => handleStyleChange({ personality: e.target.value as any })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="technical">Technical - Focus on tools and methods</option>
              <option value="storytelling">Storytelling - Narrative with context</option>
              <option value="balanced">Balanced - Mix of technical and human impact</option>
            </select>
          </div>
        </div>
      </section>

      {/* API Configuration */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">API Configuration</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Backend URL</label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:8000"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleApiUrlSave}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Save URL
          </button>
        </div>
      </section>
    </div>
  );
}

export default Settings;

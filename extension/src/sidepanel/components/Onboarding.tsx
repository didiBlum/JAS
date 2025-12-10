import { useState } from 'react';
import { ParsedCV } from '../../types';
import { uploadCV } from '../api';
import { saveCVData } from '../storage';

interface OnboardingProps {
  onCVUploaded: (cv: ParsedCV) => void;
}

function Onboarding({ onCVUploaded }: OnboardingProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setError('Please upload a PDF or DOCX file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const parsedCV = await uploadCV(file);
      await saveCVData(parsedCV);
      onCVUploaded(parsedCV);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CV');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to SubmitMe</h2>
        <p className="text-gray-600">
          Upload your CV to get started. We'll use it to generate personalized answers for job applications.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <label className="block">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer transition">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Parsing your CV...</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">⬆️</div>
                <p className="text-lg font-medium text-gray-700 mb-1">Upload your CV</p>
                <p className="text-sm text-gray-500">PDF or DOCX, up to 10MB</p>
              </>
            )}
          </div>
        </label>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Privacy First</h3>
        <p className="text-sm text-blue-700">
          Your CV is stored locally on your device. We only send it to our server when generating answers,
          and it's never saved on our servers.
        </p>
      </div>
    </div>
  );
}

export default Onboarding;

import { useState } from 'react';
import { ParsedCV, StylePreferences, FormField } from '../../types';
import { generateAnswer } from '../api';

interface QuestionListProps {
  cvData: ParsedCV;
  stylePreferences: StylePreferences;
  fields: FormField[];
  onScanFields: () => void;
  isScanning: boolean;
}

interface FieldWithAnswer extends FormField {
  answer?: string;
  isGenerating?: boolean;
  questionType?: string;
}

function QuestionList({ cvData, stylePreferences, fields, onScanFields, isScanning }: QuestionListProps) {
  const [fieldsWithAnswers, setFieldsWithAnswers] = useState<FieldWithAnswer[]>([]);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);
  const [showScanSuccess, setShowScanSuccess] = useState(false);

  // Update fields when new ones are scanned
  useState(() => {
    const newFields = fields.map(f => ({ ...f }));
    setFieldsWithAnswers(newFields);

    // Show success message when fields are detected
    if (newFields.length > 0 && !isScanning) {
      setLastScanResult(`Found ${newFields.length} form field${newFields.length === 1 ? '' : 's'}`);
      setShowScanSuccess(true);
      setTimeout(() => setShowScanSuccess(false), 5000); // Hide after 5 seconds
    } else if (newFields.length === 0 && !isScanning && lastScanResult !== null) {
      setLastScanResult('No form fields detected on this page');
      setShowScanSuccess(true);
      setTimeout(() => setShowScanSuccess(false), 5000);
    }
  });

  const handleGenerateAnswer = async (field: FieldWithAnswer) => {
    // Mark as generating
    setFieldsWithAnswers(prev =>
      prev.map(f => (f.id === field.id ? { ...f, isGenerating: true } : f))
    );

    try {
      const response = await generateAnswer({
        question: field.question,
        cv_data: cvData,
        style: stylePreferences,
      });

      setFieldsWithAnswers(prev =>
        prev.map(f =>
          f.id === field.id
            ? { ...f, answer: response.answer, questionType: response.question_type, isGenerating: false }
            : f
        )
      );

      // Auto-expand the field to show the answer
      setExpandedFields(prev => new Set(prev).add(field.id));
    } catch (error) {
      console.error('Failed to generate answer:', error);
      alert('Failed to generate answer. Make sure the backend is running.');
      setFieldsWithAnswers(prev =>
        prev.map(f => (f.id === field.id ? { ...f, isGenerating: false } : f))
      );
    }
  };

  const handleFillField = async (field: FieldWithAnswer) => {
    if (!field.answer) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_FIELD',
        fieldId: field.id,
        answer: field.answer,
      });

      if (response.success) {
        alert('Field filled successfully!');
      }
    } catch (error) {
      console.error('Failed to fill field:', error);
      alert('Failed to fill field');
    }
  };

  const handleFillAll = async () => {
    const fieldsToFill = fieldsWithAnswers.filter(f => f.answer);

    if (fieldsToFill.length === 0) {
      alert('No answers generated yet. Generate answers first.');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_ALL_FIELDS',
        fields: fieldsToFill.map(f => ({ id: f.id, answer: f.answer })),
      });

      if (response.success) {
        alert(`Successfully filled ${response.filled} fields!`);
      }
    } catch (error) {
      console.error('Failed to fill all fields:', error);
      alert('Failed to fill fields');
    }
  };

  const handleGenerateAll = async () => {
    for (const field of fieldsWithAnswers) {
      if (!field.answer) {
        await handleGenerateAnswer(field);
      }
    }
  };

  const toggleField = (fieldId: string) => {
    setExpandedFields(prev => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Questions</h2>
        <p className="text-gray-600 mb-4">
          Scan the current page to detect form fields, then generate personalized answers.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onScanFields}
            disabled={isScanning}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isScanning ? 'Scanning...' : 'Scan Page'}
          </button>

          {fieldsWithAnswers.length > 0 && (
            <>
              <button
                onClick={handleGenerateAll}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Generate All
              </button>
              <button
                onClick={handleFillAll}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
              >
                Fill All
              </button>
            </>
          )}
        </div>

        {/* Scanning Indicator */}
        {isScanning && (
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p className="font-medium text-blue-900">Scanning page...</p>
              <p className="text-sm text-blue-700">Looking for form fields on the current page</p>
            </div>
          </div>
        )}

        {/* Scan Success Message */}
        {showScanSuccess && lastScanResult && (
          <div className={`mt-4 p-4 rounded-md flex items-center gap-3 ${
            fieldsWithAnswers.length > 0
              ? 'bg-green-50 border-l-4 border-green-500'
              : 'bg-yellow-50 border-l-4 border-yellow-500'
          }`}>
            <div className="text-2xl">
              {fieldsWithAnswers.length > 0 ? '✓' : '⚠️'}
            </div>
            <div>
              <p className={`font-medium ${
                fieldsWithAnswers.length > 0 ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {lastScanResult}
              </p>
              {fieldsWithAnswers.length === 0 && (
                <p className="text-sm text-yellow-700">
                  Make sure you're on a job application form page
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fields List */}
      {fieldsWithAnswers.length === 0 && !isScanning ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📋</div>
          <p>No form fields detected yet.</p>
          <p className="text-sm">Click "Scan Page" to detect fields on the current page.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fieldsWithAnswers.map((field) => {
            const isExpanded = expandedFields.has(field.id);

            return (
              <div key={field.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggleField(field.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                          {field.type}
                        </span>
                        {field.questionType && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {field.questionType}
                          </span>
                        )}
                        {field.answer && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                            ✓ Generated
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-800">{field.question}</p>
                    </div>
                    <div className="text-gray-400 ml-2">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {field.answer ? (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Generated Answer:
                          </label>
                          <textarea
                            value={field.answer}
                            onChange={(e) => {
                              setFieldsWithAnswers(prev =>
                                prev.map(f =>
                                  f.id === field.id ? { ...f, answer: e.target.value } : f
                                )
                              );
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGenerateAnswer(field)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                          >
                            Regenerate
                          </button>
                          <button
                            onClick={() => handleFillField(field)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
                          >
                            Fill Field
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => handleGenerateAnswer(field)}
                        disabled={field.isGenerating}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {field.isGenerating ? 'Generating...' : 'Generate Answer'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default QuestionList;

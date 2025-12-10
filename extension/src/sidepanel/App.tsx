import { useState, useEffect } from 'react';
import { ParsedCV, StylePreferences, FormField } from '../types';
import { getCVData, getStylePreferences } from './storage';
import Onboarding from './components/Onboarding';
import Settings from './components/Settings';
import QuestionList from './components/QuestionList';

function App() {
  const [cvData, setCvData] = useState<ParsedCV | null>(null);
  const [stylePreferences, setStylePreferences] = useState<StylePreferences>({
    voice_tone: 'confident',
    length: 'medium',
    personality: 'balanced',
  });
  const [fields, setFields] = useState<FormField[]>([]);
  const [currentView, setCurrentView] = useState<'onboarding' | 'questions' | 'settings'>('onboarding');
  const [isScanning, setIsScanning] = useState(false);

  // Load CV data and preferences on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const cv = await getCVData();
    const prefs = await getStylePreferences();

    setCvData(cv);
    setStylePreferences(prefs);

    if (cv) {
      setCurrentView('questions');
    }
  }

  async function scanFormFields() {
    setIsScanning(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        alert('No active tab found');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_FIELDS' });

      if (response.success) {
        setFields(response.fields);
        if (response.fields.length === 0) {
          alert('No form fields detected on this page. Make sure you are on a job application form.');
        }
      }
    } catch (error) {
      console.error('Error scanning fields:', error);
      alert('Failed to scan form fields. Make sure you are on a webpage with a form.');
    } finally {
      setIsScanning(false);
    }
  }

  const handleCVUploaded = (cv: ParsedCV) => {
    setCvData(cv);
    setCurrentView('questions');
  };

  const handleStyleChanged = (style: StylePreferences) => {
    setStylePreferences(style);
  };

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">SubmitMe</h1>
        <p className="text-sm text-blue-100">AI Job Application Autofill</p>
      </div>

      {/* Navigation */}
      {cvData && (
        <div className="flex border-b bg-white">
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              currentView === 'questions'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setCurrentView('questions')}
          >
            Questions
          </button>
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              currentView === 'settings'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setCurrentView('settings')}
          >
            Settings
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {currentView === 'onboarding' && (
          <Onboarding onCVUploaded={handleCVUploaded} />
        )}

        {currentView === 'questions' && cvData && (
          <QuestionList
            cvData={cvData}
            stylePreferences={stylePreferences}
            fields={fields}
            onScanFields={scanFormFields}
            isScanning={isScanning}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            cvData={cvData}
            stylePreferences={stylePreferences}
            onStyleChanged={handleStyleChanged}
            onCVReuploaded={handleCVUploaded}
          />
        )}
      </div>
    </div>
  );
}

export default App;

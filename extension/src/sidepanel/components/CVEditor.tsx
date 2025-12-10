import { useState } from 'react';
import { ParsedCV } from '../../types';
import { saveCVData } from '../storage';

interface CVEditorProps {
  cvData: ParsedCV;
  onCVUpdated: (cv: ParsedCV) => void;
}

function CVEditor({ cvData, onCVUpdated }: CVEditorProps) {
  const [editedCV, setEditedCV] = useState<ParsedCV>(cvData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCVData(editedCV);
      onCVUpdated(editedCV);
      alert('CV data saved successfully!');
    } catch (error) {
      alert('Failed to save CV data');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          value={editedCV.name}
          onChange={(e) => setEditedCV({ ...editedCV, name: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={editedCV.email || ''}
            onChange={(e) => setEditedCV({ ...editedCV, email: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={editedCV.phone || ''}
            onChange={(e) => setEditedCV({ ...editedCV, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
        <input
          type="url"
          value={editedCV.linkedin_url || ''}
          onChange={(e) => setEditedCV({ ...editedCV, linkedin_url: e.target.value })}
          placeholder="https://linkedin.com/in/yourprofile"
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
        <textarea
          value={editedCV.summary}
          onChange={(e) => setEditedCV({ ...editedCV, summary: e.target.value })}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Skills (comma-separated)
        </label>
        <textarea
          value={editedCV.skills.join(', ')}
          onChange={(e) =>
            setEditedCV({
              ...editedCV,
              skills: e.target.value.split(',').map((s) => s.trim()).filter((s) => s),
            })
          }
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="Python, JavaScript, AWS, etc."
        />
      </div>

      {/* Experience Summary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Work Experience</label>
        <div className="space-y-2">
          {editedCV.experience.map((exp, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200">
              <p className="font-medium">{exp.role} at {exp.company}</p>
              {exp.duration && <p className="text-sm text-gray-600">{exp.duration}</p>}
              <p className="text-sm text-gray-500 mt-1">
                {exp.achievements.length} achievement{exp.achievements.length !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          To edit experiences in detail, re-upload your CV
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

export default CVEditor;

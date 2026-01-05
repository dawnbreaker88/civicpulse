import React, { FC, useState, useRef, useEffect, useCallback } from 'react';
import type { Issue, Priority, Attachment, AiImageAnalysis } from '../lib/types';
import { DEPARTMENTS, HYDERABAD_CENTER } from '../lib/constants';
import { analyzeIssueImage, findSimilarIssues, getSmartSuggestion, SmartSuggestion } from '../lib/gemini';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

// Map click handler component
const MapClickHandler: FC<{ setPosition: (pos: [number, number]) => void }> = ({ setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const ReportModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddIssue: (issue: Partial<Issue>) => void;
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}> = ({ isOpen, onClose, onAddIssue, issues, onSelectIssue }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiImageAnalysis | null>(null);
  const [isAborted, setIsAborted] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState<Issue[] | null>(null);
  const [priority, setPriority] = useState<Priority>('medium');

  // NEW: Smart suggestion state
  const [smartSuggestion, setSmartSuggestion] = useState<SmartSuggestion | null>(null);
  const [isGettingSuggestion, setIsGettingSuggestion] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const debouncedDescription = useDebounce(description, 2000);

  // NEW: Get smart suggestions as user types
  useEffect(() => {
    if (debouncedDescription.length >= 20 && !title && !aiSuggestions) {
      setIsGettingSuggestion(true);
      getSmartSuggestion(debouncedDescription)
        .then(suggestion => {
          setSmartSuggestion(suggestion);
        })
        .finally(() => setIsGettingSuggestion(false));
    }
  }, [debouncedDescription, title, aiSuggestions]);

  // Duplicate check effect
  useEffect(() => {
    if (title.length > 10 && description.length > 20 && position) {
      const handler = setTimeout(async () => {
        setIsCheckingDuplicates(true);
        try {
          const similar = await findSimilarIssues(title, description, { lat: position[0], lng: position[1] }, issues);
          setPotentialDuplicates(similar);
        } catch (error) {
          console.error("Duplicate check failed:", error);
        } finally {
          setIsCheckingDuplicates(false);
        }
      }, 1500);
      return () => clearTimeout(handler);
    }
  }, [title, description, position, issues]);

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setAttachment(null);
    setPosition(null);
    setIsSubmitting(false);
    setIsAnalyzingImage(false);
    setAiSuggestions(null);
    setIsCheckingDuplicates(false);
    setPotentialDuplicates(null);
    setSmartSuggestion(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAnalyzingImage(true);
      setAiSuggestions(null);
      setSmartSuggestion(null);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        setAttachment({ type: 'image', data: reader.result as string });

        try {
          const suggestions = await analyzeIssueImage(base64String, file.type);
          if (suggestions) {
            setAiSuggestions(suggestions);
            setTitle(suggestions.suggested_title);
            setDescription(suggestions.suggested_description);
            // Auto-set priority from AI analysis (user can change it)
            if (suggestions.suggested_priority) {
              setPriority(suggestions.suggested_priority);
            }
          }
        } catch (error) {
          console.error("Image analysis failed:", error);
        } finally {
          setIsAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const applySmartSuggestion = () => {
    if (smartSuggestion) {
      setTitle(smartSuggestion.suggested_title);
      setSmartSuggestion(null);
    }
  };

  const applyAiSuggestions = () => {
    if (aiSuggestions) {
      setTitle(aiSuggestions.suggested_title);
      setDescription(aiSuggestions.suggested_description);
    }
  };

  const handleViewDuplicate = (issue: Issue) => {
    onSelectIssue(issue);
    handleClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!position) {
      alert('Please pin the issue location on the map.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const issueData: Partial<Issue> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: { lat: position[0], lng: position[1], neighborhood: formData.get('location') as string },
      priority: formData.get('priority') as Priority,
      attachments: attachment ? [attachment] : [],
    };

    try {
      await onAddIssue(issueData);
      handleClose();
    } catch (error) {
      console.error("Submission failed:", error);
      alert(error instanceof Error ? error.message : 'Failed to submit issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Severity color helper
  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'var(--success)',
      medium: 'var(--warning)',
      high: 'var(--error)',
      critical: 'var(--severity-critical)',
    };
    return colors[severity] || 'var(--text-secondary)';
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content report-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚨 Report a New Issue</h2>
          <button className="modal-close-button" onClick={handleClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} ref={formRef}>
          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="attachment">📷 Upload Photo Evidence</label>
            <input
              type="file"
              id="attachment"
              name="attachment"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={isSubmitting || isAnalyzingImage}
            />
            <small>AI will analyze your photo and auto-fill the form!</small>
          </div>

          {/* AI Image Analysis Box */}
          {(isAnalyzingImage || aiSuggestions) && (
            <div className="ai-suggestion-box ai-image-analysis">
              <div className="ai-suggestion-header">
                <span className="ai-header-text">
                  {isAnalyzingImage && <><div className="spinner"></div> 🤖 Analyzing your image...</>}
                  {aiSuggestions && '✅ AI Analysis Complete!'}
                </span>
                {aiSuggestions && (
                  <button type="button" className="button button-primary button-sm" onClick={applyAiSuggestions}>
                    Apply All
                  </button>
                )}
              </div>
              {aiSuggestions && (
                <div className="ai-suggestion-content">
                  <div className="ai-field"><strong>Title:</strong> {aiSuggestions.suggested_title}</div>
                  <div className="ai-field"><strong>Description:</strong> {aiSuggestions.suggested_description}</div>
                  <div className="ai-field"><strong>Department:</strong> <span className="department-tag">{aiSuggestions.suggested_department}</span></div>
                </div>
              )}
            </div>
          )}

          {/* Description Field - First to enable smart suggestions */}
          <div className="form-group">
            <label htmlFor="description">📝 Description</label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue in detail. Be specific about location, size, and any hazards..."
              required
              disabled={isSubmitting}
              rows={4}
            />
            <small>💡 Start typing and AI will suggest a title for you!</small>
          </div>

          {/* Smart Suggestion Box - Shows while typing */}
          {(isGettingSuggestion || smartSuggestion) && !aiSuggestions && (
            <div className="ai-suggestion-box ai-smart-suggestion">
              <div className="ai-suggestion-header">
                <span className="ai-header-text">
                  {isGettingSuggestion && <><div className="spinner"></div> 💭 AI is thinking...</>}
                  {smartSuggestion && '💡 AI Suggestion'}
                </span>
              </div>
              {smartSuggestion && (
                <div className="ai-suggestion-content">
                  <div className="ai-field">
                    <strong>Suggested Title:</strong>
                    <span className="suggested-title">{smartSuggestion.suggested_title}</span>
                  </div>
                  <div className="ai-meta">
                    <span className="ai-department">🏢 {smartSuggestion.suggested_department.split(' – ')[0]}</span>
                    <span className="ai-severity" style={{ color: getSeverityColor(smartSuggestion.estimated_severity) }}>
                      ⚠️ {smartSuggestion.estimated_severity} severity ({smartSuggestion.severity_score})
                    </span>
                  </div>
                  {smartSuggestion.tips.length > 0 && (
                    <div className="ai-tips">
                      <strong>Tips:</strong>
                      <ul>{smartSuggestion.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                    </div>
                  )}
                  <div className="ai-actions">
                    <button type="button" className="button button-primary button-sm" onClick={applySmartSuggestion}>
                      Use This Title
                    </button>
                    <button type="button" className="button button-ghost button-sm" onClick={() => setSmartSuggestion(null)}>
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Title Field */}
          <div className="form-group">
            <label htmlFor="title">🏷️ Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief title for the issue"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Duplicate Warning */}
          {isCheckingDuplicates && <div className="suggestion-box">🔍 Checking for similar issues...</div>}
          {potentialDuplicates && potentialDuplicates.length > 0 && (
            <div className="duplicate-alert-box">
              <h4>⚠️ Similar Issues Found!</h4>
              <p>We found existing reports. Consider supporting them instead of creating a duplicate.</p>
              <div className="duplicate-list">
                {potentialDuplicates.map(issue => (
                  <div key={issue.id} className="duplicate-item">
                    <span>{issue.title}</span>
                    <button type="button" className="button button-secondary button-sm" onClick={() => handleViewDuplicate(issue)}>
                      View & Support
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority & Location */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">⚡ Priority {aiSuggestions?.suggested_priority && <span className="ai-auto-label">AI suggested</span>}</label>
              <select id="priority" name="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} required disabled={isSubmitting}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="location">📍 Neighborhood</label>
              <input type="text" id="location" name="location" placeholder="e.g., Gachibowli" required disabled={isSubmitting} />
            </div>
          </div>

          {/* Map */}
          <div className="form-group">
            <label>📌 Pin Location on Map <span style={{ color: 'var(--error)' }}>*</span></label>
            <div className="map-wrapper">
              <MapContainer center={HYDERABAD_CENTER} zoom={12} style={{ height: '250px', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler setPosition={setPosition} />
                {position && <Marker position={position} />}
              </MapContainer>
            </div>
            {!position && <small>Click on the map to set the exact issue location.</small>}
            {position && <small style={{ color: 'var(--success)' }}>✅ Location pinned: {position[0].toFixed(4)}, {position[1].toFixed(4)}</small>}
          </div>

          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting || isAnalyzingImage || isCheckingDuplicates}
            >
              {isSubmitting ? '⏳ Submitting...' : '📤 Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
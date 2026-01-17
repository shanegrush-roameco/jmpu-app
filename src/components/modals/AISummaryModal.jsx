// src/components/modals/AISummaryModal.jsx
// Modal for generating and displaying AI-powered project summaries
// Sprint 10: AI Integration
// Sprint 10.1: Footer layout cleanup - CTAs fill row, subtle AI badge
// ============================================================================

import { useState, useEffect } from 'react';
import { 
  Close, 
  Copy, 
  Checkmark, 
  Analytics,
  TaskComplete,
  Finance,
  License,
  Calendar,
  Renew
} from '@carbon/icons-react';
import { useAISummary } from '../../hooks/useAISummary';

// ============================================================================
// Configuration - Set your AI provider here
// ============================================================================

// Options: 'claude', 'openai', 'anthropic', or null to hide badge
const AI_PROVIDER = 'claude';

const providerLabels = {
  claude: 'Claude',
  anthropic: 'Claude',
  openai: 'OpenAI',
  gpt: 'OpenAI',
};

// ============================================================================
// Markdown Renderer (simple)
// ============================================================================

function SimpleMarkdown({ content }) {
  if (!content) return null;
  
  // Split into lines and process
  const lines = content.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null;
  
  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ul') {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 text-gray-700">
            {currentList.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1 mb-4 text-gray-700">
            {currentList.map((item, i) => <li key={i}>{item}</li>)}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    // Headers
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-lg font-semibold text-[#1D1D1F] mt-5 mb-2">
          {line.replace('## ', '').replace(/\*\*/g, '')}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-base font-semibold text-[#1D1D1F] mt-4 mb-2">
          {line.replace('### ', '').replace(/\*\*/g, '')}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={index} className="text-xl font-bold text-[#1D1D1F] mt-4 mb-3">
          {line.replace('# ', '').replace(/\*\*/g, '')}
        </h1>
      );
    }
    // Bold headers like **Executive Overview**
    else if (line.match(/^\*\*[^*]+\*\*$/)) {
      flushList();
      elements.push(
        <h3 key={index} className="text-base font-semibold text-[#1D1D1F] mt-4 mb-2">
          {line.replace(/\*\*/g, '')}
        </h3>
      );
    }
    // Numbered list items (1. 2. 3.)
    else if (line.match(/^\d+\.\s+\*\*/)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      // Extract content after number and process bold
      const content = line.replace(/^\d+\.\s+/, '').replace(/\*\*([^*]+)\*\*/g, '$1');
      currentList.push(<span className="font-medium">{content}</span>);
    }
    else if (line.match(/^\d+\.\s+/)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      currentList.push(line.replace(/^\d+\.\s+/, ''));
    }
    // Bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      const content = line.replace(/^[-*]\s+/, '').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      currentList.push(<span dangerouslySetInnerHTML={{ __html: content }} />);
    }
    // Empty line
    else if (line.trim() === '') {
      flushList();
    }
    // Regular paragraph
    else if (line.trim()) {
      flushList();
      // Handle inline bold
      const processed = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      elements.push(
        <p key={index} className="text-gray-700 mb-3 leading-relaxed" style={{ fontSize: '15px' }}>
          <span dangerouslySetInnerHTML={{ __html: processed }} />
        </p>
      );
    }
  });
  
  flushList();
  
  return <div className="prose-sm">{elements}</div>;
}

// ============================================================================
// AI Provider Badge (subtle)
// ============================================================================

function AIProviderBadge({ provider }) {
  const label = providerLabels[provider?.toLowerCase()] || provider;
  
  if (!provider || !label) return null;
  
  return (
    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-4">
      <svg 
        className="w-3 h-3" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>Powered by {label}</span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AISummaryModal({ 
  isOpen, 
  onClose, 
  project,
  tasks = [],
  aiProvider = AI_PROVIDER, // Can override per-instance if needed
}) {
  const { generateSummary, clearSummary, copyToClipboard, isGenerating, summary, error } = useAISummary();
  
  // Options state
  const [options, setOptions] = useState({
    includeTasks: true,
    includeFinancials: true,
    includePermits: true,
    includeTimeline: true,
  });
  
  // Copy feedback
  const [copied, setCopied] = useState(false);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      clearSummary();
      setCopied(false);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    await generateSummary(project, tasks, options);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    clearSummary();
  };

  const toggleOption = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Analytics size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1D1D1F]">AI Summary</h2>
              <p className="text-sm text-gray-500">
                {project?.project_number || project?.id || 'Project'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Close size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!summary && !isGenerating && (
            <>
              {/* Options Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Include in summary:
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <OptionToggle
                    icon={<TaskComplete size={18} />}
                    label="Tasks & Progress"
                    checked={options.includeTasks}
                    onChange={() => toggleOption('includeTasks')}
                  />
                  <OptionToggle
                    icon={<Finance size={18} />}
                    label="Financial Status"
                    checked={options.includeFinancials}
                    onChange={() => toggleOption('includeFinancials')}
                  />
                  <OptionToggle
                    icon={<License size={18} />}
                    label="Permits"
                    checked={options.includePermits}
                    onChange={() => toggleOption('includePermits')}
                  />
                  <OptionToggle
                    icon={<Calendar size={18} />}
                    label="Timeline"
                    checked={options.includeTimeline}
                    onChange={() => toggleOption('includeTimeline')}
                  />
                </div>
              </div>

              {/* Project Preview */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Project Details</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-gray-500">Name:</div>
                  <div className="text-gray-900 font-medium">{project?.name || 'N/A'}</div>
                  <div className="text-gray-500">Status:</div>
                  <div className="text-gray-900">{project?.status || 'N/A'}</div>
                  <div className="text-gray-500">Phase:</div>
                  <div className="text-gray-900">{project?.phase || 'N/A'}</div>
                  {project?.budget && (
                    <>
                      <div className="text-gray-500">Budget:</div>
                      <div className="text-gray-900">${project.budget.toLocaleString()}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              {/* AI Provider Badge - shown before generation */}
              <AIProviderBadge provider={aiProvider} />
            </>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Generating summary...</p>
              <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>
            </div>
          )}

          {/* Summary Display */}
          {summary && !isGenerating && (
            <div>
              {/* Generated timestamp */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-400">
                  Generated {new Date(summary.generatedAt).toLocaleString()}
                </p>
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  <Renew size={16} />
                  Regenerate
                </button>
              </div>
              
              {/* Summary Content */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <SimpleMarkdown content={summary.text} />
              </div>
              
              {/* AI Provider Badge - shown after generation */}
              <div className="mt-4">
                <AIProviderBadge provider={aiProvider} />
              </div>
            </div>
          )}
        </div>

        {/* Footer - Clean CTA layout */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          {summary ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-2.5 text-sm font-medium text-[#1D1D1F] bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 rounded-xl transition-colors"
              >
                {copied ? <Checkmark size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-2.5 text-sm font-medium text-[#1D1D1F] bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Analytics size={16} />
                Generate Summary
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function OptionToggle({ icon, label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        checked 
          ? 'border-[#1D1D1F] bg-gray-50 text-[#1D1D1F]' 
          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
      }`}
    >
      <div className={`flex-shrink-0 ${checked ? 'text-[#1D1D1F]' : 'text-gray-400'}`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
      <div className="ml-auto">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          checked 
            ? 'border-[#1D1D1F] bg-[#1D1D1F]' 
            : 'border-gray-300 bg-white'
        }`}>
          {checked && <Checkmark size={14} className="text-white" />}
        </div>
      </div>
    </button>
  );
}

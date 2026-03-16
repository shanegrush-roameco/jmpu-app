// src/components/CompanyCombobox.jsx
// Reusable combobox for selecting multiple companies
// Used in CreateProjectModal and EditProjectModal
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { Close } from '@carbon/icons-react';

export default function CompanyCombobox({ companies, selected, onChange }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) &&
    !selected.find(s => s.id === c.id)
  );

  const addCompany = (company) => {
    onChange([...selected, company]);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeCompany = (id) => {
    onChange(selected.filter(c => c.id !== id));
  };

  return (
    <div ref={containerRef} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(c => (
            <span key={c.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1D1D1F] text-white text-xs font-medium rounded-full">
              {c.name}
              <button type="button" onClick={() => removeCompany(c.id)} className="hover:opacity-70 transition-opacity ml-0.5">
                <Close size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder={selected.length === 0 ? 'Search companies...' : 'Add another...'}
        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]"
        style={{ fontSize: '16px', letterSpacing: '0.16px' }}
      />

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => addCompany(c)}
              className="w-full text-left px-4 py-2.5 text-sm text-[#1D1D1F] hover:bg-gray-50 transition-colors"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length > 0 && filtered.length === 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-2.5 text-sm text-gray-400">
          No companies found
        </div>
      )}
    </div>
  );
}
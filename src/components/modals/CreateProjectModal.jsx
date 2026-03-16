// src/components/modals/EditProjectModal.jsx
// Modal for editing an existing project
// Pre-populates from live project record, adds Status field and company assignment
// Mirrors CreateProjectModal UX exactly
// ============================================================================

import { useState, useEffect } from 'react';
import { Close, ChevronDown } from '@carbon/icons-react';
import { updateProject } from '../../hooks/useProjects';
import { useCompanies, getProjectCompanies, setProjectCompanies } from '../../hooks/useCompanies';
import CompanyCombobox from '../CompanyCombobox.jsx';

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

const PROJECT_STATUSES = [
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Complete' },
  { value: 'cancelled', label: 'Cancelled' },
];

const inputBase  = 'w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]';
const inputError = 'w-full px-4 py-2 rounded-xl border border-red-300 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]';
const inputStyle = { fontSize: '16px', letterSpacing: '0.16px' };
const labelBase  = 'block text-sm font-medium text-gray-700 mb-1.5';

function ChevronIcon() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
      <ChevronDown size={16} className="text-gray-500" />
    </div>
  );
}

export default function EditProjectModal({ isOpen, onClose, onSuccess, project }) {
  const { companies } = useCompanies();
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  const [formData, setFormData] = useState({
    name:          '',
    asset_number:  '',
    address_line1: '',
    city:          '',
    state:         'MI',
    zip_code:      '',
    start_date:    '',
    status:        'active',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate form and load existing company assignments
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        name:          project.name          || '',
        asset_number:  project.asset_number  || '',
        address_line1: project.address_line1 || '',
        city:          project.city          || '',
        state:         project.state         || 'MI',
        zip_code:      project.zip_code      || '',
        start_date:    project.start_date ? project.start_date.slice(0, 10) : '',
        status:        project.status        || 'active',
      });
      setErrors({});

      // Load existing company assignments
      getProjectCompanies(project.id).then(existing => {
        setSelectedCompanies(existing || []);
      });
    }
  }, [isOpen, project]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim())          newErrors.name          = 'Customer name is required';
    if (!formData.address_line1.trim()) newErrors.address_line1 = 'Address is required';
    if (!formData.city.trim())          newErrors.city          = 'City is required';
    if (!formData.zip_code.trim()) {
      newErrors.zip_code = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Invalid ZIP code';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const updates = {
        name:          formData.name.trim(),
        asset_number:  formData.asset_number.trim() || null,
        address_line1: formData.address_line1.trim(),
        city:          formData.city.trim(),
        state:         formData.state,
        zip_code:      formData.zip_code.trim(),
        start_date:    formData.start_date || null,
        status:        formData.status,
      };
      const updated = await updateProject(project.id, updates);

      // Sync company assignments (delete + reinsert via hook)
      await setProjectCompanies(project.id, selectedCompanies.map(c => c.id));

      onSuccess?.(updated);
      onClose();
    } catch (error) {
      console.error('Error updating project:', error);
      setErrors({ submit: error.message || 'Failed to save changes' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">Edit Project</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Close size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {errors.submit}
              </div>
            )}

            <div>
              <label className={labelBase}>Customer <span style={{ color: '#E8500A' }}>*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="Name" autoFocus className={errors.name ? inputError : inputBase} style={inputStyle} />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className={labelBase}>Asset #</label>
              <input type="text" name="asset_number" value={formData.asset_number} onChange={handleChange}
                placeholder="XXXXXXXXXX" className={inputBase} style={inputStyle} />
            </div>

            <div>
              <label className={labelBase}>Companies</label>
              <CompanyCombobox
                companies={companies}
                selected={selectedCompanies}
                onChange={setSelectedCompanies}
              />
            </div>

            <div>
              <label className={labelBase}>Address <span style={{ color: '#E8500A' }}>*</span></label>
              <input type="text" name="address_line1" value={formData.address_line1} onChange={handleChange}
                placeholder="999 Road Rd." className={errors.address_line1 ? inputError : inputBase} style={inputStyle} />
              {errors.address_line1 && <p className="mt-1 text-sm text-red-500">{errors.address_line1}</p>}
            </div>

            <div>
              <label className={labelBase}>City <span style={{ color: '#E8500A' }}>*</span></label>
              <input type="text" name="city" value={formData.city} onChange={handleChange}
                placeholder="City Name" className={errors.city ? inputError : inputBase} style={inputStyle} />
              {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
            </div>

            <div>
              <label className={labelBase}>State</label>
              <div className="relative">
                <select name="state" value={formData.state} onChange={handleChange}
                  className={`${inputBase} appearance-none pr-10 bg-white`} style={inputStyle}>
                  {US_STATES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronIcon />
              </div>
            </div>

            <div>
              <label className={labelBase}>ZIP <span style={{ color: '#E8500A' }}>*</span></label>
              <input type="text" name="zip_code" value={formData.zip_code} onChange={handleChange}
                placeholder="99999" className={errors.zip_code ? inputError : inputBase} style={inputStyle} />
              {errors.zip_code && <p className="mt-1 text-sm text-red-500">{errors.zip_code}</p>}
            </div>

            <div>
              <label className={labelBase}>Start Date</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange}
                className={inputBase} style={inputStyle} />
            </div>

            <div>
              <label className={labelBase}>Status</label>
              <div className="relative">
                <select name="status" value={formData.status} onChange={handleChange}
                  className={`${inputBase} appearance-none pr-10 bg-white`} style={inputStyle}>
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronIcon />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors"
              style={{ color: '#111111', border: '1px solid #111111', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#111111'; e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#111111'; }}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
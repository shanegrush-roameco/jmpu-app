// src/components/modals/CreateProjectModal.jsx
// Modal for creating new projects
// ============================================================================

import { useState } from 'react';
import { Close, Add, Calendar, Currency } from '@carbon/icons-react';
import { createProject } from '../../hooks/useProjects';
// import { useProjectManagers } from '../../hooks/useProfiles';

// ============================================================================
// Project Type Options
// ============================================================================

const PROJECT_TYPES = [
  { value: 'renovation', label: 'Renovation' },
  { value: 'insurance_repair', label: 'Insurance Repair' },
  { value: 'fire_rehabilitation', label: 'Fire Rehabilitation' },
  { value: 'water_damage', label: 'Water Damage' },
  { value: 'mold_remediation', label: 'Mold Remediation' },
  { value: 'general_construction', label: 'General Construction' },
  { value: 'demolition', label: 'Demolition' },
  { value: 'other', label: 'Other' },
];

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

// ============================================================================
// Component
// ============================================================================

export default function CreateProjectModal({ isOpen, onClose, onSuccess }) {
  const projectManagers = []; // Temporarily disabled: const { profiles: projectManagers } = useProjectManagers();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: 'general_construction',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'MI',
    zip_code: '',
    start_date: '',
    estimated_end_date: '',
    budget_total: '',
    project_manager_id: '',
    claim_number: '',
    insurance_company: '',
    adjuster_name: '',
    adjuster_phone: '',
    adjuster_email: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInsuranceFields, setShowInsuranceFields] = useState(false);

  const handleTypeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, project_type: value }));
    setShowInsuranceFields(['insurance_repair', 'fire_rehabilitation', 'water_damage'].includes(value));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.address_line1.trim()) newErrors.address_line1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.zip_code.trim()) {
      newErrors.zip_code = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Invalid ZIP code format';
    }
    if (formData.budget_total && isNaN(parseFloat(formData.budget_total))) {
      newErrors.budget_total = 'Budget must be a number';
    }
    if (formData.start_date && formData.estimated_end_date) {
      if (new Date(formData.start_date) > new Date(formData.estimated_end_date)) {
        newErrors.estimated_end_date = 'End date must be after start date';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    
    try {
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        project_type: formData.project_type,
        address_line1: formData.address_line1.trim(),
        address_line2: formData.address_line2.trim() || null,
        city: formData.city.trim(),
        state: formData.state,
        zip_code: formData.zip_code.trim(),
        start_date: formData.start_date || null,
        estimated_end_date: formData.estimated_end_date || null,
        budget_total: formData.budget_total ? parseFloat(formData.budget_total) : 0,
        project_manager_id: formData.project_manager_id || null,
        status: 'planning',
      };

      if (showInsuranceFields) {
        projectData.claim_number = formData.claim_number.trim() || null;
        projectData.insurance_company = formData.insurance_company.trim() || null;
        projectData.adjuster_name = formData.adjuster_name.trim() || null;
        projectData.adjuster_phone = formData.adjuster_phone.trim() || null;
        projectData.adjuster_email = formData.adjuster_email.trim() || null;
      }

      const newProject = await createProject(projectData);
      onSuccess?.(newProject);
      onClose();
      
      setFormData({
        name: '', description: '', project_type: 'general_construction',
        address_line1: '', address_line2: '', city: '', state: 'MI', zip_code: '',
        start_date: '', estimated_end_date: '', budget_total: '', project_manager_id: '',
        claim_number: '', insurance_company: '', adjuster_name: '', adjuster_phone: '', adjuster_email: '',
      });
    } catch (error) {
      console.error('Error creating project:', error);
      setErrors({ submit: error.message || 'Failed to create project' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
           style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">Create New Project</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Close size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {errors.submit}
              </div>
            )}

            {/* Project Name & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="e.g., 123 Main St Renovation"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]`}
                  style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Type</label>
                <select name="project_type" value={formData.project_type} onChange={handleTypeChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                  style={{ fontSize: '16px', letterSpacing: '0.16px' }}>
                  {PROJECT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                placeholder="Brief description of the project scope..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] resize-none"
                style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
            </div>

            {/* Address Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Property Address</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address *</label>
                <input type="text" name="address_line1" value={formData.address_line1} onChange={handleChange}
                  placeholder="123 Main Street"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.address_line1 ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]`}
                  style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                {errors.address_line1 && <p className="mt-1 text-sm text-red-500">{errors.address_line1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 2</label>
                <input type="text" name="address_line2" value={formData.address_line2} onChange={handleChange}
                  placeholder="Suite, Unit, Building (optional)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]"
                  style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange}
                    placeholder="Auburn Hills"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]`}
                    style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                  {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                  <select name="state" value={formData.state} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                    style={{ fontSize: '16px', letterSpacing: '0.16px' }}>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP Code *</label>
                  <input type="text" name="zip_code" value={formData.zip_code} onChange={handleChange}
                    placeholder="48326"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.zip_code ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]`}
                    style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                  {errors.zip_code && <p className="mt-1 text-sm text-red-500">{errors.zip_code}</p>}
                </div>
              </div>
            </div>

            {/* Timeline & Budget */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Timeline & Budget</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5"><Calendar size={14} />Start Date</span>
                  </label>
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]"
                    style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5"><Calendar size={14} />Est. End Date</span>
                  </label>
                  <input type="date" name="estimated_end_date" value={formData.estimated_end_date} onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.estimated_end_date ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]`}
                    style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                  {errors.estimated_end_date && <p className="mt-1 text-sm text-red-500">{errors.estimated_end_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5"><Currency size={14} />Total Budget</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input type="text" name="budget_total" value={formData.budget_total} onChange={handleChange}
                      placeholder="0.00"
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border ${errors.budget_total ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]`}
                      style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                  </div>
                  {errors.budget_total && <p className="mt-1 text-sm text-red-500">{errors.budget_total}</p>}
                </div>
              </div>
            </div>

            {/* Project Manager */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Manager</label>
              <select name="project_manager_id" value={formData.project_manager_id} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                style={{ fontSize: '16px', letterSpacing: '0.16px' }}>
                <option value="">Select Project Manager</option>
                {projectManagers?.map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.full_name} {pm.role === 'admin' ? '(Admin)' : ''}</option>
                ))}
              </select>
            </div>

            {/* Insurance Fields (Conditional) */}
            {showInsuranceFields && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-900">Insurance Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Claim Number</label>
                    <input type="text" name="claim_number" value={formData.claim_number} onChange={handleChange}
                      placeholder="CLM-12345"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                      style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Insurance Company</label>
                    <input type="text" name="insurance_company" value={formData.insurance_company} onChange={handleChange}
                      placeholder="State Farm"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                      style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Adjuster Name</label>
                    <input type="text" name="adjuster_name" value={formData.adjuster_name} onChange={handleChange}
                      placeholder="John Smith"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                      style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Adjuster Phone</label>
                    <input type="tel" name="adjuster_phone" value={formData.adjuster_phone} onChange={handleChange}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                      style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Adjuster Email</label>
                    <input type="email" name="adjuster_email" value={formData.adjuster_email} onChange={handleChange}
                      placeholder="adjuster@insurance.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                      style={{ fontSize: '16px', letterSpacing: '0.16px' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Add size={16} />
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

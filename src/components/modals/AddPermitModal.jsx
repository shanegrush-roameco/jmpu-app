// src/components/modals/AddPermitModal.jsx
// Sprint 17: AI-powered permit extraction from uploaded documents
// Upload a photo or PDF -> Claude extracts fields -> employee reviews -> saves to DB + Storage

import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Upload,
  Close,
  Document,
  CheckmarkFilled,
  WarningFilled,
  ChevronDown,
} from '@carbon/icons-react'

const SUPABASE_URL = 'https://mbwiaojxmaxsmoykdnww.supabase.co'
const BUCKET = 'project-files'

const STATUS_OPTIONS = [
  { value: 'not_applied', label: 'Not Applied' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'expired', label: 'Expired' },
]

const EMPTY_FORM = {
  permit_type: '',
  permit_number: '',
  status: 'pending',
  application_date: '',
  approval_date: '',
  expiration_date: '',
  issuing_authority: '',
  inspector_name: '',
  fee_amount: '',
}

export default function AddPermitModal({ isOpen, onClose, projectId, onSuccess }) {
  const [stage, setStage] = useState('upload') // upload | extracting | review | saving
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [extractError, setExtractError] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const fileInputRef = useRef(null)

  const resetModal = () => {
    setStage('upload')
    setFile(null)
    setExtractError(null)
    setForm({ ...EMPTY_FORM })
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const toBase64 = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(f)
    })

  const processFile = async (f) => {
    setFile(f)
    setStage('extracting')
    setExtractError(null)
    try {
      const base64 = await toBase64(f)
      const isPDF = f.type === 'application/pdf'

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: isPDF ? 'document' : 'image',
                  source: { type: 'base64', media_type: f.type, data: base64 },
                },
                {
                  type: 'text',
                  text: `Extract permit or violation details from this document. Return ONLY a valid JSON object with exactly these fields (use null for missing values, no extra text or markdown):
{
  "permit_type": "string (e.g. Electrical Permit, Plumbing Permit, Building Permit, Violation)",
  "permit_number": "string or null",
  "status": "one of: not_applied, pending, approved, denied, expired",
  "application_date": "YYYY-MM-DD or null",
  "approval_date": "YYYY-MM-DD or null",
  "expiration_date": "YYYY-MM-DD or null",
  "issuing_authority": "string or null",
  "inspector_name": "string or null",
  "fee_amount": "number or null"
}`,
                },
              ],
            },
          ],
        }),
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || '{}'
      const clean = text.replace(/```json|```/g, '').trim()
      const extracted = JSON.parse(clean)

      setForm({
        permit_type: extracted.permit_type || '',
        permit_number: extracted.permit_number || '',
        status: extracted.status || 'pending',
        application_date: extracted.application_date || '',
        approval_date: extracted.approval_date || '',
        expiration_date: extracted.expiration_date || '',
        issuing_authority: extracted.issuing_authority || '',
        inspector_name: extracted.inspector_name || '',
        fee_amount: extracted.fee_amount != null ? String(extracted.fee_amount) : '',
      })
      setStage('review')
    } catch (err) {
      console.error('Extraction error:', err)
      setExtractError('Could not extract details automatically. Fill in manually below.')
      setForm({ ...EMPTY_FORM })
      setStage('review')
    }
  }

  const handleFileSelect = (f) => {
    if (!f) return
    processFile(f)
  }

  const handleSave = async () => {
    if (!form.permit_type.trim()) return
    setStage('saving')
    try {
      let documentUrl = null

      if (file) {
        const filePath = `${projectId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, file, { contentType: file.type })
        if (uploadError) throw uploadError
        documentUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`
      }

      const { error: insertError } = await supabase.from('permits').insert({
        project_id: projectId,
        permit_type: form.permit_type.trim(),
        permit_number: form.permit_number.trim() || null,
        status: form.status,
        application_date: form.application_date || null,
        approval_date: form.approval_date || null,
        expiration_date: form.expiration_date || null,
        issuing_authority: form.issuing_authority.trim() || null,
        inspector_name: form.inspector_name.trim() || null,
        fee_amount: form.fee_amount ? parseFloat(form.fee_amount) : null,
        document_url: documentUrl,
      })
      if (insertError) throw insertError

      onSuccess?.()
      handleClose()
    } catch (err) {
      console.error('Save error:', err)
      setStage('review')
    }
  }

  if (!isOpen) return null

  const inputClass =
    'w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white'
  const inputStyle = { fontSize: '16px', letterSpacing: '0.16px' }
  const isBusy = stage === 'extracting' || stage === 'saving'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
            Add Permit / Violation
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isBusy}
          >
            <Close size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Upload Stage */}
          {stage === 'upload' && (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragOver ? 'border-[#1D1D1F] bg-gray-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]) }}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <p className="text-base font-semibold mb-2" style={{ color: '#1D1D1F' }}>
                Drag & Drop Files here
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Files Supported - .XLS, .PDF, .HEIC, .JPG, .PNG
              </p>
              <button
                className="px-6 py-2 bg-transparent text-sm font-medium transition-colors"
                style={{ color: '#111111', border: '1px solid #111111', borderRadius: '8px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#111111'
                  e.currentTarget.style.color = '#FFFFFF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#111111'
                }}
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              >
                Upload
              </button>
              <p className="text-xs text-gray-400 mt-5">Max File Size: 10MB</p>
              <p className="text-xs text-gray-400 mt-1">
                Claude will read and extract the permit details for you
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.heic"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>
          )}

          {/* Extracting Stage */}
          {stage === 'extracting' && (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
                Reading document...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Claude is extracting the permit details
              </p>
            </div>
          )}

          {/* Review Stage */}
          {(stage === 'review' || stage === 'saving') && (
            <div>
              {/* File pill */}
              <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-xl">
                <Document size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600 truncate flex-1">{file?.name}</span>
                {!extractError ? (
                  <CheckmarkFilled size={16} className="text-green-500 flex-shrink-0" />
                ) : (
                  <WarningFilled size={16} className="text-yellow-500 flex-shrink-0" />
                )}
              </div>

              {extractError && (
                <div className="flex items-start gap-2 mb-5 p-3 bg-yellow-50 rounded-xl">
                  <WarningFilled size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-yellow-700">{extractError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Type + Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Type <span style={{ color: '#E8500A' }}>*</span>
                    </label>
                    <input
                      className={inputClass}
                      style={inputStyle}
                      value={form.permit_type}
                      onChange={(e) => setForm((p) => ({ ...p, permit_type: e.target.value }))}
                      placeholder="e.g. Electrical Permit"
                      disabled={stage === 'saving'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Permit Number
                    </label>
                    <input
                      className={inputClass}
                      style={inputStyle}
                      value={form.permit_number}
                      onChange={(e) => setForm((p) => ({ ...p, permit_number: e.target.value }))}
                      placeholder="e.g. EP-2026-001"
                      disabled={stage === 'saving'}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <div className="relative">
                    <select
                      className={`${inputClass} appearance-none pr-10`}
                      style={inputStyle}
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                      disabled={stage === 'saving'}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <ChevronDown size={16} className="text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Applied Date
                    </label>
                    <input
                      type="date"
                      className={inputClass}
                      style={inputStyle}
                      value={form.application_date}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, application_date: e.target.value }))
                      }
                      disabled={stage === 'saving'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Approval Date
                    </label>
                    <input
                      type="date"
                      className={inputClass}
                      style={inputStyle}
                      value={form.approval_date}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, approval_date: e.target.value }))
                      }
                      disabled={stage === 'saving'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      className={inputClass}
                      style={inputStyle}
                      value={form.expiration_date}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, expiration_date: e.target.value }))
                      }
                      disabled={stage === 'saving'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Fee Amount
                    </label>
                    <input
                      type="number"
                      className={inputClass}
                      style={inputStyle}
                      value={form.fee_amount}
                      onChange={(e) => setForm((p) => ({ ...p, fee_amount: e.target.value }))}
                      placeholder="0.00"
                      disabled={stage === 'saving'}
                    />
                  </div>
                </div>

                {/* Issuing Authority */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Issuing Authority
                  </label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    value={form.issuing_authority}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, issuing_authority: e.target.value }))
                    }
                    placeholder="e.g. City of Detroit"
                    disabled={stage === 'saving'}
                  />
                </div>

                {/* Inspector */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Inspector Name
                  </label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    value={form.inspector_name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, inspector_name: e.target.value }))
                    }
                    placeholder="e.g. John Smith"
                    disabled={stage === 'saving'}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(stage === 'review' || stage === 'saving') && (
          <div className="flex gap-3 p-6 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={handleClose}
              disabled={stage === 'saving'}
              className="flex-1 px-6 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors disabled:opacity-40"
              style={{ color: '#111111', border: '1px solid #111111' }}
              onMouseEnter={(e) => {
                if (stage !== 'saving') {
                  e.currentTarget.style.backgroundColor = '#111111'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#111111'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={stage === 'saving' || !form.permit_type.trim()}
              className="flex-1 px-6 py-2.5 rounded-[8px] text-sm font-medium text-white transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#1D1D1F' }}
            >
              {stage === 'saving' ? 'Saving...' : 'Save Permit'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

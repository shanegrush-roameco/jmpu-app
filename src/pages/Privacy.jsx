// src/pages/Privacy.jsx
// Public privacy policy page -- no auth required
// Linked from Login and required for Intuit QB production credentials
// ============================================================================

export default function Privacy() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F4F4F4' }}>
      <div
        className="max-w-2xl mx-auto bg-white p-10"
        style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">JMPU Privacy Policy</h1>
          <p className="text-sm text-gray-400">Last updated: March 24, 2026</p>
        </div>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Overview</h2>
            <p>
              JMPU is a project management application operated by Roame Co. on behalf of Junk Monkey Pickup.
              It is an internal business tool used exclusively by authorized employees and contractors of
              Junk Monkey Pickup to manage renovation projects, tasks, and financial records.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Information We Collect</h2>
            <p>JMPU collects the following types of information:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Name and email address used to create your account</li>
              <li>Project data, task records, and notes entered into the system</li>
              <li>File uploads attached to projects and permits</li>
              <li>Financial data synced from QuickBooks Online</li>
              <li>Login activity and session information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">How We Use Your Information</h2>
            <p>
              All information collected within JMPU is used solely for the purpose of managing Junk Monkey
              Pickup's renovation projects and internal operations. We do not sell, rent, or share your
              information with third parties outside of the services required to operate the application
              (including Supabase for data storage and Intuit QuickBooks for financial data).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Data Storage</h2>
            <p>
              Application data is stored securely using Supabase, a managed database platform with
              row-level security policies controlling access based on your role. File uploads are stored
              in Supabase Storage. Financial data is accessed read-only via the QuickBooks Online API
              and is not stored permanently beyond what is needed for display purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Access and Roles</h2>
            <p>
              JMPU uses a role-based access system. Admin users have full access to all project data.
              Viewer users have access only to projects and tasks relevant to their work. System
              administrators at Junk Monkey Pickup and Roame Co. may access data for support and
              maintenance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Monitoring</h2>
            <p>
              By using JMPU, users acknowledge that activity within the system may be monitored,
              recorded, and reviewed by authorized personnel of Junk Monkey Pickup for lawful
              business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Contact</h2>
            <p>
              Questions about this policy can be directed to{' '}
              <a href="mailto:shane.grush@roame.co" className="underline text-gray-900">
                shane.grush@roame.co
              </a>.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100">
          <a href="/login" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  )
}

// src/pages/EULA.jsx
// Public end-user license agreement page -- no auth required
// Linked from Login and required for Intuit QB production credentials
// ============================================================================

export default function EULA() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F4F4F4' }}>
      <div
        className="max-w-2xl mx-auto bg-white p-10"
        style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">JMPU End-User License Agreement</h1>
          <p className="text-sm text-gray-400">Last updated: March 24, 2026</p>
        </div>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Agreement</h2>
            <p>
              This End-User License Agreement ("Agreement") is between Roame Co. ("Developer") and
              Junk Monkey Pickup and its authorized users ("User"). By accessing or using the JMPU
              Project Management Application ("Application"), you agree to the terms of this Agreement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">License Grant</h2>
            <p>
              Roame Co. grants Junk Monkey Pickup a non-exclusive, non-transferable license to use
              the Application for internal business purposes. This license is limited to authorized
              employees and contractors of Junk Monkey Pickup who have been granted access by a
              system administrator.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Authorized Use</h2>
            <p>The Application may be used solely for:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Managing renovation and construction projects</li>
              <li>Tracking tasks, phases, permits, and project timelines</li>
              <li>Viewing financial data synced from QuickBooks Online</li>
              <li>Internal team communication and file management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Restrictions</h2>
            <p>Users may not:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Share login credentials with unauthorized individuals</li>
              <li>Attempt to access data belonging to other users beyond their assigned role</li>
              <li>Use the Application for any purpose outside of Junk Monkey Pickup's business operations</li>
              <li>Reverse engineer, copy, or redistribute the Application or its codebase</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">QuickBooks Integration</h2>
            <p>
              The Application integrates with Intuit QuickBooks Online to display financial data.
              This integration is read-only. JMPU does not create, modify, or delete financial records
              in QuickBooks. All financial transactions remain under the control of Junk Monkey Pickup
              within QuickBooks Online.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Ownership</h2>
            <p>
              The Application, including all design, code, and intellectual property, remains the
              property of Roame Co. under the terms of the development agreement with Junk Monkey
              Pickup. This Agreement does not transfer ownership of the Application or any of its
              components to the User.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Disclaimer</h2>
            <p>
              The Application is provided as-is for internal business use. Roame Co. is not liable
              for any data loss, business interruption, or damages arising from use of the Application
              beyond what is covered under the active development and support agreement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Contact</h2>
            <p>
              Questions about this agreement can be directed to{' '}
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

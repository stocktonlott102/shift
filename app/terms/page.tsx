import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block"
          >
            ← Back to Shift
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: March 9, 2026</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">1. Agreement to Terms</h2>
            <p>
              By creating an account and using Shift, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use Shift. These terms apply to all users of the application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
            <p>
              Shift is a coaching management application that helps individual coaches manage their client roster, schedule lessons, and track financials. Shift is provided as a subscription-based software service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3. Accounts</h2>
            <p>
              You must provide a valid email address to create an account. You are responsible for maintaining the security of your account and password. You must notify us immediately if you believe your account has been compromised.
            </p>
            <p className="mt-2">
              You are responsible for all activity that occurs under your account. Sharing account credentials with others is not permitted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4. Subscription and Payment</h2>
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Free Trial</p>
            <p>New accounts receive a 180-day free trial with full access to all features. No credit card is required during the trial period.</p>

            <p className="font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">Paid Subscription</p>
            <p>After the trial period ends, continued use of Shift requires a paid subscription at $10/month. Payment is processed securely through Stripe.</p>

            <p className="font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">Cancellation</p>
            <p>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No refunds are issued for partial months.</p>

            <p className="font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">Price Changes</p>
            <p>We reserve the right to change subscription pricing with at least 30 days notice to active subscribers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5. Your Data</h2>
            <p>
              You own all coaching data you enter into Shift — client information, lesson records, financial data, and notes. We do not claim any ownership over your data.
            </p>
            <p className="mt-2">
              You are responsible for ensuring that any client data you enter into Shift complies with applicable privacy laws in your jurisdiction, including obtaining any necessary consent from clients.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Use Shift for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to other users&apos; data</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of Shift</li>
              <li>Use automated scripts to access or interact with the application at scale</li>
              <li>Resell or sublicense access to Shift</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7. Availability and Uptime</h2>
            <p>
              We strive to keep Shift available at all times but do not guarantee uninterrupted service. We are not liable for downtime caused by maintenance, technical issues, or circumstances outside our control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8. Limitation of Liability</h2>
            <p>
              Shift is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, Stockton Lott and Shift are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to lost revenue, lost data, or business interruption.
            </p>
            <p className="mt-2">
              Our total liability to you for any claim arising out of your use of Shift shall not exceed the amount you paid for the service in the three months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these Terms of Service. You may terminate your account at any time by contacting us or canceling your subscription.
            </p>
            <p className="mt-2">
              Upon termination, your data will be retained for 30 days before deletion, during which time you may request an export.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. We will notify you of significant changes via email or a notice within the app. Continued use of Shift after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">11. Contact</h2>
            <p>
              Questions about these Terms of Service can be directed to us through the Help & Feedback page within the app.
            </p>
          </section>

        </div>

        <div className="mt-6 text-center">
          <Link
            href="/privacy-policy"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}

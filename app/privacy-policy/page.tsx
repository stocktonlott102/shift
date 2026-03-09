import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: March 9, 2026</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">1. Introduction</h2>
            <p>
              Shift (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is a coaching management application built and operated by Stockton Lott. This Privacy Policy explains how we collect, use, and protect your information when you use Shift.
            </p>
            <p className="mt-2">
              By creating an account and using Shift, you agree to the collection and use of information as described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. Information We Collect</h2>
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Account Information</p>
            <p>When you create an account, we collect your email address and password (stored securely and never in plain text).</p>

            <p className="font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">Coaching Data</p>
            <p>Information you enter into Shift, including client names, lesson schedules, lesson types, financial records, expenses, and mileage logs. This data belongs to you and is only used to provide the service.</p>

            <p className="font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">Payment Information</p>
            <p>Shift uses Stripe to process subscription payments. We do not store your credit card number. Stripe handles all payment processing and is subject to its own privacy policy.</p>

            <p className="font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">Usage Data</p>
            <p>We may collect basic usage information such as pages visited and features used to improve the app. We do not sell this data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide and operate the Shift application</li>
              <li>To process your subscription payment via Stripe</li>
              <li>To send account-related emails (password resets, email verification)</li>
              <li>To identify and fix bugs or performance issues</li>
              <li>To improve features based on how the app is used</li>
            </ul>
            <p className="mt-3">We do not sell your personal information or coaching data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4. Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase, which provides encrypted database storage and authentication services. All data is isolated per account — no other user can access your coaching data.
            </p>
            <p className="mt-2">
              We implement rate limiting, input validation, and standard security headers to protect the application. However, no system is 100% secure. If you believe your account has been compromised, contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5. Third-Party Services</h2>
            <p>Shift uses the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><span className="font-medium">Supabase</span> — database and authentication</li>
              <li><span className="font-medium">Stripe</span> — subscription payment processing</li>
              <li><span className="font-medium">Vercel</span> — application hosting</li>
              <li><span className="font-medium">Upstash</span> — rate limiting</li>
            </ul>
            <p className="mt-3">Each of these services has its own privacy policy governing their data practices.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">6. Data Retention and Deletion</h2>
            <p>
              Your data is retained for as long as your account is active. If you wish to delete your account and all associated data, contact us at the email below. We will process deletion requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7. Children&apos;s Privacy</h2>
            <p>
              Shift is intended for use by adult coaches. We do not knowingly collect personal information from children under 13. Client data entered by coaches (which may include minors&apos; names) is the responsibility of the coach to handle in compliance with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make significant changes, we will notify you via email or a notice within the app. Continued use of Shift after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or your data, please contact us through the Help & Feedback page within the app.
            </p>
          </section>

        </div>

        <div className="mt-6 text-center">
          <Link
            href="/terms"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}

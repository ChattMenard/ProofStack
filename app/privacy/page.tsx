'use client'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: October 17, 2025</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                ProofStack ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our Service.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                By using ProofStack, you consent to the data practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li><strong>Account Information:</strong> Email address, username, password (hashed), profile information</li>
                <li><strong>Authentication Data:</strong> GitHub OAuth tokens (if you connect your GitHub account)</li>
                <li><strong>Uploaded Content:</strong> Files you upload (code, audio, video, documents), metadata, descriptions</li>
                <li><strong>Communication:</strong> Messages you send through contact forms or support requests</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Service</li>
                <li><strong>Device Information:</strong> Browser type, operating system, IP address, device identifiers</li>
                <li><strong>Log Data:</strong> Access times, error logs, API requests</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, authentication tokens, analytics cookies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.3 Third-Party Data</h3>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li><strong>GitHub Data:</strong> Repository information, commit history, public profile data (with your permission)</li>
                <li><strong>Analytics Data:</strong> Aggregated usage statistics from PostHog and Vercel Analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">3.1 Service Provision</h3>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Creating and managing your account</li>
                <li>Storing and displaying your uploaded content</li>
                <li>Processing and analyzing your files using AI systems</li>
                <li>Generating skill extractions and portfolio insights</li>
                <li>Creating cryptographic proofs and signatures</li>
                <li>Enabling GitHub integration and verification</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">3.2 AI Analysis and Processing</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>Important:</strong> By uploading files to ProofStack, you explicitly consent to AI analysis of your content. This includes:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li><strong>Text Analysis:</strong> Code, documents, and text files are processed by large language models (LLMs) to extract skills, identify technologies, and generate summaries</li>
                <li><strong>Audio/Video Transcription:</strong> Media files are transcribed using speech-to-text AI services (OpenAI Whisper)</li>
                <li><strong>Third-Party AI Services:</strong> Your content may be sent to third-party AI providers (OpenAI, Anthropic, Hugging Face, local Ollama instances) for processing</li>
                <li><strong>Data Retention by AI Providers:</strong> Third-party AI services may temporarily cache your content for processing. We use zero-retention APIs where available</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>Note:</strong> We do not train AI models on your private content. AI analysis is solely for providing the Service to you.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">3.3 Communication and Support</h3>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Responding to your inquiries and support requests</li>
                <li>Sending service-related notifications and updates</li>
                <li>Notifying you of changes to our Terms or Privacy Policy</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">3.4 Analytics and Improvement</h3>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Understanding how users interact with the Service</li>
                <li>Identifying and fixing bugs and technical issues</li>
                <li>Improving Service performance and user experience</li>
                <li>Developing new features and functionality</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">3.5 Security and Legal Compliance</h3>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Detecting and preventing fraud, abuse, and security incidents</li>
                <li>Enforcing our Terms of Service</li>
                <li>Complying with legal obligations and responding to lawful requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Data Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.1 Public Information</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>Your portfolio and uploaded content are public by default.</strong> Anyone with the link to your 
                portfolio can view your samples, skills, and analyses. Do not upload sensitive or confidential information.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.2 Service Providers</h3>
              <p className="text-gray-700 leading-relaxed mb-3">We share data with third-party service providers who help us operate the Service:</p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li><strong>Supabase:</strong> Database and authentication (data stored in US cloud infrastructure)</li>
                <li><strong>Cloudinary:</strong> File storage and media processing</li>
                <li><strong>OpenAI:</strong> AI analysis and transcription services</li>
                <li><strong>Anthropic/Hugging Face:</strong> Alternative AI analysis providers</li>
                <li><strong>Vercel:</strong> Hosting and deployment infrastructure</li>
                <li><strong>PostHog:</strong> Product analytics and user behavior tracking</li>
                <li><strong>Sentry:</strong> Error monitoring and performance tracking</li>
                <li><strong>GitHub:</strong> OAuth authentication and repository integration</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.3 Legal Requirements</h3>
              <p className="text-gray-700 leading-relaxed">
                We may disclose your information if required by law, court order, subpoena, or to protect our rights 
                and safety or the rights and safety of others.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.4 Business Transfers</h3>
              <p className="text-gray-700 leading-relaxed">
                If ProofStack is involved in a merger, acquisition, or sale of assets, your information may be 
                transferred as part of that transaction.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.5 With Your Consent</h3>
              <p className="text-gray-700 leading-relaxed">
                We may share your information with third parties when you give us explicit consent to do so.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>5.1 Active Accounts:</strong> We retain your data for as long as your account is active or as 
                needed to provide the Service.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>5.2 Account Deletion:</strong> When you delete your account:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Your account is immediately deactivated and inaccessible</li>
                <li>Uploaded files are removed from Cloudinary storage within 30 days</li>
                <li>Personal data is permanently deleted from our databases within 90 days</li>
                <li>Backups containing your data are purged within 180 days</li>
                <li>Anonymized analytics data (without personal identifiers) may be retained indefinitely</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>5.3 Legal Retention:</strong> We may retain certain information for longer periods if required 
                by law or to resolve disputes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We implement reasonable security measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Encryption of data at rest (database and file storage)</li>
                <li>Secure authentication with hashed passwords and OAuth tokens</li>
                <li>Regular security monitoring and vulnerability scanning</li>
                <li>Access controls and authentication for our systems</li>
                <li>Error monitoring and logging via Sentry</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>Note:</strong> No method of transmission over the internet is 100% secure. While we strive to 
                protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Your Privacy Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-3">You have the following rights regarding your data:</p>
              
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information in your account settings</li>
                <li><strong>Deletion:</strong> Request permanent deletion of your account and data via dashboard settings</li>
                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
                <li><strong>Opt-Out:</strong> Disable analytics cookies and tracking (may limit functionality)</li>
                <li><strong>Withdraw Consent:</strong> Revoke consent for data processing by deleting your account</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, visit your dashboard settings or contact us at privacy@proofstack.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use cookies and similar tracking technologies to enhance your experience:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">8.1 Essential Cookies</h3>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Authentication tokens (required for login)</li>
                <li>Session management cookies</li>
                <li>Security cookies (CSRF protection)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">8.2 Analytics Cookies</h3>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>PostHog analytics (product usage, feature adoption)</li>
                <li>Vercel Analytics (page views, performance metrics)</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                You can control cookies through your browser settings, but disabling cookies may limit Service functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. By using the 
                Service, you consent to such transfers. We ensure appropriate safeguards are in place for international 
                data transfers in compliance with applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                ProofStack is not intended for users under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If we become aware that we have collected data from a child under 
                13, we will promptly delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. California Privacy Rights (CCPA)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Right to know what personal information is collected, used, shared, or sold</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
                <li>Right to non-discrimination for exercising your CCPA rights</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                To exercise your CCPA rights, contact privacy@proofstack.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. GDPR Rights (European Users)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                If you are in the European Economic Area (EEA), you have rights under the General Data Protection 
                Regulation (GDPR):
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Right of access to your personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Right to withdraw consent</li>
                <li>Right to lodge a complaint with a supervisory authority</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Our legal basis for processing includes: consent (for AI analysis), contract performance (for providing 
                the Service), and legitimate interests (for security and improvement).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes via email 
                or prominent notice on the Service. Your continued use after changes constitutes acceptance of the 
                updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Privacy Officer:</strong> privacy@proofstack.com<br />
                <strong>General Support:</strong> support@proofstack.com<br />
                <strong>Data Deletion Requests:</strong> Via dashboard settings or privacy@proofstack.com
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-300">
              <p className="text-sm text-gray-600 italic">
                By using ProofStack, you acknowledge that you have read and understood this Privacy Policy and 
                consent to the collection, use, and disclosure of your information as described herein.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

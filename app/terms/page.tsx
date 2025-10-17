'use client'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: October 17, 2025</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using ProofStack ("Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed">
                ProofStack is a platform that enables users to showcase their skills and work through verified 
                portfolios. The Service includes:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>File upload and storage for work samples (code, audio, video, documents)</li>
                <li>AI-powered skill extraction and analysis of uploaded content</li>
                <li>GitHub repository integration and verification</li>
                <li>Generation of cryptographic proofs and signatures for authenticity</li>
                <li>Public portfolio hosting and sharing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. User Accounts and Registration</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>3.1 Account Creation:</strong> You may register for an account using email authentication 
                or GitHub OAuth. You are responsible for maintaining the confidentiality of your account credentials.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>3.2 Account Accuracy:</strong> You agree to provide accurate, current, and complete 
                information during registration and to update such information to keep it accurate.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>3.3 Account Security:</strong> You are solely responsible for all activities that occur 
                under your account. You must immediately notify us of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Content and Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>4.1 Your Content:</strong> You retain all ownership rights to content you upload to 
                ProofStack ("Your Content"). By uploading content, you grant ProofStack a worldwide, non-exclusive, 
                royalty-free license to store, process, analyze, and display Your Content as necessary to provide 
                the Service.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>4.2 AI Analysis Consent:</strong> By uploading files to ProofStack, you explicitly consent 
                to having those files analyzed by artificial intelligence systems (including but not limited to 
                large language models) for the purpose of skill extraction and content analysis. This analysis may 
                involve:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2 mb-3">
                <li>Reading and processing text content from documents and code files</li>
                <li>Transcribing audio and video content</li>
                <li>Extracting metadata and technical details</li>
                <li>Identifying skills, technologies, and competencies</li>
                <li>Generating summaries and descriptions</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>4.3 Employer-Owned Content:</strong> You warrant that you have the legal right to upload 
                all content you submit to ProofStack. If you are uploading work created for an employer or client, 
                you must:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2 mb-3">
                <li>Have explicit permission from the copyright holder to share such content</li>
                <li>Acknowledge employer ownership when prompted during upload</li>
                <li>Not upload confidential, proprietary, or trade secret information without authorization</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>4.4 Public Display:</strong> Content you upload may be displayed publicly on your portfolio 
                page. You should not upload sensitive, confidential, or private information.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.5 ProofStack IP:</strong> The Service, including its design, functionality, and underlying 
                technology, is owned by ProofStack and protected by intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Prohibited Uses</h2>
              <p className="text-gray-700 leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Upload content you do not have the right to share</li>
                <li>Upload illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable content</li>
                <li>Upload malware, viruses, or any malicious code</li>
                <li>Misrepresent your skills, experience, or the ownership of content</li>
                <li>Attempt to reverse engineer, decompile, or hack the Service</li>
                <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the intellectual property rights of others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. DMCA and Copyright Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                ProofStack respects intellectual property rights and responds to valid DMCA takedown notices. If you 
                believe your copyrighted work has been infringed, please contact us at:
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>Email:</strong> dmca@proofstack.com
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                Your notice must include:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Your contact information</li>
                <li>Description of the copyrighted work</li>
                <li>Location of the infringing material (URL)</li>
                <li>Statement of good faith belief that use is unauthorized</li>
                <li>Statement of accuracy under penalty of perjury</li>
                <li>Your physical or electronic signature</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Data Retention and Deletion</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>7.1 Data Retention:</strong> We retain your account data and uploaded content for as long 
                as your account is active or as needed to provide services.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>7.2 Account Deletion:</strong> You may request permanent deletion of your account and all 
                associated data at any time through your dashboard settings or by contacting support@proofstack.com.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>7.3 Deletion Process:</strong> Upon deletion request:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Your account will be immediately deactivated</li>
                <li>All uploaded files will be removed from our storage within 30 days</li>
                <li>All personal data will be permanently deleted within 90 days</li>
                <li>Anonymized analytics data may be retained for business purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. User Rights and Responsibilities</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>8.1 Your Rights:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2 mb-3">
                <li>Access and download your data at any time</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of optional analytics and tracking</li>
                <li>Control the visibility of your portfolio (public/private)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>8.2 Your Responsibilities:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-700 space-y-2">
                <li>Ensure you have rights to all content you upload</li>
                <li>Maintain the security of your account</li>
                <li>Comply with all applicable laws and these Terms</li>
                <li>Respect the intellectual property rights of others</li>
                <li>Report any violations or security issues to us</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Disclaimers and Limitations</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>9.1 Service Availability:</strong> The Service is provided "as is" without warranties of any 
                kind. We do not guarantee uninterrupted or error-free service.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>9.2 AI Analysis Accuracy:</strong> AI-powered skill extraction is automated and may not be 
                100% accurate. We do not warrant the accuracy, completeness, or reliability of analysis results.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>9.3 Third-Party Services:</strong> We integrate with third-party services (GitHub, Cloudinary, 
                OpenAI, etc.). We are not responsible for the availability or functionality of these services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>9.4 Limitation of Liability:</strong> To the maximum extent permitted by law, ProofStack 
                shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violation of these Terms, 
                illegal activity, or any other reason at our sole discretion. Upon termination, your right to use 
                the Service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We may modify these Terms at any time. We will notify users of material changes via email or 
                prominent notice on the Service. Your continued use of the Service after changes constitutes 
                acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], 
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these Terms, please contact us at:
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>Email:</strong> legal@proofstack.com<br />
                <strong>Support:</strong> support@proofstack.com<br />
                <strong>DMCA:</strong> dmca@proofstack.com
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-300">
              <p className="text-sm text-gray-600 italic">
                By using ProofStack, you acknowledge that you have read, understood, and agree to be bound by 
                these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

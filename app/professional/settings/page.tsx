'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfessionalSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    headline: '',
    skills: '',
    githubUsername: '',
    location: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setFormData({
        fullName: profileData.full_name || '',
        bio: profileData.bio || '',
        headline: profileData.headline || '',
        skills: profileData.skills?.join(', ') || '',
        githubUsername: profileData.github_username || '',
        location: profileData.location || '',
      });
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');
    setAnalysisResult(null);

    try {
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          bio: formData.bio,
          headline: formData.headline,
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          github_username: formData.githubUsername,
          location: formData.location,
        })
        .eq('id', user.id);

      if (updateError) {
        setMessage('Error saving changes: ' + updateError.message);
        setSaving(false);
        return;
      }

      setMessage('Settings saved successfully! 🎉');

      // Trigger AI profile analysis in background
      if (formData.bio || formData.headline || formData.skills) {
        setAnalyzing(true);
        try {
          const response = await fetch('/api/professional/analyze-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response.ok) {
            const result = await response.json();
            setAnalysisResult(result);
            setMessage('Settings saved & profile analyzed! Your ProofScore has been updated. ✨');
          }
        } catch (analysisError) {
          console.error('Profile analysis error:', analysisError);
          // Don't show error to user - analysis is optional
        } finally {
          setAnalyzing(false);
        }
      }

      await loadData();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-950 flex items-center justify-center">
        <div className="text-forest-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest-50 mb-2">Profile Settings</h1>
          <p className="text-forest-400">
            Update your professional profile and improve your ProofScore
          </p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-green-500/10 border border-green-500/30 text-green-400'
          }`}>
            {message}
          </div>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <div className="mb-6 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">
              Profile Quality Analysis
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-forest-400">Overall Score:</span>
                <span className="ml-2 font-bold text-blue-400">
                  {analysisResult.score?.toFixed(1)}/10
                </span>
              </div>
              <div>
                <span className="text-forest-400">Grammar:</span>
                <span className="ml-2 font-bold text-blue-400">
                  {analysisResult.grammar?.toFixed(1)}/10
                </span>
              </div>
              <div>
                <span className="text-forest-400">Professionalism:</span>
                <span className="ml-2 font-bold text-blue-400">
                  {analysisResult.professionalism?.toFixed(1)}/10
                </span>
              </div>
              <div>
                <span className="text-forest-400">Clarity:</span>
                <span className="ml-2 font-bold text-blue-400">
                  {analysisResult.clarity?.toFixed(1)}/10
                </span>
              </div>
            </div>
            {analysisResult.feedback && (
              <p className="mt-3 text-forest-300 text-sm">{analysisResult.feedback}</p>
            )}
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-forest-900 border border-forest-800 rounded-xl p-6 space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-forest-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 bg-forest-800 border border-forest-700 rounded-lg text-forest-50 focus:outline-none focus:ring-2 focus:ring-sage-500"
              placeholder="John Doe"
            />
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-forest-300 mb-2">
              Professional Headline
              <span className="ml-2 text-xs text-sage-400">(Analyzed by AI)</span>
            </label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              className="w-full px-4 py-2 bg-forest-800 border border-forest-700 rounded-lg text-forest-50 focus:outline-none focus:ring-2 focus:ring-sage-500"
              placeholder="Full Stack Developer | React & Node.js Expert"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-forest-300 mb-2">
              Bio
              <span className="ml-2 text-xs text-sage-400">(Analyzed by AI for grammar & professionalism)</span>
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 bg-forest-800 border border-forest-700 rounded-lg text-forest-50 focus:outline-none focus:ring-2 focus:ring-sage-500"
              placeholder="Tell employers about your experience, skills, and what makes you unique..."
            />
            <p className="mt-1 text-xs text-forest-400">
              Well-written profiles score higher in ProofScore's Communication Quality (10 points)
            </p>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-forest-300 mb-2">
              Skills
              <span className="ml-2 text-xs text-sage-400">(Comma-separated)</span>
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full px-4 py-2 bg-forest-800 border border-forest-700 rounded-lg text-forest-50 focus:outline-none focus:ring-2 focus:ring-sage-500"
              placeholder="JavaScript, React, Node.js, Python, PostgreSQL"
            />
          </div>

          {/* GitHub Username */}
          <div>
            <label className="block text-sm font-medium text-forest-300 mb-2">
              GitHub Username
            </label>
            <input
              type="text"
              value={formData.githubUsername}
              onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
              className="w-full px-4 py-2 bg-forest-800 border border-forest-700 rounded-lg text-forest-50 focus:outline-none focus:ring-2 focus:ring-sage-500"
              placeholder="yourusername"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-forest-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 bg-forest-800 border border-forest-700 rounded-lg text-forest-50 focus:outline-none focus:ring-2 focus:ring-sage-500"
              placeholder="San Francisco, CA"
            />
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving || analyzing}
              className="px-6 py-3 bg-gradient-to-r from-sage-600 to-sage-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? 'Analyzing Profile...' : saving ? 'Saving...' : 'Save Changes'}
            </button>

            {analyzing && (
              <span className="text-sm text-sage-400 animate-pulse">
                🤖 AI is analyzing your profile quality...
              </span>
            )}
          </div>
        </div>

        {/* ProofScore Info */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">
            💡 How Profile Quality Affects Your ProofScore
          </h3>
          <ul className="text-xs text-forest-300 space-y-1">
            <li>• Profile Quality is worth <strong>10 points</strong> out of 100 in your total ProofScore</li>
            <li>• AI analyzes your bio and headline for grammar, spelling, and professionalism</li>
            <li>• A well-written profile helps employers trust your communication skills</li>
            <li>• Your ProofScore updates automatically when you save changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import HireLimitGuard from '@/components/HireLimitGuard';
import ProofScoreV2 from '@/components/ProofScoreV2';
import PreferencesDisplay from '@/components/PreferencesDisplay';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SearchFilters {
  skills: string[];
  minExperience: number;
  maxExperience: number;
  location: string;
  minRating: number;
  remoteOnly: boolean;
  availability: string;
  proMembersOnly: boolean;
}

interface Professional {
  id: string;
  username: string;
  headline: string;
  location: string;
  years_experience: number;
  remote_available: boolean;
  availability_status: string;
  is_pro: boolean;
  skills: string[];
  promotion_tier?: string;
  average_rating?: number;
  total_reviews?: number;
}

export default function DiscoverPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employerOrg, setEmployerOrg] = useState<any>(null);
  
  const [filters, setFilters] = useState<SearchFilters>({
    skills: [],
    minExperience: 0,
    maxExperience: 20,
    location: '',
    minRating: 0,
    remoteOnly: false,
    availability: '',
    proMembersOnly: false
  });

  const [skillInput, setSkillInput] = useState('');
  const [availableSkills] = useState([
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
    'C++', 'Go', 'Rust', 'Swift', 'Kotlin', 'SQL', 'MongoDB', 'PostgreSQL',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'GraphQL', 'REST API'
  ]);

  useEffect(() => {
    loadUserAndOrg();
    loadSavedCandidates();
    searchProfessionals();
  }, []);

  const loadUserAndOrg = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setCurrentUser(user);

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profile?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();

      setEmployerOrg(org);
    }
  };

  const loadSavedCandidates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('saved_candidates')
      .select('professional_id')
      .eq('employer_id', user.id);

    if (data) {
      setSavedIds(new Set(data.map((s: any) => s.professional_id)));
    }
  };

  const searchProfessionals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/employer/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });

      const data = await response.json();
      if (data.professionals) {
        setProfessionals(data.professionals);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async (professionalId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth/signin';
        return;
      }

      // Track message action for promoted profiles
      fetch('/api/promotions/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_id: professionalId,
          action: 'message'
        })
      }).catch(err => console.error('Tracking error:', err));

      // Check if conversation already exists
      const { data: existingParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (existingParticipants && existingParticipants.length > 0) {
        const conversationIds = existingParticipants.map((p: any) => p.conversation_id);
        
        // Check if professional is in any of these conversations
        const { data: professionalParticipant } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', professionalId)
          .in('conversation_id', conversationIds)
          .single();

        if (professionalParticipant) {
          // Conversation exists, redirect to it
          window.location.href = `/employer/messages?conversation=${professionalParticipant.conversation_id}`;
          return;
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (convError || !conversation) {
        console.error('Error creating conversation:', convError);
        alert('Failed to create conversation');
        return;
      }

      // Add both participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: conversation.id,
            user_id: user.id,
            last_read_at: new Date().toISOString()
          },
          {
            conversation_id: conversation.id,
            user_id: professionalId,
            last_read_at: new Date().toISOString()
          }
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        alert('Failed to create conversation');
        return;
      }

      // Create connection record
      await supabase
        .from('connections')
        .insert({
          employer_id: user.id,
          professional_id: professionalId,
          status: 'pending'
        });

      // Redirect to messages with the new conversation
      window.location.href = `/employer/messages?conversation=${conversation.id}`;
    } catch (error) {
      console.error('Message error:', error);
      alert('Failed to start conversation');
    }
  };

  const trackView = (professionalId: string) => {
    // Track view action for promoted profiles (fire and forget)
    fetch('/api/promotions/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        professional_id: professionalId,
        action: 'view'
      })
    }).catch(err => console.error('Tracking error:', err));
  };

  const toggleSave = async (professionalId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isSaved = savedIds.has(professionalId);

    if (isSaved) {
      await supabase
        .from('saved_candidates')
        .delete()
        .eq('employer_id', user.id)
        .eq('professional_id', professionalId);
      
      setSavedIds(prev => {
        const next = new Set(prev);
        next.delete(professionalId);
        return next;
      });
    } else {
      await supabase
        .from('saved_candidates')
        .insert({
          employer_id: user.id,
          professional_id: professionalId
        });
      
      setSavedIds(prev => new Set(prev).add(professionalId));

      // Track save action for promoted profiles
      fetch('/api/promotions/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_id: professionalId,
          action: 'save'
        })
      }).catch(err => console.error('Tracking error:', err));

      // Track view
      await supabase.from('profile_views').insert({
        profile_id: professionalId,
        viewer_id: user.id,
        source: 'search'
      });
    }
  };

  const addSkill = (skill: string) => {
    if (!filters.skills.includes(skill)) {
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const getPromotionBadge = (tier?: string) => {
    if (!tier) return null;
    
    const badges = {
      featured: { text: 'FEATURED', color: 'bg-gradient-to-r from-yellow-400 to-orange-500', icon: '⭐' },
      premium: { text: 'PREMIUM', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '💎' },
      standard: { text: 'PROMOTED', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', icon: '🚀' }
    };

    const badge = badges[tier as keyof typeof badges];
    if (!badge) return null;

    return (
      <div className={`absolute top-3 right-3 ${badge.color} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10`}>
        <span>{badge.icon}</span>
        {badge.text}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Discover Professionals
            </h1>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setView('grid')}
                  className={`px-3 py-1 rounded ${view === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1 rounded ${view === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Filter Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Filters
              </button>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            {professionals.length} professionals found
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-80 flex-shrink-0`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Filters</h2>

              {/* Skills */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && skillInput) {
                        addSkill(skillInput);
                      }
                    }}
                    placeholder="Type and press Enter"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                {/* Skill suggestions */}
                {skillInput && (
                  <div className="mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                    {availableSkills
                      .filter(s => s.toLowerCase().includes(skillInput.toLowerCase()))
                      .map(skill => (
                        <button
                          key={skill}
                          onClick={() => addSkill(skill)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                        >
                          {skill}
                        </button>
                      ))}
                  </div>
                )}

                {/* Selected skills */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {filters.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Years of Experience: {filters.minExperience} - {filters.maxExperience}+
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.minExperience}
                  onChange={(e) => setFilters(prev => ({ ...prev, minExperience: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, State, or Country"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="0">Any Rating</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-3 mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.remoteOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, remoteOnly: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Remote available only</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.proMembersOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, proMembersOnly: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Pro members only</span>
                </label>
              </div>

              {/* Search Button */}
              <button
                onClick={searchProfessionals}
                disabled={loading}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>

              <button
                onClick={() => {
                  setFilters({
                    skills: [],
                    minExperience: 0,
                    maxExperience: 20,
                    location: '',
                    minRating: 0,
                    remoteOnly: false,
                    availability: '',
                    proMembersOnly: false
                  });
                }}
                className="w-full mt-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear all filters
              </button>
            </div>
          </aside>

          {/* Results Grid/List */}
          <main className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Searching professionals...</p>
              </div>
            ) : professionals.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No professionals found</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Try adjusting your filters</p>
              </div>
            ) : (
              <div className={view === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
                {professionals.map((prof) => (
                  <div
                    key={prof.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow relative overflow-hidden"
                  >
                    {getPromotionBadge(prof.promotion_tier)}

                    <div className="p-4 sm:p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4 gap-3">
                        <div className="flex items-start sm:items-center flex-col sm:flex-row gap-2 sm:gap-0 flex-1 min-w-0">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold sm:mr-4 flex-shrink-0">
                            {prof.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white break-words">
                              {prof.username}
                              {prof.is_pro && (
                                <span className="ml-2 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded whitespace-nowrap">
                                  PRO
                                </span>
                              )}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{prof.headline}</p>
                          </div>
                        </div>

                        {/* Save Button */}
                        <button
                          onClick={() => toggleSave(prof.id)}
                          className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                            savedIds.has(prof.id)
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-blue-600'
                          }`}
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill={savedIds.has(prof.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {prof.years_experience} years experience
                        </div>
                        {prof.location && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {prof.location}
                            {prof.remote_available && ' • Remote available'}
                          </div>
                        )}
                        {prof.average_rating && prof.total_reviews && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {prof.average_rating.toFixed(1)} ({prof.total_reviews} reviews)
                          </div>
                        )}
                      </div>

                      {/* ProofScore V2 */}
                      <div className="mb-4">
                        <ProofScoreV2 
                          professionalId={prof.id} 
                          size="small" 
                          showBreakdown={false}
                        />
                      </div>

                      {/* Preferences/Dealbreakers Badges */}
                      <div className="mb-4">
                        <PreferencesDisplay profileId={prof.id} compact={true} />
                      </div>

                      {/* Skills */}
                      {prof.skills && prof.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {prof.skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {prof.skills.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                              +{prof.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          href={`/portfolio/${prof.username}`}
                          onClick={() => trackView(prof.id)}
                          className="flex-1 text-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                        >
                          View Profile
                        </Link>
                        {/* Step 3: Hire button wrapped with limit guard */}
                        {currentUser && employerOrg ? (
                          <HireLimitGuard
                            employerOrgId={employerOrg.id}
                            employerUserId={currentUser.id}
                            professionalId={prof.id}
                            attemptType="message"
                          >
                            <button
                              onClick={() => handleMessage(prof.id)}
                              className="w-full sm:w-auto px-4 py-2 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm sm:text-base"
                            >
                              Message
                            </button>
                          </HireLimitGuard>
                        ) : (
                          <button
                            onClick={() => handleMessage(prof.id)}
                            className="w-full sm:w-auto px-4 py-2 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm sm:text-base"
                          >
                            Message
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

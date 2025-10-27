'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import VerificationBadges from '@/components/VerificationBadges';
import SkillLevelBadge from '@/components/SkillLevelBadge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SkillLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'unverified';

export default function PortfoliosPage() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedSkillLevels, setSelectedSkillLevels] = useState<SkillLevel[]>([]);

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'professional')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error loading professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkillLevel = (level: SkillLevel) => {
    setSelectedSkillLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = !searchQuery || 
      prof.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSkillLevel = selectedSkillLevels.length === 0 ||
      selectedSkillLevels.includes(prof.skill_level || 'unverified');
    
    return matchesSearch && matchesSkillLevel;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading The Talent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎯 The Talent
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Browse verified talent ready for your next project
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <input
            type="text"
            placeholder="Search The Talent by name, skills, or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
          />
          
          {/* Skill Level Filter */}
          <div>
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Skill Level:</p>
            <div className="flex flex-wrap gap-2">
              {(['junior', 'mid', 'senior', 'lead'] as SkillLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => toggleSkillLevel(level)}
                  className={`transition-all ${
                    selectedSkillLevels.includes(level)
                      ? 'ring-2 ring-indigo-600 ring-offset-2'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <SkillLevelBadge level={level} size="sm" />
                </button>
              ))}
              {selectedSkillLevels.length > 0 && (
                <button
                  onClick={() => setSelectedSkillLevels([])}
                  className="ml-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {filteredProfessionals.length} profile{filteredProfessionals.length !== 1 ? 's' : ''} found
        </div>

        {/* Professionals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessionals.map((prof) => (
            <Link
              key={prof.id}
              href={`/portfolio/${prof.username || prof.id}`}
              className="block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow p-6"
            >
              {/* Profile Image */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {prof.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {prof.name || 'Anonymous'}
                  </h3>
                  {prof.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      📍 {prof.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Headline */}
              {prof.headline && (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {prof.headline}
                </p>
              )}

              {/* Bio */}
              {prof.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {prof.bio}
                </p>
              )}

              {/* Skill Level Badge */}
              {prof.skill_level && prof.skill_level !== 'unverified' && (
                <div className="mb-3">
                  <SkillLevelBadge level={prof.skill_level} size="sm" />
                </div>
              )}

              {/* Verification Badges */}
              <div className="mb-4">
                <VerificationBadges 
                  profileId={prof.id}
                  size="small"
                  showLabels={false}
                  layout="horizontal"
                />
              </div>

              {/* Skills */}
              {prof.skills && prof.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {prof.skills.slice(0, 5).map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                  {prof.skills.length > 5 && (
                    <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                      +{prof.skills.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredProfessionals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No professionals found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ProofStack Employer/Organization Platform Types
 * Phase 1: Foundation types for two-sided marketplace
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type UserType = 'professional' | 'employer' | 'organization';

export type AvailabilityStatus = 'available' | 'open_to_offers' | 'not_looking' | 'unavailable';

// ============================================================================
// ORGANIZATIONS
// ============================================================================

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';

export type OrganizationSubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  company_size?: CompanySize;
  logo_url?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  subscription_tier: OrganizationSubscriptionTier;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  is_verified: boolean;
  metadata?: Record<string, unknown>;
}

export type OrganizationRole = 'owner' | 'admin' | 'recruiter' | 'member';

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  invited_by?: string;
  invited_at: string;
  joined_at?: string;
  is_active: boolean;
}

// ============================================================================
// PROMOTIONS
// ============================================================================

export type PromotionTier = 'featured' | 'premium' | 'standard';

export interface ProfessionalPromotion {
  id: string;
  professional_id: string;
  tier: PromotionTier;
  starts_at: string;
  expires_at: string;
  payment_amount: number;
  stripe_payment_intent?: string;
  stripe_subscription_id?: string;
  is_active: boolean;
  views_count: number;
  saves_count: number;
  messages_count: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface PromotionTierDetails {
  tier: PromotionTier;
  name: string;
  price_monthly: number;
  price_yearly?: number;
  benefits: string[];
  visibility_multiplier: number;
  badge_color: string;
}

// ============================================================================
// REVIEWS & RATINGS
// ============================================================================

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface EmployerReview {
  id: string;
  professional_id: string;
  employer_id: string;
  organization_id?: string;
  rating: ReviewRating;
  review_text?: string;
  would_hire_again: boolean;
  work_period_start: string;
  work_period_end?: string;
  position_title?: string;
  skills_used?: string[];
  is_verified: boolean;
  is_public: boolean;
  reported: boolean;
  report_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalRating {
  professional_id: string;
  average_rating: number;
  total_reviews: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  would_hire_again_percentage: number;
  last_review_at?: string;
  updated_at: string;
}

// ============================================================================
// MESSAGING
// ============================================================================

export interface Conversation {
  id: string;
  subject?: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string;
  is_archived: boolean;
  is_muted: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string;
  attachment_type?: string;
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationWithDetails extends Conversation {
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count: number;
}

// ============================================================================
// CONNECTIONS & SAVED CANDIDATES
// ============================================================================

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface Connection {
  id: string;
  employer_id: string;
  professional_id: string;
  status: ConnectionStatus;
  message?: string;
  conversation_id?: string;
  created_at: string;
  responded_at?: string;
  metadata?: Record<string, unknown>;
}

export interface SavedCandidate {
  id: string;
  employer_id: string;
  professional_id: string;
  notes?: string;
  tags?: string[];
  folder?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SEARCH & DISCOVERY
// ============================================================================

export interface CandidateSearchFilters {
  // Skills
  skills?: string[];
  skills_match_type?: 'any' | 'all';
  
  // Experience
  years_experience_min?: number;
  years_experience_max?: number;
  
  // Location
  location?: string;
  remote_only?: boolean;
  
  // Availability
  availability?: AvailabilityStatus[];
  
  // Ratings
  min_rating?: number;
  verified_only?: boolean;
  
  // Subscription
  pro_only?: boolean;
  
  // Promotion
  promoted_only?: boolean;
}

export interface SearchHistory {
  id: string;
  employer_id: string;
  query?: string;
  filters: CandidateSearchFilters;
  results_count: number;
  created_at: string;
}

export type ProfileViewSource = 'search' | 'saved' | 'direct' | 'promotion' | 'review';

export interface ProfileView {
  id: string;
  profile_id: string;
  viewer_id: string;
  source: ProfileViewSource;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// ENHANCED PROFILE (extends existing profile)
// ============================================================================

export interface EnhancedProfile {
  // Existing fields
  id: string;
  auth_uid: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  github_username?: string;
  bio?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  
  // New fields for employer platform
  user_type: UserType;
  organization_id?: string;
  location?: string;
  remote_available: boolean;
  availability_status: AvailabilityStatus;
  years_experience: number;
  headline?: string;
  contact_preferences?: {
    allow_messages: boolean;
    allow_connection_requests: boolean;
    email_notifications: boolean;
  };
  
  // Computed fields (not in DB)
  active_promotion?: ProfessionalPromotion;
  rating?: ProfessionalRating;
  is_promoted: boolean;
}

// ============================================================================
// SEARCH RESULTS
// ============================================================================

export interface ProfessionalSearchResult extends EnhancedProfile {
  relevance_score: number;
  matched_skills: string[];
  total_samples: number;
  verified_samples: number;
  distance_km?: number; // If location-based
  last_active?: string;
}

export interface SearchResultsResponse {
  results: ProfessionalSearchResult[];
  total_count: number;
  promoted_count: number;
  filters_applied: CandidateSearchFilters;
  page: number;
  page_size: number;
  has_more: boolean;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface ProfessionalAnalytics {
  profile_id: string;
  period: 'week' | 'month' | 'year' | 'all_time';
  
  // Visibility
  profile_views: number;
  search_appearances: number;
  unique_viewers: number;
  
  // Engagement
  connection_requests_received: number;
  connection_requests_accepted: number;
  messages_received: number;
  saves_count: number;
  
  // Performance
  average_response_time_hours: number;
  response_rate_percentage: number;
  
  // Promotion ROI (if promoted)
  promotion_views?: number;
  promotion_conversions?: number;
  promotion_roi_percentage?: number;
}

export interface EmployerAnalytics {
  employer_id: string;
  period: 'week' | 'month' | 'year' | 'all_time';
  
  // Activity
  searches_performed: number;
  profiles_viewed: number;
  candidates_saved: number;
  
  // Connections
  connection_requests_sent: number;
  connection_requests_accepted: number;
  messages_sent: number;
  
  // Engagement
  average_response_time_hours: number;
  response_rate_percentage: number;
  
  // Reviews
  reviews_written: number;
  average_rating_given: number;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    page_size?: number;
    total_count?: number;
    has_more?: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'connection_declined'
  | 'message_received'
  | 'review_received'
  | 'profile_viewed'
  | 'saved_by_employer'
  | 'promotion_expiring'
  | 'promotion_expired';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// USAGE LIMITS (for subscription tiers)
// ============================================================================

export interface UsageLimits {
  // Employer limits
  max_profile_views_per_month?: number;
  max_messages_per_month?: number;
  max_saved_candidates?: number;
  max_team_members?: number;
  can_see_analytics: boolean;
  can_download_profiles: boolean;
  
  // Professional limits (existing + new)
  max_samples_per_month?: number;
  can_promote: boolean;
  can_customize_portfolio: boolean;
}

// ============================================================================
// FORM VALIDATION TYPES
// ============================================================================

export interface OrganizationCreateInput {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  company_size?: CompanySize;
  location?: string;
}

export interface ReviewCreateInput {
  professional_id: string;
  rating: ReviewRating;
  review_text?: string;
  would_hire_again: boolean;
  work_period_start: string;
  work_period_end?: string;
  position_title?: string;
  skills_used?: string[];
  is_public?: boolean;
}

export interface ConnectionRequestInput {
  professional_id: string;
  message?: string;
}

export interface MessageSendInput {
  conversation_id: string;
  content: string;
  attachment_url?: string;
  attachment_type?: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from './employer';

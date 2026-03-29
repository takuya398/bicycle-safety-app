export type Role = 'user' | 'admin'
export type ReportCategory = 'warning' | 'fine' | 'danger' | 'confusing_road'
export type ViolationType = 'signal_ignore' | 'wrong_way' | 'stop_sign_ignore' | 'sidewalk_issue' | 'smartphone_use' | 'no_light' | 'right_side_issue' | 'other'
export type ReportStatus = 'published' | 'hidden' | 'deleted'
export type ReviewStatus = 'clean' | 'flagged' | 'reviewing'
export type NotificationScope = 'saved_only' | 'saved_and_high_risk'
export type FlagReason = 'misinformation' | 'personal_info' | 'harassment' | 'spam' | 'other'

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  role: Role
  is_banned: boolean
  notification_enabled: boolean
  notification_scope: NotificationScope
  notification_radius: number
  created_at: string
}

export interface Spot {
  id: string
  title: string
  slug: string
  lat: number
  lng: number
  prefecture: string | null
  city: string | null
  address: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  report_count?: number
}

export interface Report {
  id: string
  spot_id: string
  user_id: string
  report_category: ReportCategory
  violation_type: ViolationType
  description: string
  occurred_at: string | null
  status: ReportStatus
  review_status: ReviewStatus
  created_at: string
  updated_at: string
  vote_count?: number
  profile?: Pick<Profile, 'username' | 'avatar_url'>
}

export interface SavedSpot {
  id: string
  spot_id: string
  user_id: string
  created_at: string
  spot?: Spot
}

export interface ReportVote {
  id: string
  report_id: string
  user_id: string
  created_at: string
}

export interface ReportFlag {
  id: string
  report_id: string
  user_id: string
  reason: FlagReason
  created_at: string
}

export interface RuleArticle {
  id: string
  title: string
  slug: string
  violation_type: ViolationType
  summary: string | null
  body: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

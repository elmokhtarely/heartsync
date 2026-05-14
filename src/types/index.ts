export interface UserProfile {
  id: string;
  display_name: string;
  invite_code: string;
  couple_id?: string | null;
  last_active_at?: any;
}

export interface Couple {
  id: string;
  partner1_id: string;
  partner2_id: string | null;
  total_signals: number;
  daily_count: number;
  created_at: any;
  last_daily_reset: any;
}

export interface Signal {
  id: string;
  sent_by: string;
  sent_at: any;
  type: 'THINK';
  members: string[];
}

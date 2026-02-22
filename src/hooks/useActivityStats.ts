import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityStats {
  daysActive30d: number;
  currentStreak: number;
  pointsThisWeek: number;
  totalActivities30d: number;
  totalPoints: number;
  totalSessions: number;
  avgSessionDuration: number;
  dailyActivity: { date: string; events: number; points: number; duration: number }[];
  recentEvents: { id: string; event_name: string; page_path: string; points_awarded: number; created_at: string; metadata: any }[];
  deviceMix: { device: string; count: number }[];
  // Scoring & VIP
  intentScore: number;
  engagementScore: number;
  conversionProbability: number;
  vipTier: string;
  vipTierReason: string;
  revenuePotential: number;
  confidenceScore: number;
}

export function useActivityStats() {
  const { user } = useAuth();

  return useQuery<ActivityStats>({
    queryKey: ['activity-stats', user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const userId = user!.id;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      // Parallel queries
      const [dailyRes, eventsRes, sessionsRes, pointsRes, profileRes] = await Promise.all([
        // Daily activity for last 30 days
        supabase
          .from('user_daily_activity')
          .select('day_date, total_events, points_earned, total_duration_seconds, streak_day_number')
          .eq('user_id', userId)
          .gte('day_date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('day_date', { ascending: false }),
        
        // Recent events (last 50)
        supabase
          .from('user_events')
          .select('id, event_name, page_path, points_awarded, created_at, metadata')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),

        // Sessions for device mix and duration
        supabase
          .from('user_sessions')
          .select('device_type, duration_seconds, started_at')
          .eq('user_id', userId)
          .gte('started_at', thirtyDaysAgo.toISOString())
          .order('started_at', { ascending: false })
          .limit(200),

        // Total points
        supabase
          .from('user_points_ledger')
          .select('points, created_at')
          .eq('user_id', userId),

        // User intelligence profile (scores & VIP)
        supabase
          .from('user_interest_profile')
          .select('intent_score, engagement_score, conversion_probability, vip_tier, vip_tier_reason, revenue_potential, confidence_score')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const daily = (dailyRes.data || []) as any[];
      const events = (eventsRes.data || []) as any[];
      const sessions = (sessionsRes.data || []) as any[];
      const points = (pointsRes.data || []) as any[];
      const profile = profileRes.data as any;

      // Days active (30d)
      const daysActive30d = daily.length;

      // Current streak
      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      const sortedDates = daily.map(d => d.day_date).sort().reverse();
      if (sortedDates.length > 0 && (sortedDates[0] === today || sortedDates[0] === yesterday)) {
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prev = new Date(sortedDates[i - 1]);
          const curr = new Date(sortedDates[i]);
          const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
          if (diff === 1) currentStreak++;
          else break;
        }
      }

      // Points this week
      const pointsThisWeek = points
        .filter(p => new Date(p.created_at) >= weekStart)
        .reduce((sum: number, p: any) => sum + (p.points || 0), 0);

      // Total activities (30d)
      const totalActivities30d = daily.reduce((sum: number, d: any) => sum + (d.total_events || 0), 0);

      // Total points all time
      const totalPoints = points.reduce((sum: number, p: any) => sum + (p.points || 0), 0);

      // Sessions stats
      const totalSessions = sessions.length;
      const avgSessionDuration = sessions.length > 0
        ? Math.round(sessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / sessions.length)
        : 0;

      // Daily activity chart data
      const dailyActivity = daily.map((d: any) => ({
        date: d.day_date,
        events: d.total_events || 0,
        points: d.points_earned || 0,
        duration: d.total_duration_seconds || 0,
      })).reverse();

      // Device mix
      const deviceMap = new Map<string, number>();
      sessions.forEach((s: any) => {
        const d = s.device_type || 'unknown';
        deviceMap.set(d, (deviceMap.get(d) || 0) + 1);
      });
      const deviceMix = Array.from(deviceMap.entries()).map(([device, count]) => ({ device, count }));

      return {
        daysActive30d,
        currentStreak,
        pointsThisWeek,
        totalActivities30d,
        totalPoints,
        totalSessions,
        avgSessionDuration,
        dailyActivity,
        recentEvents: events,
        deviceMix,
        intentScore: profile?.intent_score ?? 0,
        engagementScore: profile?.engagement_score ?? 0,
        conversionProbability: profile?.conversion_probability ?? 0,
        vipTier: profile?.vip_tier ?? 'Visitor',
        vipTierReason: profile?.vip_tier_reason ?? '',
        revenuePotential: profile?.revenue_potential ?? 0,
        confidenceScore: profile?.confidence_score ?? 0,
      };
    },
  });
}

// Market Intelligence Service
import { supabase } from '@/integrations/supabase/client';
import {
  MarketDataSource,
  MarketDataPoint,
  MarketPrediction,
  MarketOpportunity,
  MarketAlert,
  InvestorBehaviorInsight,
  EconomicIndicator,
  MarketBriefing,
  ProjectAIScore,
  MarketTrendDirection,
  MarketAlertPriority,
  OpportunityStatus,
  calculateOverallScore,
} from '@/config/market-intelligence-engine';

class MarketIntelligenceService {
  // ==================== DATA SOURCES ====================
  
  async getDataSources(): Promise<MarketDataSource[]> {
    const { data, error } = await supabase
      .from('market_data_sources')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching data sources:', error);
      return [];
    }
    
    return (data || []) as unknown as MarketDataSource[];
  }

  async createDataSource(source: Omit<MarketDataSource, 'id' | 'created_at'>): Promise<MarketDataSource | null> {
    const { data, error } = await supabase
      .from('market_data_sources')
      .insert(source as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating data source:', error);
      return null;
    }
    
    return data as unknown as MarketDataSource;
  }

  // ==================== MARKET DATA POINTS ====================
  
  async getMarketData(filters?: {
    location?: string;
    dataType?: string;
    fromDate?: string;
    limit?: number;
  }): Promise<MarketDataPoint[]> {
    let query = supabase
      .from('market_data_points')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters?.location) {
      query = query.eq('location', filters.location);
    }
    if (filters?.dataType) {
      query = query.eq('data_type', filters.dataType);
    }
    if (filters?.fromDate) {
      query = query.gte('created_at', filters.fromDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching market data:', error);
      return [];
    }
    
    return (data || []) as unknown as MarketDataPoint[];
  }

  async recordMarketData(dataPoint: Omit<MarketDataPoint, 'id' | 'created_at'>): Promise<MarketDataPoint | null> {
    const { data, error } = await supabase
      .from('market_data_points')
      .insert(dataPoint as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error recording market data:', error);
      return null;
    }
    
    return data as unknown as MarketDataPoint;
  }

  // ==================== PREDICTIONS ====================
  
  async getPredictions(filters?: {
    location?: string;
    predictionType?: string;
    validOnly?: boolean;
    limit?: number;
  }): Promise<MarketPrediction[]> {
    let query = supabase
      .from('market_predictions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters?.location) {
      query = query.eq('location', filters.location);
    }
    if (filters?.predictionType) {
      query = query.eq('prediction_type', filters.predictionType);
    }
    if (filters?.validOnly) {
      query = query.gte('valid_until', new Date().toISOString());
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
    
    return (data || []) as unknown as MarketPrediction[];
  }

  async createPrediction(prediction: Omit<MarketPrediction, 'id' | 'created_at'>): Promise<MarketPrediction | null> {
    const { data, error } = await supabase
      .from('market_predictions')
      .insert(prediction as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating prediction:', error);
      return null;
    }
    
    return data as unknown as MarketPrediction;
  }

  // ==================== OPPORTUNITIES ====================
  
  async getOpportunities(filters?: {
    status?: OpportunityStatus;
    location?: string;
    minScore?: number;
    limit?: number;
  }): Promise<MarketOpportunity[]> {
    let query = supabase
      .from('market_opportunities')
      .select('*')
      .order('ai_score', { ascending: false });
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.location) {
      query = query.eq('location', filters.location);
    }
    if (filters?.minScore) {
      query = query.gte('ai_score', filters.minScore);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
    
    return (data || []) as unknown as MarketOpportunity[];
  }

  async createOpportunity(opportunity: Omit<MarketOpportunity, 'id' | 'created_at'>): Promise<MarketOpportunity | null> {
    const { data, error } = await supabase
      .from('market_opportunities')
      .insert(opportunity as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating opportunity:', error);
      return null;
    }
    
    return data as unknown as MarketOpportunity;
  }

  async updateOpportunityStatus(id: string, status: OpportunityStatus): Promise<boolean> {
    const { error } = await supabase
      .from('market_opportunities')
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating opportunity status:', error);
      return false;
    }
    
    return true;
  }

  // ==================== ALERTS ====================
  
  async getAlerts(filters?: {
    priority?: MarketAlertPriority;
    unreadOnly?: boolean;
    category?: string;
    limit?: number;
  }): Promise<MarketAlert[]> {
    let query = supabase
      .from('market_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.unreadOnly) {
      query = query.eq('is_read', false);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
    
    return (data || []) as unknown as MarketAlert[];
  }

  async createAlert(alert: Omit<MarketAlert, 'id' | 'created_at'>): Promise<MarketAlert | null> {
    const { data, error } = await supabase
      .from('market_alerts')
      .insert(alert as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating alert:', error);
      return null;
    }
    
    return data as unknown as MarketAlert;
  }

  async markAlertAsRead(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('market_alerts')
      .update({ is_read: true } as any)
      .eq('id', id);
    
    if (error) {
      console.error('Error marking alert as read:', error);
      return false;
    }
    
    return true;
  }

  async acknowledgeAlert(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('market_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      } as any)
      .eq('id', id);
    
    if (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
    
    return true;
  }

  // ==================== INVESTOR INSIGHTS ====================
  
  async getInvestorInsights(filters?: {
    segment?: string;
    country?: string;
    limit?: number;
  }): Promise<InvestorBehaviorInsight[]> {
    let query = supabase
      .from('investor_behavior_insights')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters?.segment) {
      query = query.eq('investor_segment', filters.segment);
    }
    if (filters?.country) {
      query = query.eq('source_country', filters.country);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching investor insights:', error);
      return [];
    }
    
    return (data || []) as unknown as InvestorBehaviorInsight[];
  }

  async createInvestorInsight(insight: Omit<InvestorBehaviorInsight, 'id' | 'created_at'>): Promise<InvestorBehaviorInsight | null> {
    const { data, error } = await supabase
      .from('investor_behavior_insights')
      .insert(insight as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating investor insight:', error);
      return null;
    }
    
    return data as unknown as InvestorBehaviorInsight;
  }

  // ==================== ECONOMIC INDICATORS ====================
  
  async getEconomicIndicators(filters?: {
    indicatorType?: string;
    region?: string;
    fromDate?: string;
    limit?: number;
  }): Promise<EconomicIndicator[]> {
    const baseQuery = supabase
      .from('economic_indicators')
      .select('*')
      .order('report_date', { ascending: false });
    
    // Build query with filters - use explicit any to avoid deep type instantiation
    let query: any = baseQuery;
    
    if (filters?.indicatorType) {
      query = query.eq('indicator_type', filters.indicatorType);
    }
    if (filters?.region) {
      query = query.eq('region', filters.region);
    }
    if (filters?.fromDate) {
      query = query.gte('report_date', filters.fromDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching economic indicators:', error);
      return [];
    }
    
    return (data || []) as unknown as EconomicIndicator[];
  }

  async recordEconomicIndicator(indicator: Omit<EconomicIndicator, 'id' | 'created_at'>): Promise<EconomicIndicator | null> {
    const { data, error } = await supabase
      .from('economic_indicators')
      .insert(indicator as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error recording economic indicator:', error);
      return null;
    }
    
    return data as unknown as EconomicIndicator;
  }

  // ==================== MARKET BRIEFINGS ====================
  
  async getBriefings(filters?: {
    type?: 'daily' | 'weekly' | 'monthly' | 'special';
    fromDate?: string;
    limit?: number;
  }): Promise<MarketBriefing[]> {
    let query = supabase
      .from('market_briefings')
      .select('*')
      .order('briefing_date', { ascending: false });
    
    if (filters?.type) {
      query = query.eq('briefing_type', filters.type);
    }
    if (filters?.fromDate) {
      query = query.gte('briefing_date', filters.fromDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching briefings:', error);
      return [];
    }
    
    return (data || []) as unknown as MarketBriefing[];
  }

  async createBriefing(briefing: Omit<MarketBriefing, 'id' | 'created_at'>): Promise<MarketBriefing | null> {
    const { data, error } = await supabase
      .from('market_briefings')
      .insert(briefing as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating briefing:', error);
      return null;
    }
    
    return data as unknown as MarketBriefing;
  }

  // ==================== PROJECT AI SCORES ====================
  
  async getProjectScores(filters?: {
    minScore?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    location?: string;
    limit?: number;
  }): Promise<ProjectAIScore[]> {
    let query = supabase
      .from('project_ai_scores')
      .select('*')
      .order('overall_score', { ascending: false });
    
    if (filters?.minScore) {
      query = query.gte('overall_score', filters.minScore);
    }
    if (filters?.riskLevel) {
      query = query.eq('risk_level', filters.riskLevel);
    }
    if (filters?.location) {
      query = query.eq('location', filters.location);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching project scores:', error);
      return [];
    }
    
    return (data || []) as unknown as ProjectAIScore[];
  }

  async createProjectScore(score: Omit<ProjectAIScore, 'id' | 'created_at'>): Promise<ProjectAIScore | null> {
    // Calculate overall score if not provided
    if (!score.overall_score) {
      score.overall_score = calculateOverallScore({
        market_timing: score.market_timing_score,
        developer_reputation: score.developer_reputation_score,
        location_growth: score.location_growth_score,
        investor_interest: score.investor_interest_score,
      });
    }
    
    const { data, error } = await supabase
      .from('project_ai_scores')
      .insert(score as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project score:', error);
      return null;
    }
    
    return data as unknown as ProjectAIScore;
  }

  async updateProjectScore(id: string, updates: Partial<ProjectAIScore>): Promise<boolean> {
    const { error } = await supabase
      .from('project_ai_scores')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating project score:', error);
      return false;
    }
    
    return true;
  }

  // ==================== DASHBOARD AGGREGATIONS ====================
  
  async getDashboardSummary(): Promise<{
    totalPredictions: number;
    newOpportunities: number;
    unreadAlerts: number;
    avgSentiment: number;
    trendingAreas: string[];
    topProjects: ProjectAIScore[];
  }> {
    const [predictions, opportunities, alerts, briefings, projectScores] = await Promise.all([
      this.getPredictions({ limit: 100 }),
      this.getOpportunities({ status: 'new', limit: 50 }),
      this.getAlerts({ unreadOnly: true }),
      this.getBriefings({ limit: 7 }),
      this.getProjectScores({ minScore: 7, limit: 5 }),
    ]);
    
    // Calculate average sentiment from recent briefings
    const sentiments = briefings
      .filter(b => b.sentiment_score !== null)
      .map(b => b.sentiment_score!);
    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      : 0;
    
    // Get trending areas from briefings
    const allAreas = briefings.flatMap(b => b.trending_areas || []);
    const areaCounts = allAreas.reduce((acc, area) => {
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const trendingAreas = Object.entries(areaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area]) => area);
    
    return {
      totalPredictions: predictions.length,
      newOpportunities: opportunities.length,
      unreadAlerts: alerts.length,
      avgSentiment,
      trendingAreas,
      topProjects: projectScores,
    };
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================
  
  subscribeToAlerts(callback: (alert: MarketAlert) => void): () => void {
    const channel = supabase
      .channel('market-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_alerts',
        },
        (payload) => {
          callback(payload.new as unknown as MarketAlert);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeToOpportunities(callback: (opportunity: MarketOpportunity) => void): () => void {
    const channel = supabase
      .channel('market-opportunities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_opportunities',
        },
        (payload) => {
          callback(payload.new as unknown as MarketOpportunity);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const marketIntelligenceService = new MarketIntelligenceService();

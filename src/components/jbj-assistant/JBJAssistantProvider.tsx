import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// AI Workforce Agent Types
export type AgentRole = 
  | 'admin' 
  | 'hr' 
  | 'receptionist' 
  | 'broker' 
  | 'property_manager' 
  | 'marketing_coordinator' 
  | 'graphic_designer'
  | 'support';

export interface AIAgent {
  id: string;
  name: string;
  role: AgentRole;
  title: string;
  avatar: string;
  personality: string;
  capabilities: string[];
  isAvailable: boolean;
}

// JBJ AI Workforce - Human Role Agents
export const JBJ_AI_AGENTS: AIAgent[] = [
  {
    id: 'agent-admin',
    name: 'Michael Sterling',
    role: 'admin',
    title: 'Administrative Director',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    personality: 'Professional, detail-oriented, and highly organized. Speaks with authority while remaining approachable.',
    capabilities: ['Property listing management', 'System administration', 'Document handling', 'Team coordination'],
    isAvailable: true,
  },
  {
    id: 'agent-hr',
    name: 'Sarah Mitchell',
    role: 'hr',
    title: 'HR Manager',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    personality: 'Warm, empathetic, and supportive. Focuses on team well-being and professional development.',
    capabilities: ['Onboarding assistance', 'Training coordination', 'Policy guidance', 'Performance support'],
    isAvailable: true,
  },
  {
    id: 'agent-receptionist',
    name: 'Emily Chen',
    role: 'receptionist',
    title: 'Front Desk Coordinator',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    personality: 'Friendly, welcoming, and efficient. Creates a warm first impression for all visitors and callers.',
    capabilities: ['Visitor management', 'Appointment scheduling', 'Call routing', 'General inquiries'],
    isAvailable: true,
  },
  {
    id: 'agent-broker',
    name: 'James Anderson',
    role: 'broker',
    title: 'Senior Property Advisor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    personality: 'Knowledgeable, consultative, and client-focused. Deep expertise in UAE real estate market.',
    capabilities: ['Property recommendations', 'Market analysis', 'Property advice', 'Buyer/seller guidance'],
    isAvailable: true,
  },
  {
    id: 'agent-property-manager',
    name: 'Sarah Parker',
    role: 'property_manager',
    title: 'Property Management Specialist',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
    personality: 'Systematic, proactive, and solution-oriented. Ensures properties are well-maintained and tenants satisfied.',
    capabilities: ['Maintenance coordination', 'Tenant relations', 'Property inspections', 'Rental management'],
    isAvailable: true,
  },
  {
    id: 'agent-marketing',
    name: 'Alexandra Reed',
    role: 'marketing_coordinator',
    title: 'Marketing Director',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    personality: 'Creative, strategic, and brand-conscious. Passionate about storytelling and visual communication.',
    capabilities: ['Campaign planning', 'Content strategy', 'Social media management', 'Brand development'],
    isAvailable: true,
  },
  {
    id: 'agent-designer',
    name: 'Marcus Williams',
    role: 'graphic_designer',
    title: 'Creative Design Lead',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    personality: 'Artistic, innovative, and detail-oriented. Transforms ideas into stunning visual experiences.',
    capabilities: ['Social media graphics', 'Brochure design', 'Email signatures', 'Brand collateral'],
    isAvailable: true,
  },
  {
    id: 'agent-support',
    name: 'Natalia Petrova',
    role: 'support',
    title: 'Customer Success Manager',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    personality: 'Patient, attentive, and resourceful. Always goes the extra mile to ensure customer satisfaction.',
    capabilities: ['General support', 'Troubleshooting', 'Feature guidance', 'Feedback collection'],
    isAvailable: true,
  },
];

interface AssistantLog {
  id: string;
  agentId: string;
  agentName: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  message: string;
  response: string;
  tool?: string;
  timestamp: Date;
  sessionId: string;
}

interface JBJAssistantContextType {
  agents: AIAgent[];
  activeAgent: AIAgent | null;
  setActiveAgent: (agent: AIAgent | null) => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  logs: AssistantLog[];
  addLog: (log: Omit<AssistantLog, 'id' | 'timestamp'>) => void;
  getAgentByRole: (role: AgentRole) => AIAgent | undefined;
  currentTool: string | null;
  setCurrentTool: (tool: string | null) => void;
}

const JBJAssistantContext = createContext<JBJAssistantContextType | undefined>(undefined);

export const useJBJAssistant = () => {
  const context = useContext(JBJAssistantContext);
  if (!context) {
    throw new Error('useJBJAssistant must be used within JBJAssistantProvider');
  }
  return context;
};

interface JBJAssistantProviderProps {
  children: React.ReactNode;
}

export const JBJAssistantProvider: React.FC<JBJAssistantProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [agents] = useState<AIAgent[]>(JBJ_AI_AGENTS);
  const [activeAgent, setActiveAgent] = useState<AIAgent | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [logs, setLogs] = useState<AssistantLog[]>([]);
  const [currentTool, setCurrentTool] = useState<string | null>(null);

  const addLog = useCallback(async (log: Omit<AssistantLog, 'id' | 'timestamp'>) => {
    const newLog: AssistantLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    setLogs(prev => [...prev, newLog]);

    // Save to database for CRM integration
    try {
      await supabase.from('jbj_analytics').insert({
        user_id: user?.id || null,
        tool_name: log.tool || 'ai_assistant',
        action_type: 'assistant_interaction',
        metadata: {
          agent_id: log.agentId,
          agent_name: log.agentName,
          user_name: log.userName,
          user_email: log.userEmail,
          user_phone: log.userPhone,
          message: log.message,
          response: log.response?.substring(0, 500),
          session_id: log.sessionId,
        }
      });
    } catch (error) {
      console.error('Failed to log assistant interaction:', error);
    }
  }, [user?.id]);

  const getAgentByRole = useCallback((role: AgentRole) => {
    return agents.find(agent => agent.role === role);
  }, [agents]);

  // Set default support agent when opened
  useEffect(() => {
    if (isAssistantOpen && !activeAgent) {
      setActiveAgent(agents.find(a => a.role === 'support') || agents[0]);
    }
  }, [isAssistantOpen, activeAgent, agents]);

  return (
    <JBJAssistantContext.Provider
      value={{
        agents,
        activeAgent,
        setActiveAgent,
        isAssistantOpen,
        setIsAssistantOpen,
        logs,
        addLog,
        getAgentByRole,
        currentTool,
        setCurrentTool,
      }}
    >
      {children}
    </JBJAssistantContext.Provider>
  );
};

export default JBJAssistantProvider;
